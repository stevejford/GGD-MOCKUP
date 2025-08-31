import { NextRequest } from 'next/server'
import { listBrandFiles, readBrandFile } from '@/lib/crawl-reader'
import { isAdmin } from '@/lib/admin-guard'
import { Client } from 'pg'
import OpenAI from 'openai'
import crypto from 'crypto'

type Body = {
  brand: string
  chunkSize?: number
  overlap?: number
  model?: string
}

function splitText(text: string, size: number, overlap: number) {
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
  return crypto.createHash('sha256').update(content.trim(), 'utf8').digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) return Response.json({ error: 'Forbidden' }, { status: 403 })
    const body = (await req.json()) as Body
    const brand = body.brand
    if (!brand) return Response.json({ error: 'brand required' }, { status: 400 })

    const chunkSize = body.chunkSize ?? 1500
    const overlap = body.overlap ?? 200
    const modelName = body.model ?? 'text-embedding-3-small'

    const files = await listBrandFiles(brand)
    if (!files.length) return Response.json({ ok: true, chunks: 0 })

    const conn = process.env.CRAWLER_DATABASE_URL || process.env.DATABASE_URL
    if (!conn) return Response.json({ error: 'Database URL missing (set CRAWLER_DATABASE_URL)' }, { status: 400 })
    if (/^postgres(ql)?:\/\/.+@/.test(conn) && !/^postgres(ql)?:\/\/[^:]+:/.test(conn)) {
      return Response.json({ error: 'Database URL appears to be missing a password before @' }, { status: 400 })
    }
    const client = new Client({ connectionString: conn })
    await client.connect()
    // Enable pgvector + vector table for cosine distance search
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS crawl_embeddings_vec (
        id bigserial PRIMARY KEY,
        brand text NOT NULL,
        file text NOT NULL,
        chunk_index int NOT NULL,
        url text,
        content text NOT NULL,
        content_hash text,
        embedding vector(1536) NOT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (brand, file, chunk_index)
      );
    `)

    // Add new columns if they don't exist (for existing tables)
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
    // Cosine distance HNSW index (safe to run repeatedly)
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
    let total = 0
    let skipped = 0

    for (const f of files) {
      const { markdown, url } = await readBrandFile(brand, f)
      if (!markdown) continue

      // Check if file content has changed
      const fileContentHash = generateContentHash(markdown)
      const existingFile = await client.query(
        `SELECT DISTINCT content_hash FROM crawl_embeddings_vec
         WHERE brand = $1 AND file = $2 AND content_hash IS NOT NULL
         LIMIT 1`,
        [brand, f]
      )

      if (existingFile.rows.length > 0 && existingFile.rows[0].content_hash === fileContentHash) {
        console.log(`Skipping unchanged file: ${f}`)
        const existingChunks = await client.query(
          `SELECT COUNT(*) as count FROM crawl_embeddings_vec WHERE brand = $1 AND file = $2`,
          [brand, f]
        )
        skipped += parseInt(existingChunks.rows[0]?.count || '0')
        continue
      }

      console.log(`Processing ${existingFile.rows.length > 0 ? 'changed' : 'new'} file: ${f}`)
      const chunks = splitText(markdown, chunkSize, overlap)

      // batch to limit payload
      for (let i = 0; i < chunks.length; i += 50) {
        const batch = chunks.slice(i, i + 50)
        const emb = await openai.embeddings.create({ model: modelName, input: batch })
        for (let j = 0; j < batch.length; j++) {
          const vec = emb.data[j].embedding
          const vecLiteral = '[' + vec.join(',') + ']'
          await client.query(
            `INSERT INTO crawl_embeddings_vec(brand, file, chunk_index, url, content, content_hash, embedding, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7::vector,CURRENT_TIMESTAMP)
             ON CONFLICT (brand, file, chunk_index)
             DO UPDATE SET url = EXCLUDED.url, content = EXCLUDED.content, content_hash = EXCLUDED.content_hash, embedding = EXCLUDED.embedding, updated_at = CURRENT_TIMESTAMP`,
            [brand, f, i + j, url, batch[j], fileContentHash, vecLiteral]
          )
          total++
        }
      }
    }

    console.log(`Embedding complete: ${total} processed, ${skipped} skipped`)
    await client.end()
    return Response.json({
      ok: true,
      chunks: total,
      skipped: skipped,
      message: `Processed ${total} chunks, skipped ${skipped} unchanged chunks`
    })
  } catch (e: any) {
    return Response.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
