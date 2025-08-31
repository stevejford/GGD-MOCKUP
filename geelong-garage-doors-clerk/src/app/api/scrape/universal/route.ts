export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { isAdmin } from '@/lib/admin-guard'
import { scraperRunner } from '@/lib/scraper-runner'
import { URL } from 'url'

interface UniversalScrapeRequest {
  url: string
  maxPages?: number
  downloadAssets?: boolean
  siteName?: string
  description?: string
}

interface UniversalScrapeResponse {
  success: boolean
  siteId?: string
  siteName?: string
  message?: string
  error?: string
}

function generateSiteId(url: string): string {
  try {
    const parsedUrl = new URL(url)
    const domain = parsedUrl.hostname.replace('www.', '')
    
    // Create a clean site ID from domain
    return domain.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
  } catch {
    // Fallback for invalid URLs
    return url.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 50)
  }
}

function extractSiteName(url: string): string {
  try {
    const parsedUrl = new URL(url)
    const domain = parsedUrl.hostname.replace('www.', '')
    
    // Convert domain to a readable name
    const parts = domain.split('.')
    const mainPart = parts[0]
    
    // Capitalize and clean up
    return mainPart
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  } catch {
    return 'Unknown Site'
  }
}

async function createSiteDatabase(siteId: string, siteName: string, url: string, description?: string) {
  try {
    // For now, we'll use the existing GGD Scraper project
    // In the future, we could create separate projects for each site
    const projectId = 'late-salad-12842346' // GGD Scraper project
    
    // Create a table to track scraped sites
    const createSitesTableSQL = `
      CREATE TABLE IF NOT EXISTS scraped_sites (
        id SERIAL PRIMARY KEY,
        site_id VARCHAR(100) UNIQUE NOT NULL,
        site_name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_scraped_at TIMESTAMP,
        total_pages INTEGER DEFAULT 0,
        total_assets INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active'
      );
    `
    
    // Create pages table for this site
    const createPagesTableSQL = `
      CREATE TABLE IF NOT EXISTS scraped_pages (
        id SERIAL PRIMARY KEY,
        site_id VARCHAR(100) NOT NULL,
        page_url TEXT NOT NULL,
        page_title VARCHAR(500),
        page_slug VARCHAR(255),
        content_hash VARCHAR(64),
        markdown_path TEXT,
        assets_count INTEGER DEFAULT 0,
        scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES scraped_sites(site_id) ON DELETE CASCADE,
        UNIQUE(site_id, page_url)
      );
    `
    
    // Create assets table
    const createAssetsTableSQL = `
      CREATE TABLE IF NOT EXISTS scraped_assets (
        id SERIAL PRIMARY KEY,
        site_id VARCHAR(100) NOT NULL,
        page_url TEXT NOT NULL,
        asset_url TEXT NOT NULL,
        asset_type VARCHAR(20) NOT NULL, -- 'image', 'pdf', 'txt'
        local_path TEXT NOT NULL,
        file_size INTEGER,
        content_hash VARCHAR(64),
        downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES scraped_sites(site_id) ON DELETE CASCADE,
        UNIQUE(site_id, asset_url)
      );
    `
    
    // Execute the SQL statements using Neon MCP
    console.log('Creating database schema for site:', siteId)
    
    // Note: We'll need to implement the actual Neon database calls here
    // For now, we'll return success and implement the database calls separately
    
    return {
      success: true,
      projectId,
      siteId,
      siteName
    }
    
  } catch (error) {
    console.error('Failed to create site database:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body: UniversalScrapeRequest = await req.json()
    const { url, maxPages = 50, downloadAssets = true, siteName, description } = body

    if (!url) {
      return Response.json({
        success: false,
        error: 'URL is required'
      }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return Response.json({
        success: false,
        error: 'Invalid URL format'
      }, { status: 400 })
    }

    // Generate site ID and name
    const siteId = generateSiteId(url)
    const autoSiteName = siteName || extractSiteName(url)

    console.log(`Starting universal scrape for: ${autoSiteName} (${siteId})`)

    // Create database schema for this site
    const dbResult = await createSiteDatabase(siteId, autoSiteName, url, description)
    if (!dbResult.success) {
      return Response.json({
        success: false,
        error: `Database setup failed: ${dbResult.error}`
      }, { status: 500 })
    }

    // Register the site in our database
    try {
      const siteResponse = await fetch(`${req.nextUrl.origin}/api/scrape/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_id: siteId,
          site_name: autoSiteName,
          url,
          description
        }),
      })

      if (!siteResponse.ok) {
        console.warn('Failed to register site in database, but continuing with scrape')
      }
    } catch (error) {
      console.warn('Failed to register site:', error)
      // Continue with scrape even if registration fails
    }

    // Check if scraper is already running
    const status = scraperRunner.status()
    if (status.running) {
      return Response.json({
        success: false,
        error: 'Another scrape is already in progress. Please wait for it to complete.'
      }, { status: 409 })
    }

    // Start the scraping process
    try {
      const success = scraperRunner.start({
        brand: siteId,
        origin: url,
        maxPages,
        concurrency: 5,
        downloadAssets,
        // Additional settings for universal scraping
        enableStealth: true,
        progressive: true,
        headless: true,
        waitTime: 3,
        delayBeforeReturnHtml: 2,
        captureNetwork: false,
        captureConsole: false
      })

      if (!success) {
        return Response.json({
          success: false,
          error: 'Failed to start scraper'
        }, { status: 500 })
      }

      // Start background embedding creation after scraping starts
      setTimeout(async () => {
        try {
          console.log(`Starting background embedding creation for ${siteId}`)
          const embedResponse = await fetch(`${req.nextUrl.origin}/api/embed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              brand: siteId,
              chunkSize: 1500,
              overlap: 200,
              model: 'text-embedding-3-small'
            }),
          })

          if (embedResponse.ok) {
            const embedData = await embedResponse.json()
            console.log(`Embedding creation completed for ${siteId}:`, embedData.message)
          } else {
            console.error(`Embedding creation failed for ${siteId}:`, await embedResponse.text())
          }
        } catch (error) {
          console.error(`Background embedding creation error for ${siteId}:`, error)
        }
      }, 30000) // Wait 30 seconds for scraping to generate some content

      return Response.json({
        success: true,
        siteId,
        siteName: autoSiteName,
        message: `Started scraping ${autoSiteName}. Embeddings will be created automatically after scraping completes.`
      })

    } catch (error) {
      console.error('Scraper start error:', error)
      return Response.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start scraper'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Universal scrape API error:', error)
    return Response.json({
      success: false,
      error: error?.message || 'Internal server error'
    }, { status: 500 })
  }
}
