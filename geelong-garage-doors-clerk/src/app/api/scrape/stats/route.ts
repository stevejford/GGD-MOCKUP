export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { isAdmin } from '@/lib/admin-guard'
import { scraperRunner } from '@/lib/scraper-runner'
import { broadcastToClients } from '@/app/api/ws/route'

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    // Just copy the status API logic exactly
    const status = scraperRunner.status()

    // Calculate real progress from logs
    const logLines = status.lastLogLines || []

    // Count completed pages (lines with "| ✓ | ⏱:" pattern)
    const completedPages = logLines.filter(line =>
      line.includes('| ✓ | ⏱:') && !line.includes('asset')
    ).length

    // Count assets being processed
    const assetsProcessed = logLines.filter(line =>
      line.includes('Using cached asset') || line.includes('Downloading asset')
    ).length

    const totalExpected = 500 // Default estimate
    const currentPages = Math.max(completedPages, status.running ? 1 : 0)
    const percentage = totalExpected > 0 ? Math.round((currentPages / totalExpected) * 100) : 0

    // Extract current activity from recent logs
    let currentActivity = status.running ? 'Crawling...' : 'Stopped'
    if (logLines.length > 0) {
      const lastLog = logLines[logLines.length - 1]
      if (lastLog.includes('[FETCH]')) {
        const urlMatch = lastLog.match(/https?:\/\/[^\s]+/)
        if (urlMatch) {
          const url = urlMatch[0]
          const pageName = url.split('/').filter(p => p).pop() || 'page'
          currentActivity = `Fetching: ${pageName}`
        }
      } else if (lastLog.includes('| ✓ | ⏱:')) {
        const timeMatch = lastLog.match(/⏱:\s*([\d.]+)s/)
        const time = timeMatch ? timeMatch[1] : '?'
        currentActivity = `Page completed in ${time}s`
      } else if (lastLog.includes('Using cached asset') || lastLog.includes('Downloading asset')) {
        const assetMatch = lastLog.match(/([^\/]+\.(png|jpg|jpeg|gif|webp|svg|pdf))/)
        if (assetMatch) {
          currentActivity = `Processing: ${assetMatch[1]}`
        } else {
          currentActivity = 'Processing assets...'
        }
      }
    }

    const stats = {
      pages: currentPages,
      images: 0,
      pdfs: 0,
      txtFiles: 0,
      otherFiles: 0,
      totalAssets: 0,
      recentFiles: [],
      recentPages: [],
      isRunning: status.running,
      liveLogLines: logLines,
      currentActivity,
      progress: {
        currentPages,
        totalExpectedPages: totalExpected,
        percentage,
        pagesRemaining: Math.max(0, totalExpected - currentPages)
      },
      errors: []
    }

    // Log stats to Logfire for dashboard (temporarily disabled)
    // if (status.running) {
    //   const duration = Date.now() - (scraperRunner as any).startedAt || 0
    //   const pagesPerMinute = duration > 0 ? (currentPages / (duration / 60000)) : 0
    //
    //   logCrawlerStats({
    //     pages: currentPages,
    //     assets: assetsProcessed,
    //     errors: 0, // Could extract from logs
    //     duration,
    //     pagesPerMinute
    //   })
    // }

    broadcastToClients({
      type: 'stats_update',
      data: stats,
      timestamp: new Date().toISOString()
    })

    return Response.json(stats)

  } catch (error: any) {
    return Response.json({
      pages: 0,
      images: 0,
      pdfs: 0,
      txtFiles: 0,
      otherFiles: 0,
      totalAssets: 0,
      recentFiles: [],
      recentPages: [],
      isRunning: false,
      liveLogLines: [],
      currentActivity: 'Error',
      progress: { currentPages: 0, totalExpectedPages: 0, percentage: 0, pagesRemaining: 0 },
      errors: []
    }, { status: 500 })
  }
}



