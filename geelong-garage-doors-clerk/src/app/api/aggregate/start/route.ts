export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { aggregatorRunner } from '@/lib/aggregator-runner'
import { isAdmin } from '@/lib/admin-guard'

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    const body = await req.json().catch(() => ({}))
    const { brand, prune, minWords, bm25, bm25Threshold } = body || {}
    const { pid, logPath } = aggregatorRunner.start({ brand, prune, minWords, bm25, bm25Threshold })
    return Response.json({ ok: true, pid, logPath })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'Failed to start aggregate' }, { status: 400 })
  }
}
