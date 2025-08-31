import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

type Summary = {
  ok: boolean
  brand: string
  root: string
  mdCount: number
  sitemapHtmlLinks?: number | string
}

async function countMarkdown(dir: string): Promise<number> {
  let count = 0
  async function walk(d: string) {
    let entries: any[] = []
    try { entries = await fs.readdir(d, { withFileTypes: true } as any) } catch { return }
    for (const e of entries) {
      const p = path.join(d, e.name)
      if ((e as any).isDirectory?.()) await walk(p)
      else if ((e as any).isFile?.() && p.toLowerCase().endsWith('.md')) count++
    }
  }
  await walk(dir)
  return count
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const brand = searchParams.get('brand') || ''
    if (!brand) return Response.json({ ok: false, error: 'brand required' }, { status: 400 })
    const root = process.env.CRAWL_MD_ROOT || path.resolve(process.cwd(), '..', 'crawlforai', 'output_markdown')
    const dir = path.join(root, brand)
    const mdCount = await countMarkdown(dir)

    // Best-effort HTML sitemap link count
    let sitemapHtmlLinks: number | string | undefined
    try {
      const siteMapUrl = `https://www.${brand.replace(/-/g, '')}.com.au/sitemap`
      const res = await fetch(siteMapUrl, { headers: { 'User-Agent': 'GGD-Admin/1.0' } })
      if (res.ok) {
        const html = await res.text()
        const re = /<a\s+[^>]*href=["']([^"']+)["']/gi
        const set = new Set<string>()
        let m: RegExpExecArray | null
        while ((m = re.exec(html)) !== null) set.add(m[1])
        sitemapHtmlLinks = set.size
      } else sitemapHtmlLinks = `http_${res.status}`
    } catch (e: any) {
      sitemapHtmlLinks = `fetch_error:${e?.message || 'err'}`
    }

    const out: Summary = { ok: true, brand, root, mdCount, sitemapHtmlLinks }
    return Response.json(out)
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'summary error' }, { status: 500 })
  }
}

