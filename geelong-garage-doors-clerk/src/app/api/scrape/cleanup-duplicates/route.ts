export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { isAdmin } from '@/lib/admin-guard'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

interface CleanupResult {
  success: boolean
  totalRemoved: number
  totalSaved: number
  brandResults: Array<{
    brand: string
    removed: number
    saved: number
    error?: string
  }>
  error?: string
}

async function cleanupDuplicateAssets(brandDir: string, brandName: string) {
  const assetsDir = path.join(brandDir, 'assets')
  
  try {
    await fs.access(assetsDir)
  } catch {
    return { brand: brandName, removed: 0, saved: 0, error: 'No assets directory' }
  }

  const contentHashes = new Map<string, string[]>()
  let totalFiles = 0

  // Scan all asset directories
  const searchDirs = [
    assetsDir,
    path.join(assetsDir, 'pdf'),
    path.join(assetsDir, 'txt')
  ]

  for (const searchDir of searchDirs) {
    try {
      const files = await fs.readdir(searchDir)
      
      for (const file of files) {
        const filePath = path.join(searchDir, file)
        
        try {
          const stat = await fs.stat(filePath)
          if (stat.isFile()) {
            totalFiles++
            const content = await fs.readFile(filePath)
            const contentHash = crypto.createHash('md5').update(content).digest('hex')
            
            if (!contentHashes.has(contentHash)) {
              contentHashes.set(contentHash, [])
            }
            contentHashes.get(contentHash)!.push(filePath)
          }
        } catch {
          continue
        }
      }
    } catch {
      continue
    }
  }

  // Find and remove duplicates
  let removedCount = 0
  let savedSpace = 0

  for (const [hash, filePaths] of contentHashes.entries()) {
    if (filePaths.length > 1) {
      // Sort by modification time (keep the oldest)
      const fileStats = await Promise.all(
        filePaths.map(async (filePath) => {
          try {
            const stat = await fs.stat(filePath)
            return { path: filePath, mtime: stat.mtime.getTime(), size: stat.size }
          } catch {
            return null
          }
        })
      )

      const validFiles = fileStats.filter(f => f !== null) as Array<{path: string, mtime: number, size: number}>
      validFiles.sort((a, b) => a.mtime - b.mtime)

      // Remove all but the first (oldest) file
      for (let i = 1; i < validFiles.length; i++) {
        try {
          await fs.unlink(validFiles[i].path)
          removedCount++
          savedSpace += validFiles[i].size
        } catch {
          continue
        }
      }
    }
  }

  // Update asset cache
  await updateAssetCache(brandDir, contentHashes)

  return {
    brand: brandName,
    removed: removedCount,
    saved: savedSpace
  }
}

async function updateAssetCache(brandDir: string, duplicateGroups: Map<string, string[]>) {
  const cacheFile = path.join(brandDir, '.asset_cache.json')
  
  try {
    const cacheContent = await fs.readFile(cacheFile, 'utf-8')
    const cache = JSON.parse(cacheContent)

    // Get list of all removed files
    const removedFiles = new Set<string>()
    for (const filePaths of duplicateGroups.values()) {
      if (filePaths.length > 1) {
        // Skip the first file (kept), add the rest as removed
        for (let i = 1; i < filePaths.length; i++) {
          const fileName = path.basename(filePaths[i])
          removedFiles.add(fileName)
        }
      }
    }

    // Remove cache entries for deleted files
    const updatedCache: Record<string, string> = {}
    for (const [url, assetPath] of Object.entries(cache)) {
      const fileName = assetPath.split('/').pop()
      if (fileName && !removedFiles.has(fileName)) {
        updatedCache[url] = assetPath
      }
    }

    await fs.writeFile(cacheFile, JSON.stringify(updatedCache, null, 2))
  } catch {
    // Ignore cache update errors
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const outputDir = path.join(process.cwd(), '..', 'crawlforai', 'output_markdown')
    
    try {
      await fs.access(outputDir)
    } catch {
      return Response.json({
        success: false,
        error: 'Output directory not found'
      })
    }

    const brands = await fs.readdir(outputDir)
    const brandDirs = []
    
    for (const brand of brands) {
      const brandPath = path.join(outputDir, brand)
      try {
        const stat = await fs.stat(brandPath)
        if (stat.isDirectory()) {
          brandDirs.push({ name: brand, path: brandPath })
        }
      } catch {
        continue
      }
    }

    const results: CleanupResult = {
      success: true,
      totalRemoved: 0,
      totalSaved: 0,
      brandResults: []
    }

    // Clean up each brand
    for (const { name, path: brandPath } of brandDirs) {
      const brandResult = await cleanupDuplicateAssets(brandPath, name)
      results.brandResults.push(brandResult)
      results.totalRemoved += brandResult.removed
      results.totalSaved += brandResult.saved
    }

    return Response.json(results)

  } catch (error: any) {
    console.error('Cleanup API error:', error)
    return Response.json({
      success: false,
      error: error?.message || 'Internal server error',
      totalRemoved: 0,
      totalSaved: 0,
      brandResults: []
    }, { status: 500 })
  }
}
