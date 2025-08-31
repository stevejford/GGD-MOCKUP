export const runtime = 'nodejs'
import { aggregatorRunner } from '@/lib/aggregator-runner'
import { isAdmin } from '@/lib/admin-guard'
import { broadcastToClients } from '@/app/api/ws/route'

export async function GET() {
  if (!(await isAdmin())) return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })

  const status = aggregatorRunner.status()

  // Broadcast aggregate status to WebSocket clients
  broadcastToClients({
    type: 'aggregate_status_update',
    data: status,
    timestamp: new Date().toISOString()
  })

  return Response.json(status)
}
