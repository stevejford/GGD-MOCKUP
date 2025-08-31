export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { isAdmin } from '@/lib/admin-guard'
import { getAllSites, createSite, getSiteStats, ScrapedSite } from '@/lib/neon-db'

interface ScrapedSite {
  id: number
  site_id: string
  site_name: string
  url: string
  description?: string
  created_at: string
  updated_at: string
  last_scraped_at?: string
  total_pages: number
  total_assets: number
  status: string
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Get all sites from the database
    const sites = await getAllSites()

    // Update stats for each site
    const sitesWithStats = await Promise.all(
      sites.map(async (site) => {
        try {
          const stats = await getSiteStats(site.site_id)
          return {
            ...site,
            total_pages: stats.totalPages,
            total_assets: stats.totalAssets
          }
        } catch (error) {
          console.error(`Failed to get stats for site ${site.site_id}:`, error)
          return site
        }
      })
    )

    return Response.json({
      success: true,
      sites: sitesWithStats,
      total: sitesWithStats.length
    })

  } catch (error: any) {
    console.error('Sites API error:', error)
    return Response.json({
      success: false,
      error: error?.message || 'Internal server error',
      sites: [],
      total: 0
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { site_id, site_name, url, description } = body

    if (!site_id || !site_name || !url) {
      return Response.json({
        success: false,
        error: 'site_id, site_name, and url are required'
      }, { status: 400 })
    }

    // Create the site in the database
    const newSite = await createSite({
      site_id,
      site_name,
      url,
      description,
      total_pages: 0,
      total_assets: 0,
      status: 'active'
    })

    return Response.json({
      success: true,
      site: newSite,
      message: 'Site registered successfully'
    })

  } catch (error: any) {
    console.error('Sites POST API error:', error)

    // Handle unique constraint violations
    if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
      return Response.json({
        success: false,
        error: 'A site with this ID already exists'
      }, { status: 409 })
    }

    return Response.json({
      success: false,
      error: error?.message || 'Internal server error'
    }, { status: 500 })
  }
}
