export const runtime = 'nodejs'
import { scraperRunner } from '@/lib/scraper-runner'
import { isAdmin } from '@/lib/admin-guard'
import { broadcastToClients } from '@/app/api/ws/route'

export async function GET() {
  if (!(await isAdmin())) return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })

  const status = scraperRunner.status()

  // Add more detailed logging when crawler is running
  if (status.running) {
    console.log('🕷️ Crawler Status:', {
      running: status.running,
      pid: status.pid,
      logLines: status.lastLogLines?.length || 0,
      lastLog: status.lastLogLines?.[status.lastLogLines.length - 1] || 'No logs',
      error: status.error || 'No errors'
    })
  }

  // Broadcast scrape status to WebSocket clients
  broadcastToClients({
    type: 'scrape_status_update',
    data: status,
    timestamp: new Date().toISOString()
  })

  return Response.json(status)
}
