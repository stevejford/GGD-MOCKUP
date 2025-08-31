#!/usr/bin/env node
// Simple crawl summary: counts .md files under CRAWL_MD_ROOT/<brand>
// Optionally fetches a sitemap URL and counts unique anchor hrefs.

import fs from 'fs/promises'
import path from 'path'
import https from 'https'

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { brand: '', sitemap: '' }
  for (const a of args) {
    if (a.startsWith('--brand=')) opts.brand = a.split('=')[1]
    else if (a.startsWith('--sitemap=')) opts.sitemap = a.split('=')[1]
  }
  return opts
}

async function listMarkdown(dir) {
  let count = 0
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true })
    for (const e of entries) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) await walk(p)
      else if (e.isFile() && p.toLowerCase().endsWith('.md')) count++
    }
  }
  try {
    await walk(dir)
  } catch {}
  return count
}

async function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'CrawlerSummary/1.0' } }, res => {
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      let data = ''
      res.on('data', c => (data += c))
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
  })
}

function countUniqueAnchors(html) {
  const re = /<a\s+[^>]*href=["']([^"']+)["']/gi
  const set = new Set()
  let m
  while ((m = re.exec(html)) !== null) {
    const href = m[1]
    if (href) set.add(href)
  }
  return set.size
}

async function main() {
  const { brand, sitemap } = parseArgs()
  const root = process.env.CRAWL_MD_ROOT || path.resolve(process.cwd(), '..', 'crawlforai', 'output_markdown')
  const dir = brand ? path.join(root, brand) : root
  const mdCount = await listMarkdown(dir)

  let sitemapLinks = null
  if (sitemap) {
    try {
      const html = await fetchText(sitemap)
      sitemapLinks = countUniqueAnchors(html)
    } catch (e) {
      sitemapLinks = `fetch_error: ${e.message}`
    }
  }

  const out = { root, brand: brand || null, mdCount, sitemapLinks }
  console.log(JSON.stringify(out, null, 2))
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

