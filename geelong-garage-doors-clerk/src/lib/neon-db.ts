import { neon } from '@neondatabase/serverless'

// Neon database connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uv2GZhH7cEXq@ep-shy-darkness-a7sppcpv-pooler.ap-southeast-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require'

const sql = neon(DATABASE_URL)

export interface ScrapedSite {
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

export interface ScrapedPage {
  id: number
  site_id: string
  page_url: string
  page_title?: string
  page_slug?: string
  content_hash?: string
  markdown_path?: string
  assets_count: number
  scraped_at: string
  file_size?: number
  word_count?: number
  last_modified?: string
}

export interface ScrapedAsset {
  id: number
  site_id: string
  page_url: string
  asset_url: string
  asset_type: 'image' | 'pdf' | 'txt'
  local_path: string
  file_size?: number
  content_hash?: string
  downloaded_at: string
}

// Sites operations
export async function getAllSites(): Promise<ScrapedSite[]> {
  try {
    const result = await sql`
      SELECT * FROM scraped_sites 
      ORDER BY updated_at DESC
    `
    return result as ScrapedSite[]
  } catch (error) {
    console.error('Error fetching sites:', error)
    throw error
  }
}

export async function getSiteById(siteId: string): Promise<ScrapedSite | null> {
  try {
    const result = await sql`
      SELECT * FROM scraped_sites 
      WHERE site_id = ${siteId}
      LIMIT 1
    `
    return result[0] as ScrapedSite || null
  } catch (error) {
    console.error('Error fetching site:', error)
    throw error
  }
}

export async function createSite(site: Omit<ScrapedSite, 'id' | 'created_at' | 'updated_at'>): Promise<ScrapedSite> {
  try {
    const result = await sql`
      INSERT INTO scraped_sites (
        site_id, site_name, url, description, 
        total_pages, total_assets, status
      ) VALUES (
        ${site.site_id}, ${site.site_name}, ${site.url}, ${site.description || null},
        ${site.total_pages}, ${site.total_assets}, ${site.status}
      )
      RETURNING *
    `
    return result[0] as ScrapedSite
  } catch (error) {
    console.error('Error creating site:', error)
    throw error
  }
}

export async function updateSite(siteId: string, updates: Partial<ScrapedSite>): Promise<ScrapedSite | null> {
  try {
    const setClause = Object.entries(updates)
      .filter(([key, value]) => value !== undefined && key !== 'id' && key !== 'site_id')
      .map(([key]) => `${key} = $${key}`)
      .join(', ')

    if (!setClause) {
      throw new Error('No valid fields to update')
    }

    const result = await sql`
      UPDATE scraped_sites 
      SET ${sql.unsafe(setClause)}, updated_at = CURRENT_TIMESTAMP
      WHERE site_id = ${siteId}
      RETURNING *
    `
    return result[0] as ScrapedSite || null
  } catch (error) {
    console.error('Error updating site:', error)
    throw error
  }
}

// Pages operations
export async function getPagesBySite(siteId: string): Promise<ScrapedPage[]> {
  try {
    const result = await sql`
      SELECT * FROM scraped_pages 
      WHERE site_id = ${siteId}
      ORDER BY scraped_at DESC
    `
    return result as ScrapedPage[]
  } catch (error) {
    console.error('Error fetching pages:', error)
    throw error
  }
}

export async function createPage(page: Omit<ScrapedPage, 'id' | 'scraped_at'>): Promise<ScrapedPage> {
  try {
    const result = await sql`
      INSERT INTO scraped_pages (
        site_id, page_url, page_title, page_slug, 
        content_hash, markdown_path, assets_count
      ) VALUES (
        ${page.site_id}, ${page.page_url}, ${page.page_title || null}, 
        ${page.page_slug || null}, ${page.content_hash || null}, 
        ${page.markdown_path || null}, ${page.assets_count}
      )
      ON CONFLICT (site_id, page_url) 
      DO UPDATE SET 
        page_title = EXCLUDED.page_title,
        page_slug = EXCLUDED.page_slug,
        content_hash = EXCLUDED.content_hash,
        markdown_path = EXCLUDED.markdown_path,
        assets_count = EXCLUDED.assets_count,
        scraped_at = CURRENT_TIMESTAMP
      RETURNING *
    `
    return result[0] as ScrapedPage
  } catch (error) {
    console.error('Error creating page:', error)
    throw error
  }
}

// Assets operations
export async function getAssetsBySite(siteId: string): Promise<ScrapedAsset[]> {
  try {
    const result = await sql`
      SELECT * FROM scraped_assets 
      WHERE site_id = ${siteId}
      ORDER BY downloaded_at DESC
    `
    return result as ScrapedAsset[]
  } catch (error) {
    console.error('Error fetching assets:', error)
    throw error
  }
}

export async function createAsset(asset: Omit<ScrapedAsset, 'id' | 'downloaded_at'>): Promise<ScrapedAsset> {
  try {
    const result = await sql`
      INSERT INTO scraped_assets (
        site_id, page_url, asset_url, asset_type, 
        local_path, file_size, content_hash
      ) VALUES (
        ${asset.site_id}, ${asset.page_url}, ${asset.asset_url}, 
        ${asset.asset_type}, ${asset.local_path}, ${asset.file_size || null}, 
        ${asset.content_hash || null}
      )
      ON CONFLICT (site_id, asset_url) 
      DO UPDATE SET 
        page_url = EXCLUDED.page_url,
        local_path = EXCLUDED.local_path,
        file_size = EXCLUDED.file_size,
        content_hash = EXCLUDED.content_hash,
        downloaded_at = CURRENT_TIMESTAMP
      RETURNING *
    `
    return result[0] as ScrapedAsset
  } catch (error) {
    console.error('Error creating asset:', error)
    throw error
  }
}

// Statistics
export async function getSiteStats(siteId: string) {
  try {
    const [pagesResult, assetsResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM scraped_pages WHERE site_id = ${siteId}`,
      sql`
        SELECT 
          asset_type,
          COUNT(*) as count 
        FROM scraped_assets 
        WHERE site_id = ${siteId} 
        GROUP BY asset_type
      `
    ])

    const totalPages = parseInt(pagesResult[0]?.count || '0')
    const assetCounts = assetsResult.reduce((acc: any, row: any) => {
      acc[row.asset_type] = parseInt(row.count)
      return acc
    }, {})

    return {
      totalPages,
      totalAssets: Object.values(assetCounts).reduce((sum: number, count: number) => sum + count, 0),
      images: assetCounts.image || 0,
      pdfs: assetCounts.pdf || 0,
      txtFiles: assetCounts.txt || 0
    }
  } catch (error) {
    console.error('Error fetching site stats:', error)
    throw error
  }
}

export { sql }
