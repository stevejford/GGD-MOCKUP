import path from 'path'
import fs from 'fs/promises'

export function getCrawlRoot() {
  const fromEnv = process.env.CRAWL_MD_ROOT
  if (fromEnv && fromEnv.trim()) return fromEnv
  return path.resolve(process.cwd(), '..', 'crawlforai', 'output_markdown')
}

export async function listBrands(): Promise<string[]> {
  const root = getCrawlRoot()
  try {
    const entries = await fs.readdir(root, { withFileTypes: true })
    return entries.filter(e => e.isDirectory() && !e.name.startsWith('_')).map(e => e.name)
  } catch {
    return []
  }
}

export async function listBrandFiles(brand: string): Promise<string[]> {
  const dir = path.join(getCrawlRoot(), brand)
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    return entries.filter(e => e.isFile() && e.name.endsWith('.md')).map(e => e.name).sort()
  } catch {
    return []
  }
}

export async function readBrandFile(brand: string, file: string): Promise<{ markdown: string, capture: any, url: string }>{
  const dir = path.join(getCrawlRoot(), brand)
  const mdPath = path.join(dir, file)
  const capPath = mdPath.replace(/\.md$/, '.capture.json')
  let markdown = ''
  let capture: any = null
  try { markdown = await fs.readFile(mdPath, 'utf8') } catch {}
  try {
    const json = await fs.readFile(capPath, 'utf8')
    capture = JSON.parse(json)
  } catch {}
  const url = capture?.url ?? ''
  return { markdown, capture, url }
}

export async function readAggregated(brand: string): Promise<string> {
  const file = path.join(getCrawlRoot(), '_aggregated', `${brand}.md`)
  try { return await fs.readFile(file, 'utf8') } catch { return '' }
}

