import { NextRequest } from 'next/server'
import { Client } from 'pg'
import { isAdmin } from '@/lib/admin-guard'

export const runtime = 'nodejs'

async function initDb() {
  // Allow in dev; protect in prod
  if (process.env.NODE_ENV !== 'development') {
    if (!(await isAdmin())) return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }

  const conn = process.env.CRAWLER_DATABASE_URL || process.env.DATABASE_URL
  if (!conn) return Response.json({ ok: false, error: 'Database URL missing (set CRAWLER_DATABASE_URL)' }, { status: 400 })
  if (/^postgres(ql)?:\/\/.+@/.test(conn) && !/^postgres(ql)?:\/\/[^:]+:/.test(conn)) {
    return Response.json({ ok: false, error: 'Database URL appears to be missing a password before @' }, { status: 400 })
  }

  const client = new Client({ connectionString: conn })
  await client.connect()

  await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`)

  await client.query(`
    CREATE TABLE IF NOT EXISTS crawl_embeddings_vec (
      id bigserial PRIMARY KEY,
      brand text NOT NULL,
      file text NOT NULL,
      chunk_index int NOT NULL,
      url text,
      content text NOT NULL,
      embedding vector(1536) NOT NULL,
      UNIQUE (brand, file, chunk_index)
    );
  `)
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = ANY(current_schemas(true)) AND indexname = 'crawl_embeddings_vec_hnsw_cosine'
      ) THEN
        EXECUTE 'CREATE INDEX crawl_embeddings_vec_hnsw_cosine ON crawl_embeddings_vec USING hnsw (embedding vector_cosine_ops)';
      END IF;
    END $$;
  `)

  await client.query(`
    CREATE TABLE IF NOT EXISTS brand_pages (
      slug text NOT NULL,
      url text PRIMARY KEY,
      title text,
      description text,
      h1 text,
      headings jsonb,
      text text,
      links jsonb,
      fetched_at timestamptz DEFAULT now()
    );
  `)

  await client.end()
  return Response.json({ ok: true })
}

export async function POST(_req: NextRequest) {
  try { return await initDb() } catch (e: any) { return Response.json({ ok: false, error: e?.message || 'init error' }, { status: 500 }) }
}

// Also allow GET for convenience in development/tools
export async function GET(_req: NextRequest) {
  try { return await initDb() } catch (e: any) { return Response.json({ ok: false, error: e?.message || 'init error' }, { status: 500 }) }
}
