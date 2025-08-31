export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { isAdmin } from '@/lib/admin-guard'
import { scraperRunner } from '@/lib/scraper-runner'

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    const body = await req.json().catch(() => ({}))
    const { brand, downloadAssets, wait, delay } = body || {}
    const { pid, logPath } = scraperRunner.start({ brand, downloadAssets, wait, delay })
    return Response.json({ ok: true, pid, logPath })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'Failed to start' }, { status: 400 })
  }
}
