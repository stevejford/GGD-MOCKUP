import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { getSiteById, getPagesBySite, createPage, ScrapedPage } from './neon-db'

interface ContentMetrics {
  contentHash: string
  fileSize: number
  wordCount: number
  lastModified: string
  headingCount: number
  linkCount: number
}

interface ChangeDetectionResult {
  hasChanged: boolean
  isNewFile: boolean
  changeType?: 'content' | 'metadata' | 'structure' | 'minor'
  metrics: ContentMetrics
  previousMetrics?: ContentMetrics
}

/**
 * Generate content hash from markdown content
 */
function generateContentHash(content: string): string {
  // Normalize content for consistent hashing
  const normalized = content
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\s+$/gm, '')   // Remove trailing whitespace
    .trim()                  // Remove leading/trailing whitespace
  
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex')
}

/**
 * Extract content metrics from markdown
 */
function extractContentMetrics(content: string, filePath: string, stats: any): ContentMetrics {
  const contentHash = generateContentHash(content)
  const fileSize = stats.size
  const lastModified = stats.mtime.toISOString()
  
  // Count words (simple word count)
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length
  
  // Count headings
  const headingCount = (content.match(/^#+\s/gm) || []).length
  
  // Count links
  const linkCount = (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length
  
  return {
    contentHash,
    fileSize,
    wordCount,
    lastModified,
    headingCount,
    linkCount
  }
}

/**
 * Determine if content has significantly changed
 */
function analyzeChanges(current: ContentMetrics, previous?: ContentMetrics): ChangeDetectionResult {
  if (!previous) {
    return {
      hasChanged: true,
      isNewFile: true,
      changeType: 'content',
      metrics: current
    }
  }

  // Content hash is the most reliable indicator
  if (current.contentHash !== previous.contentHash) {
    // Determine type of change
    let changeType: 'content' | 'metadata' | 'structure' | 'minor' = 'content'
    
    const wordDiff = Math.abs(current.wordCount - previous.wordCount)
    const wordDiffPercent = wordDiff / Math.max(previous.wordCount, 1) * 100
    
    const headingDiff = Math.abs(current.headingCount - previous.headingCount)
    const linkDiff = Math.abs(current.linkCount - previous.linkCount)
    
    if (headingDiff > 0 || linkDiff > 2) {
      changeType = 'structure'
    } else if (wordDiffPercent > 10) {
      changeType = 'content'
    } else if (wordDiffPercent > 2) {
      changeType = 'metadata'
    } else {
      changeType = 'minor'
    }
    
    return {
      hasChanged: true,
      isNewFile: false,
      changeType,
      metrics: current,
      previousMetrics: previous
    }
  }

  return {
    hasChanged: false,
    isNewFile: false,
    metrics: current,
    previousMetrics: previous
  }
}

/**
 * Check if a specific page/file has changed since last scrape
 */
export async function detectPageChanges(
  siteId: string, 
  pageUrl: string, 
  markdownPath: string
): Promise<ChangeDetectionResult> {
  try {
    // Get file stats and content
    const fullPath = path.resolve(markdownPath)
    const stats = await fs.stat(fullPath)
    const content = await fs.readFile(fullPath, 'utf-8')
    
    // Extract current metrics
    const currentMetrics = extractContentMetrics(content, fullPath, stats)
    
    // Get previous page data from database
    const existingPages = await getPagesBySite(siteId)
    const existingPage = existingPages.find(p => p.page_url === pageUrl)
    
    if (!existingPage) {
      // New page
      return {
        hasChanged: true,
        isNewFile: true,
        changeType: 'content',
        metrics: currentMetrics
      }
    }

    // Build previous metrics from database
    const previousMetrics: ContentMetrics = {
      contentHash: existingPage.content_hash || '',
      fileSize: existingPage.file_size || 0,
      wordCount: existingPage.word_count || 0,
      lastModified: existingPage.last_modified || existingPage.scraped_at,
      headingCount: 0, // Not stored in DB yet
      linkCount: 0     // Not stored in DB yet
    }

    return analyzeChanges(currentMetrics, previousMetrics)

  } catch (error) {
    console.error('Error detecting page changes:', error)
    // If we can't detect changes, assume it has changed to be safe
    return {
      hasChanged: true,
      isNewFile: true,
      changeType: 'content',
      metrics: {
        contentHash: '',
        fileSize: 0,
        wordCount: 0,
        lastModified: new Date().toISOString(),
        headingCount: 0,
        linkCount: 0
      }
    }
  }
}

/**
 * Batch check all pages for a site to see what has changed
 */
export async function detectSiteChanges(siteId: string): Promise<{
  changedPages: Array<{
    pageUrl: string
    markdownPath: string
    changeType: string
    metrics: ContentMetrics
  }>
  unchangedPages: Array<{
    pageUrl: string
    markdownPath: string
  }>
  newPages: Array<{
    pageUrl: string
    markdownPath: string
    metrics: ContentMetrics
  }>
  totalPages: number
}> {
  try {
    // Get all markdown files for this site
    const { listBrandFiles, readBrandFile } = await import('./crawl-reader')
    const files = await listBrandFiles(siteId)
    const markdownFiles = files.filter(f => f.endsWith('.md'))
    
    const changedPages: any[] = []
    const unchangedPages: any[] = []
    const newPages: any[] = []
    
    for (const file of markdownFiles) {
      try {
        const { url: pageUrl } = await readBrandFile(siteId, file)
        const markdownPath = path.join(process.env.CRAWL_MD_ROOT || '', siteId, file)
        
        const changeResult = await detectPageChanges(siteId, pageUrl || file, markdownPath)
        
        if (changeResult.isNewFile) {
          newPages.push({
            pageUrl: pageUrl || file,
            markdownPath,
            metrics: changeResult.metrics
          })
        } else if (changeResult.hasChanged) {
          changedPages.push({
            pageUrl: pageUrl || file,
            markdownPath,
            changeType: changeResult.changeType || 'content',
            metrics: changeResult.metrics
          })
        } else {
          unchangedPages.push({
            pageUrl: pageUrl || file,
            markdownPath
          })
        }
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError)
        // Treat as new/changed to be safe
        newPages.push({
          pageUrl: file,
          markdownPath: path.join(process.env.CRAWL_MD_ROOT || '', siteId, file),
          metrics: {
            contentHash: '',
            fileSize: 0,
            wordCount: 0,
            lastModified: new Date().toISOString(),
            headingCount: 0,
            linkCount: 0
          }
        })
      }
    }
    
    return {
      changedPages,
      unchangedPages,
      newPages,
      totalPages: markdownFiles.length
    }
    
  } catch (error) {
    console.error('Error detecting site changes:', error)
    return {
      changedPages: [],
      unchangedPages: [],
      newPages: [],
      totalPages: 0
    }
  }
}

/**
 * Update page metadata in database after processing
 */
export async function updatePageMetrics(
  siteId: string,
  pageUrl: string,
  metrics: ContentMetrics,
  markdownPath: string
): Promise<void> {
  try {
    await createPage({
      site_id: siteId,
      page_url: pageUrl,
      page_title: '', // Could extract from markdown if needed
      page_slug: path.basename(markdownPath, '.md'),
      content_hash: metrics.contentHash,
      markdown_path: markdownPath,
      assets_count: 0, // Could count assets if needed
      file_size: metrics.fileSize,
      word_count: metrics.wordCount,
      last_modified: metrics.lastModified
    })
  } catch (error) {
    console.error('Error updating page metrics:', error)
  }
}
