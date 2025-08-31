export const runtime = 'nodejs'
import { aggregatorRunner } from '@/lib/aggregator-runner'
import { isAdmin } from '@/lib/admin-guard'

export async function POST() {
  if (!(await isAdmin())) return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  const ok = aggregatorRunner.stop()
  return Response.json({ ok })
}
