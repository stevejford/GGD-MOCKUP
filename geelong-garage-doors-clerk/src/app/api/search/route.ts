import { NextRequest } from 'next/server'
import { Client } from 'pg'
import { isAdmin } from '@/lib/admin-guard'
import OpenAI from 'openai'

type Body = {
  q: string
  brand?: string
  k?: number
  model?: string
  metric?: 'cosine' | 'l2' | 'ip'
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) return Response.json({ error: 'Forbidden' }, { status: 403 })
    const body = (await req.json()) as Body
    const q = body.q
    if (!q) return Response.json({ error: 'q required' }, { status: 400 })
    const k = body.k ?? 5
    const modelName = body.model ?? 'text-embedding-3-small'
    const metric = body.metric ?? 'cosine'

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const emb = await openai.embeddings.create({ model: modelName, input: [q] })
    const v = emb.data[0].embedding
    const vecLiteral = '[' + v.join(',') + ']'

    const conn = process.env.CRAWLER_DATABASE_URL || process.env.DATABASE_URL
    if (!conn) return Response.json({ error: 'Database URL missing (set CRAWLER_DATABASE_URL)' }, { status: 400 })
    if (/^postgres(ql)?:\/\/.+@/.test(conn) && !/^postgres(ql)?:\/\/[^:]+:/.test(conn)) {
      return Response.json({ error: 'Database URL appears to be missing a password before @' }, { status: 400 })
    }
    const client = new Client({ connectionString: conn })
    await client.connect()
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`)

    const where = body.brand ? `WHERE brand = $2` : ''
    const params: any[] = [vecLiteral]
    if (body.brand) params.push(body.brand)
    params.push(k)

    let orderExpr = 'embedding <=> $1::vector' // cosine distance
    if (metric === 'l2') orderExpr = 'embedding <-> $1::vector'
    if (metric === 'ip') orderExpr = '(embedding <#> $1::vector)'

    const sql = `
      SELECT brand, file, chunk_index, url, content, ${orderExpr} AS distance
      FROM crawl_embeddings_vec
      ${where}
      ORDER BY ${orderExpr}
      LIMIT $${body.brand ? 3 : 2}
    `
    const { rows } = await client.query(sql, params)
    await client.end()
    return Response.json({ ok: true, metric, results: rows })
  } catch (e: any) {
    return Response.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
