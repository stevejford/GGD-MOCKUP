import { Client } from 'pg'
import OpenAI from 'openai'
import { listBrandFiles, readBrandFile } from '@/lib/crawl-reader'
import crypto from 'crypto'

interface EmbeddingConfig {
  chunkSize?: number
  overlap?: number
  model?: string
}

interface EmbeddingResult {
  success: boolean
  totalChunks: number
  newChunks: number
  skippedChunks: number
  error?: string
}

function splitText(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = []
  let start = 0
  const n = text.length
  while (start < n) {
    const end = Math.min(n, start + size)
    chunks.push(text.slice(start, end))
    if (end === n) break
    start = Math.max(0, end - overlap)
  }
  return chunks
}

function generateContentHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex')
}

export async function createEmbeddingsForSite(
  siteId: string, 
  config: EmbeddingConfig = {}
): Promise<EmbeddingResult> {
  try {
    const chunkSize = config.chunkSize ?? 1500
    const overlap = config.overlap ?? 200
    const modelName = config.model ?? 'text-embedding-3-small'

    console.log(`Starting embedding creation for site: ${siteId}`)

    // Get all files for this site/brand
    const files = await listBrandFiles(siteId)
    if (!files.length) {
      console.log(`No files found for site: ${siteId}`)
      return {
        success: true,
        totalChunks: 0,
        newChunks: 0,
        skippedChunks: 0
      }
    }

    // Database connection
    const conn = process.env.DATABASE_URL
    if (!conn) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    const client = new Client({ connectionString: conn })
    await client.connect()

    // Ensure pgvector extension and table exist
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS crawl_embeddings_vec (
        id bigserial PRIMARY KEY,
        brand text NOT NULL,
        file text NOT NULL,
        chunk_index int NOT NULL,
        url text,
        content text NOT NULL,
        content_hash text NOT NULL,
        embedding vector(1536) NOT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (brand, file, chunk_index)
      );
    `)

    // Add content_hash column if it doesn't exist (for existing tables)
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'crawl_embeddings_vec' AND column_name = 'content_hash'
        ) THEN
          ALTER TABLE crawl_embeddings_vec ADD COLUMN content_hash text;
          ALTER TABLE crawl_embeddings_vec ADD COLUMN created_at timestamp DEFAULT CURRENT_TIMESTAMP;
          ALTER TABLE crawl_embeddings_vec ADD COLUMN updated_at timestamp DEFAULT CURRENT_TIMESTAMP;
        END IF;
      END $$;
    `)

    // Create HNSW index if it doesn't exist
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE schemaname = ANY(current_schemas(true)) AND indexname = 'crawl_embeddings_vec_hnsw_cosine'
        ) THEN
          EXECUTE 'CREATE INDEX crawl_embeddings_vec_hnsw_cosine ON crawl_embeddings_vec USING hnsw (embedding vector_cosine_ops)';
        END IF;
      END $$;
    `)

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    let totalChunks = 0
    let newChunks = 0
    let skippedChunks = 0

    for (const file of files) {
      try {
        console.log(`Processing file: ${file}`)
        const { markdown, url } = await readBrandFile(siteId, file)
        if (!markdown) {
          console.log(`No markdown content for file: ${file}`)
          continue
        }

        const chunks = splitText(markdown, chunkSize, overlap)
        console.log(`Split into ${chunks.length} chunks for file: ${file}`)

        // Check existing chunks for this file to see what needs updating
        const existingChunks = await client.query(
          `SELECT chunk_index, content_hash FROM crawl_embeddings_vec 
           WHERE brand = $1 AND file = $2`,
          [siteId, file]
        )

        const existingHashes = new Map<number, string>()
        existingChunks.rows.forEach(row => {
          existingHashes.set(row.chunk_index, row.content_hash)
        })

        // Process chunks in batches
        for (let i = 0; i < chunks.length; i += 50) {
          const batch = chunks.slice(i, i + 50)
          const chunksToEmbed: Array<{index: number, content: string, hash: string}> = []

          // Check which chunks need embedding (new or changed content)
          for (let j = 0; j < batch.length; j++) {
            const chunkIndex = i + j
            const content = batch[j]
            const contentHash = generateContentHash(content)
            
            const existingHash = existingHashes.get(chunkIndex)
            if (existingHash !== contentHash) {
              // Content is new or changed, needs embedding
              chunksToEmbed.push({
                index: chunkIndex,
                content,
                hash: contentHash
              })
            } else {
              // Content unchanged, skip
              skippedChunks++
              console.log(`Skipping unchanged chunk ${chunkIndex} for file: ${file}`)
            }
          }

          if (chunksToEmbed.length === 0) {
            console.log(`No new chunks to embed in batch starting at ${i}`)
            continue
          }

          console.log(`Embedding ${chunksToEmbed.length} chunks (batch starting at ${i})`)

          // Create embeddings for chunks that need it
          const embeddingInput = chunksToEmbed.map(c => c.content)
          const embeddingResponse = await openai.embeddings.create({ 
            model: modelName, 
            input: embeddingInput 
          })

          // Store embeddings
          for (let k = 0; k < chunksToEmbed.length; k++) {
            const chunk = chunksToEmbed[k]
            const embedding = embeddingResponse.data[k].embedding
            const vecLiteral = '[' + embedding.join(',') + ']'

            await client.query(
              `INSERT INTO crawl_embeddings_vec(brand, file, chunk_index, url, content, content_hash, embedding, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7::vector, CURRENT_TIMESTAMP)
               ON CONFLICT (brand, file, chunk_index)
               DO UPDATE SET 
                 url = EXCLUDED.url, 
                 content = EXCLUDED.content, 
                 content_hash = EXCLUDED.content_hash,
                 embedding = EXCLUDED.embedding,
                 updated_at = CURRENT_TIMESTAMP`,
              [siteId, file, chunk.index, url, chunk.content, chunk.hash, vecLiteral]
            )

            newChunks++
            totalChunks++
          }
        }

        // Clean up old chunks that no longer exist
        if (chunks.length < existingChunks.rows.length) {
          await client.query(
            `DELETE FROM crawl_embeddings_vec 
             WHERE brand = $1 AND file = $2 AND chunk_index >= $3`,
            [siteId, file, chunks.length]
          )
          console.log(`Cleaned up old chunks for file: ${file}`)
        }

      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError)
        // Continue with other files
      }
    }

    await client.end()

    console.log(`Embedding creation complete for ${siteId}: ${newChunks} new, ${skippedChunks} skipped, ${totalChunks} total`)

    return {
      success: true,
      totalChunks,
      newChunks,
      skippedChunks
    }

  } catch (error) {
    console.error('Error creating embeddings:', error)
    return {
      success: false,
      totalChunks: 0,
      newChunks: 0,
      skippedChunks: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
