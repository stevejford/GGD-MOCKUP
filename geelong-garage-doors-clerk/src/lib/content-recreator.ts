import fs from 'fs'
import path from 'path'
import { Client } from 'pg'

export interface PageAssets {
  page_url: string
  asset_urls: string[]
  image_urls: string[]
  pdf_urls: string[]
  txt_urls: string[]
  other_urls?: string[]
}

export interface PageCapture {
  url: string
  title: string
  description?: string
  h1?: string
  headings?: any[]
  text?: string
  links?: any[]
  fetched_at: string
}

export interface EmbeddingChunk {
  id: number
  brand: string
  file: string
  chunk_index: number
  url: string
  content: string
  embedding: number[]
}

export interface PageRecreationData {
  brand: string
  file: string
  url: string
  title: string
  description?: string
  h1?: string
  markdownContent: string
  assets: PageAssets
  capture: PageCapture
  embeddings: EmbeddingChunk[]
  localAssetPaths: string[]
}

export class ContentRecreator {
  private crawlRoot: string
  private dbConnection: string

  constructor(crawlRoot?: string, dbConnection?: string) {
    // Use absolute path to the crawl output directory
    this.crawlRoot = crawlRoot || 'D:\\GGD Mockup\\crawlforai\\output_markdown'
    this.dbConnection = dbConnection || process.env.CRAWLER_DATABASE_URL || process.env.DATABASE_URL || ''
  }

  /**
   * Get all available brands
   */
  async getBrands(): Promise<string[]> {
    try {
      const brands = fs.readdirSync(this.crawlRoot)
        .filter(item => {
          const fullPath = path.join(this.crawlRoot, item)
          return fs.statSync(fullPath).isDirectory() && !item.startsWith('_')
        })
      return brands
    } catch (error) {
      console.error('Error reading brands:', error)
      return []
    }
  }

  /**
   * Get all files for a specific brand
   */
  async getBrandFiles(brand: string): Promise<string[]> {
    try {
      const brandPath = path.join(this.crawlRoot, brand)
      console.log(`🔍 Looking for files in: ${brandPath}`)

      if (!fs.existsSync(brandPath)) {
        console.error(`❌ Brand directory does not exist: ${brandPath}`)
        return []
      }

      const allFiles = fs.readdirSync(brandPath)
      console.log(`📁 Found ${allFiles.length} total files in brand directory`)

      const brandFiles = allFiles
        .filter(file => file.startsWith('_') && file.endsWith('.md'))

      console.log(`📄 Found ${brandFiles.length} markdown files for brand ${brand}`)
      console.log(`📄 Sample files:`, brandFiles.slice(0, 3))

      // Remove the leading underscore from filenames
      const cleanedFiles = brandFiles.map(file => file.substring(1))

      return cleanedFiles
    } catch (error) {
      console.error(`Error reading files for brand ${brand}:`, error)
      return []
    }
  }

  /**
   * Load assets for a specific page
   */
  async loadPageAssets(brand: string, file: string): Promise<PageAssets | null> {
    try {
      const fileName = file.replace('.md', '')
      const assetsPath = path.join(this.crawlRoot, brand, `_${fileName}.assets.json`)

      if (!fs.existsSync(assetsPath)) return null

      const assetsData = JSON.parse(fs.readFileSync(assetsPath, 'utf-8'))
      return assetsData as PageAssets
    } catch (error) {
      console.error(`Error loading assets for ${brand}/${file}:`, error)
      return null
    }
  }

  /**
   * Load capture data for a specific page
   */
  async loadPageCapture(brand: string, file: string): Promise<PageCapture | null> {
    try {
      const fileName = file.replace('.md', '')
      const capturePath = path.join(this.crawlRoot, brand, `_${fileName}.capture.json`)

      if (!fs.existsSync(capturePath)) return null

      const captureData = JSON.parse(fs.readFileSync(capturePath, 'utf-8'))
      return captureData as PageCapture
    } catch (error) {
      console.error(`Error loading capture for ${brand}/${file}:`, error)
      return null
    }
  }

  /**
   * Load markdown content for a specific page
   */
  async loadMarkdownContent(brand: string, file: string): Promise<string | null> {
    try {
      const fileName = file.replace('.md', '')
      const markdownPath = path.join(this.crawlRoot, brand, `_${fileName}.md`)

      if (!fs.existsSync(markdownPath)) return null

      return fs.readFileSync(markdownPath, 'utf-8')
    } catch (error) {
      console.error(`Error loading markdown for ${brand}/${file}:`, error)
      return null
    }
  }

  /**
   * Get embeddings for a specific page from the database
   */
  async getPageEmbeddings(brand: string, file: string): Promise<EmbeddingChunk[]> {
    if (!this.dbConnection) {
      console.warn('No database connection available')
      return []
    }

    try {
      const client = new Client({ connectionString: this.dbConnection })
      await client.connect()

      const query = `
        SELECT id, brand, file, chunk_index, url, content, embedding
        FROM crawl_embeddings_vec 
        WHERE brand = $1 AND file = $2 
        ORDER BY chunk_index
      `
      
      const result = await client.query(query, [brand, file])
      await client.end()

      return result.rows.map(row => ({
        id: row.id,
        brand: row.brand,
        file: row.file,
        chunk_index: row.chunk_index,
        url: row.url,
        content: row.content,
        embedding: JSON.parse(row.embedding)
      }))
    } catch (error) {
      console.error(`Error fetching embeddings for ${brand}/${file}:`, error)
      return []
    }
  }

  /**
   * Get local asset paths for downloaded assets
   */
  async getLocalAssetPaths(brand: string): Promise<string[]> {
    try {
      const assetsDir = path.join(this.crawlRoot, brand, 'assets')
      if (!fs.existsSync(assetsDir)) return []
      
      const assets = fs.readdirSync(assetsDir)
      return assets.map(asset => path.join(assetsDir, asset))
    } catch (error) {
      console.error(`Error reading local assets for ${brand}:`, error)
      return []
    }
  }

  /**
   * Get complete page recreation data
   */
  async getPageRecreationData(brand: string, file: string): Promise<PageRecreationData | null> {
    try {
      const [assets, capture, markdownContent, embeddings, localAssetPaths] = await Promise.all([
        this.loadPageAssets(brand, file),
        this.loadPageCapture(brand, file),
        this.loadMarkdownContent(brand, file),
        this.getPageEmbeddings(brand, file),
        this.getLocalAssetPaths(brand)
      ])

      if (!markdownContent || !capture) {
        console.warn(`Missing essential data for ${brand}/${file}`)
        return null
      }

      return {
        brand,
        file,
        url: capture.url,
        title: capture.title,
        description: capture.description,
        h1: capture.h1,
        markdownContent,
        assets: assets || { page_url: capture.url, asset_urls: [], image_urls: [], pdf_urls: [], txt_urls: [] },
        capture,
        embeddings,
        localAssetPaths
      }
    } catch (error) {
      console.error(`Error getting recreation data for ${brand}/${file}:`, error)
      return null
    }
  }

  /**
   * Find similar content across brands using embeddings
   */
  async findSimilarContent(searchQuery: string, excludeBrand?: string, limit: number = 5): Promise<EmbeddingChunk[]> {
    if (!this.dbConnection) {
      console.warn('No database connection available for similarity search')
      return []
    }

    try {
      // This would require OpenAI API to generate embedding for search query
      // For now, return text-based similarity
      const client = new Client({ connectionString: this.dbConnection })
      await client.connect()

      const whereClause = excludeBrand ? 'WHERE brand != $2' : ''
      const params = excludeBrand ? [searchQuery, excludeBrand] : [searchQuery]
      
      const query = `
        SELECT id, brand, file, chunk_index, url, content, embedding
        FROM crawl_embeddings_vec 
        ${whereClause}
        AND content ILIKE '%' || $1 || '%'
        ORDER BY LENGTH(content) DESC
        LIMIT $${params.length + 1}
      `
      
      const result = await client.query(query, [...params, limit])
      await client.end()

      return result.rows.map(row => ({
        id: row.id,
        brand: row.brand,
        file: row.file,
        chunk_index: row.chunk_index,
        url: row.url,
        content: row.content,
        embedding: JSON.parse(row.embedding)
      }))
    } catch (error) {
      console.error('Error finding similar content:', error)
      return []
    }
  }

  /**
   * Generate reworded content suggestions
   */
  generateRewordingSuggestions(originalContent: string): string[] {
    const suggestions = [
      // Replace competitor names with generic terms
      originalContent.replace(/B&D|B\&D/gi, 'Premium Garage Doors'),
      originalContent.replace(/Steel-Line/gi, 'Quality Steel Solutions'),
      originalContent.replace(/4D Doors|4DDoors/gi, 'Advanced Door Systems'),
      originalContent.replace(/Centurion/gi, 'Reliable Access Control'),
      originalContent.replace(/Eco Garage Doors/gi, 'Sustainable Door Solutions'),
      originalContent.replace(/Taurean/gi, 'Professional Door Services'),
      
      // Replace specific product names with generic descriptions
      originalContent.replace(/Panelift/gi, 'Sectional Door System'),
      originalContent.replace(/Roll-a-Door/gi, 'Roller Door Solution'),
      originalContent.replace(/Controll-a-Door/gi, 'Automated Door Control'),
      
      // Replace specific locations with "your area" or "locally"
      originalContent.replace(/Melbourne|Sydney|Brisbane|Perth|Adelaide/gi, 'your area'),
      originalContent.replace(/Victoria|NSW|Queensland|WA|SA/gi, 'your region'),
    ]

    return suggestions.filter(suggestion => suggestion !== originalContent)
  }
}

export default ContentRecreator
