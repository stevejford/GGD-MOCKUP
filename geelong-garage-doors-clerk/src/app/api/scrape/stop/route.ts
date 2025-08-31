export const runtime = 'nodejs'
import { scraperRunner } from '@/lib/scraper-runner'
import { isAdmin } from '@/lib/admin-guard'

export async function POST() {
  if (!(await isAdmin())) return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  const ok = await scraperRunner.stop()
  return Response.json({ ok })
}
