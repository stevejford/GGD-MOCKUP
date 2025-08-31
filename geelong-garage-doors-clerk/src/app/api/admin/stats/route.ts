export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { isAdmin } from '@/lib/admin-guard'
import { listBrands, listBrandFiles } from '@/lib/crawl-reader'
import { broadcastToClients } from '@/app/api/ws/route'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const crawlRoot = process.env.CRAWL_MD_ROOT || path.resolve(process.cwd(), '..', 'crawlforai', 'output_markdown')
    
    // Get all brands
    const brands = await listBrands()
    
    let totalPages = 0
    let totalAssets = 0
    const brandStats = []

    for (const brand of brands) {
      try {
        const files = await listBrandFiles(brand)
        const mdFiles = files.filter(f => f.endsWith('.md'))
        const pages = mdFiles.length

        // Count assets in brand folder
        const assetsDir = path.join(crawlRoot, brand, 'assets')
        let assets = 0
        if (fs.existsSync(assetsDir)) {
          const assetFiles = fs.readdirSync(assetsDir)
          assets = assetFiles.length
        }

        // Get last crawled date (most recent .md file)
        let lastCrawled = null
        if (pages > 0) {
          const brandDir = path.join(crawlRoot, brand)
          const stats = fs.statSync(path.join(brandDir, mdFiles[0]))
          lastCrawled = stats.mtime.toISOString()
        }

        brandStats.push({
          brand,
          pages,
          assets,
          embeddings: 0, // TODO: Get from vector DB when implemented
          lastCrawled
        })

        totalPages += pages
        totalAssets += assets
      } catch (error) {
        console.error(`Error processing brand ${brand}:`, error)
      }
    }

    // Sort brands by page count (descending)
    brandStats.sort((a, b) => b.pages - a.pages)

    // Mock recent activity (replace with real data from logs/DB)
    const recentActivity = [
      {
        action: 'Crawl completed',
        brand: 'b-and-d',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        status: 'success' as const
      },
      {
        action: 'Assets downloaded',
        brand: 'steel-line',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        status: 'success' as const
      },
      {
        action: 'Embeddings generated',
        brand: 'centurion',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
        status: 'success' as const
      }
    ]

    const adminStats = {
      totalPages,
      totalBrands: brands.length,
      totalAssets,
      totalEmbeddings: 0, // TODO: Get from vector DB
      brandStats,
      recentActivity
    }

    // Broadcast admin stats to WebSocket clients
    broadcastToClients({
      type: 'admin_stats_update',
      data: adminStats,
      timestamp: new Date().toISOString()
    })

    return Response.json(adminStats)

  } catch (error: any) {
    console.error('Stats API error:', error)
    return Response.json(
      { ok: false, error: error?.message || 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
