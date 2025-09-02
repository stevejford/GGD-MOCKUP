export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { isAdmin } from '@/lib/admin-guard'
import { listBrands, listBrandFiles } from '@/lib/crawl-reader'
import { broadcastToClients } from '@/app/api/ws/route'
import { Client } from 'pg'
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
    let totalEmbeddings = 0
    const brandStats = []

    // Get database connection for embeddings
    const conn = process.env.CRAWLER_DATABASE_URL || process.env.DATABASE_URL
    let brandEmbeddings = new Map()

    if (conn) {
      try {
        console.log('🔌 Connecting to Neon database for embedding stats...')
        const client = new Client({ connectionString: conn })
        await client.connect()

        // Get embeddings per brand
        const brandEmbeddingsResult = await client.query(`
          SELECT brand, COUNT(*) as embedding_count
          FROM crawl_embeddings_vec
          GROUP BY brand
        `)

        console.log('📊 Brand embeddings found:', brandEmbeddingsResult.rows.length, 'brands')

        brandEmbeddingsResult.rows.forEach(row => {
          brandEmbeddings.set(row.brand, parseInt(row.embedding_count))
        })

        // Get total embeddings
        const totalEmbeddingsResult = await client.query('SELECT COUNT(*) as count FROM crawl_embeddings_vec')
        totalEmbeddings = parseInt(totalEmbeddingsResult.rows[0]?.count || '0')

        console.log('✅ Total embeddings found:', totalEmbeddings)

        await client.end()
      } catch (error) {
        console.error('❌ Failed to fetch embedding stats:', error)
        // Continue without embeddings data
      }
    }

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

        const embeddingCount = brandEmbeddings.get(brand) || 0
        console.log(`📈 Brand ${brand}: ${pages} pages, ${assets} assets, ${embeddingCount} embeddings`)

        brandStats.push({
          brand,
          pages,
          assets,
          embeddings: embeddingCount, // Real embedding count from database
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
      totalEmbeddings, // Real total from database
      brandStats,
      recentActivity
    }

    console.log('📊 Final admin stats:', {
      totalPages,
      totalBrands: brands.length,
      totalAssets,
      totalEmbeddings,
      brandsWithEmbeddings: brandStats.filter(b => b.embeddings > 0).length
    })

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
