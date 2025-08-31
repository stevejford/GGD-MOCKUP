/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
// Load optional environment file for DB credentials
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') })
} catch {}
const { URL } = require('url')
const cheerio = require('cheerio')
const PQueue = require('p-queue').default

const BRANDS = JSON.parse(fs.readFileSync(path.join(__dirname, 'brands.json'), 'utf8'))

const DEFAULTS = {
  maxPages: 50,
  rps: 1, // requests per second
  timeoutMs: 10000,
  retries: 1,
}

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { ...DEFAULTS, saveHtml: false }
  for (const a of args) {
    if (a.startsWith('--brand=')) opts.brand = a.split('=')[1]
    else if (a.startsWith('--maxPages=')) {
      const n = Number(a.split('=')[1])
      opts.maxPages = n === 0 ? Infinity : (Number.isFinite(n) && n > 0 ? n : DEFAULTS.maxPages)
    }
    else if (a.startsWith('--rps=')) opts.rps = Number(a.split('=')[1]) || DEFAULTS.rps
    else if (a.startsWith('--timeout=')) opts.timeoutMs = Number(a.split('=')[1]) || DEFAULTS.timeoutMs
    else if (a === '--saveHtml') opts.saveHtml = true
  }
  return opts
}

function sameOrigin(u, origin) {
  try { return new URL(u).origin === new URL(origin).origin } catch { return false }
}

function shouldSkipUrl(u) {
  try {
    const { pathname } = new URL(u)
    const ext = path.extname(pathname).toLowerCase()
    const skipExt = new Set(['.png','.jpg','.jpeg','.gif','.webp','.svg','.ico','.css','.js','.json','.pdf','.zip','.woff','.woff2','.ttf','.eot'])
    return skipExt.has(ext)
  } catch { return true }
}

async function fetchWithRetry(url, opts, retries = DEFAULTS.retries) {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), opts.timeoutMs)
    const res = await fetch(url, { headers: { 'User-Agent': 'CrawlerForAI/1.0 (+partners)' }, signal: controller.signal })
    clearTimeout(t)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('text/html')) return { html: '', contentType: ct, ok: false }
    const html = await res.text()
    return { html, contentType: ct, ok: true }
  } catch (e) {
    if (retries > 0) return fetchWithRetry(url, opts, retries - 1)
    throw e
  }
}

function extract(url, html) {
  const $ = cheerio.load(html)
  const title = ($('title').first().text() || '').trim()
  const metaDesc = ($('meta[name="description"]').attr('content') || '').trim()
  const h1 = ($('h1').first().text() || '').trim()
  const headings = [
    ...$('h2').toArray().map(n => $(n).text().trim()).filter(Boolean),
    ...$('h3').toArray().map(n => $(n).text().trim()).filter(Boolean)
  ]
  const text = $('main').text().trim() || $('body').text().trim()
  const links = $('a[href]').toArray()
    .map(a => ({ href: $(a).attr('href'), text: $(a).text().trim() }))
    .filter(l => !!l.href)
  return { url, title, description: metaDesc, h1, headings, text, links }
}

function safeFileName(u) {
  const { pathname, search } = new URL(u)
  let name = pathname.replace(/\/+$/, '')
  if (!name || name === '/') name = '/index'
  name = name.replace(/\//g, '_')
  if (search) name += '_' + Buffer.from(search).toString('base64url')
  return name + '.json'
}

async function ensureDir(p) { await fs.promises.mkdir(p, { recursive: true }) }

async function saveJson(outDir, u, data) {
  await ensureDir(outDir)
  const file = path.join(outDir, safeFileName(u))
  await fs.promises.writeFile(file, JSON.stringify(data, null, 2), 'utf8')
}

async function maybeStoreToDb(envUrl, row) {
  if (!envUrl) return
  const { Client } = require('pg')
  const client = new Client({ connectionString: envUrl })
  await client.connect()
  await client.query(`
    CREATE TABLE IF NOT EXISTS brand_pages (
      slug text NOT NULL,
      url text PRIMARY KEY,
      title text,
      description text,
      h1 text,
      headings jsonb,
      text text,
      links jsonb,
      fetched_at timestamptz DEFAULT now()
    );
  `)
  await client.query(
    `INSERT INTO brand_pages(slug,url,title,description,h1,headings,text,links)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (url) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       h1 = EXCLUDED.h1,
       headings = EXCLUDED.headings,
       text = EXCLUDED.text,
       links = EXCLUDED.links,
       fetched_at = now()`,
    [row.slug, row.url, row.title, row.description, row.h1, JSON.stringify(row.headings||[]), row.text, JSON.stringify(row.links||[])]
  )
  await client.end()
}

async function crawlBrand({ slug, origin }, opts) {
  const queue = new PQueue({ interval: 1000, intervalCap: Math.max(1, opts.rps) })
  const visited = new Set()
  const toVisit = [origin]
  const outDir = path.join(__dirname, 'output', slug)
  await ensureDir(outDir)
  const dbUrl = process.env.CRAWLER_DATABASE_URL

  console.log(`\n[${slug}] origin: ${origin}`)
  // Try to discover sitemap URLs and enqueue them upfront
  try {
    const seeds = await discoverSitemapUrls(origin, { timeoutMs: opts.timeoutMs })
    for (const seed of seeds) {
      if (sameOrigin(seed, origin) && !shouldSkipUrl(seed)) toVisit.push(seed)
    }
    if (seeds.length) console.log(`[${slug}] + seeded from sitemap: ${seeds.length} urls`)
  } catch (e) {
    // non-fatal
  }
  while (toVisit.length && visited.size < opts.maxPages) {
    const url = toVisit.shift()
    if (!url || visited.has(url) || !sameOrigin(url, origin) || shouldSkipUrl(url)) continue
    visited.add(url)
    await queue.add(async () => {
      try {
        const { html, ok } = await fetchWithRetry(url, opts, opts.retries)
        if (!ok) return
        const data = extract(url, html)
        await saveJson(outDir, url, data)
        if (opts.saveHtml) {
          const htmlDir = path.join(outDir, 'html')
          await ensureDir(htmlDir)
          const file = path.join(htmlDir, safeFileName(url).replace(/\.json$/, '.html'))
          await fs.promises.writeFile(file, html, 'utf8')
        }
        await maybeStoreToDb(dbUrl, { slug, ...data })
        // Enqueue internal links
        const $ = cheerio.load(html)
        $('a[href]').each((_, a) => {
          const href = $(a).attr('href')
          if (!href) return
          try {
            const next = new URL(href, url).toString()
            if (sameOrigin(next, origin) && !visited.has(next) && !shouldSkipUrl(next)) {
              toVisit.push(next)
            }
          } catch {}
        })
        console.log(`[${slug}] ✓ ${url}`)
      } catch (e) {
        console.warn(`[${slug}] ✗ ${url} -> ${e.message}`)
      }
    })
  }
  await queue.onIdle()
  console.log(`[${slug}] Done. Pages: ${visited.size}`)
}

async function main() {
  const opts = parseArgs()
  const targets = BRANDS.filter(b => !opts.brand || b.slug === opts.brand)
  if (!targets.length) {
    console.error('No brands matched. Use --brand=<slug> or edit brands.json')
    process.exit(1)
  }
  for (const b of targets) {
    await crawlBrand(b, opts)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

// ---------- SITEMAP DISCOVERY ----------
async function discoverSitemapUrls(origin, opts) {
  const urls = new Set()
  // robots.txt
  try {
    const robotsUrl = new URL('/robots.txt', origin).toString()
    const { html, ok } = await fetchWithRetry(robotsUrl, opts, 0)
    if (ok) {
      const lines = html.split(/\r?\n/)
      for (const line of lines) {
        const m = line.match(/^sitemap:\s*(.+)$/i)
        if (m && m[1]) urls.add(m[1].trim())
      }
    }
  } catch {}
  // common fallbacks
  const fallbacks = ['/sitemap.xml', '/sitemap_index.xml']
  for (const p of fallbacks) urls.add(new URL(p, origin).toString())
  // Expand any sitemap indexes
  const seeds = new Set()
  for (const u of urls) {
    const found = await fetchSitemapUrls(u, opts)
    for (const f of found) seeds.add(f)
  }
  return Array.from(seeds)
}

async function fetchSitemapUrls(sitemapUrl, opts) {
  try {
    const res = await fetch(sitemapUrl, { headers: { 'User-Agent': 'CrawlerForAI/1.0 (+partners)' } })
    if (!res.ok) return []
    const xml = await res.text()
    const $ = cheerio.load(xml, { xmlMode: true })
    const urls = []
    // urlset
    $('url > loc').each((_, el) => {
      const loc = $(el).text().trim()
      if (loc) urls.push(loc)
    })
    // sitemapindex -> recurse one level
    const sitemaps = []
    $('sitemap > loc').each((_, el) => {
      const loc = $(el).text().trim()
      if (loc) sitemaps.push(loc)
    })
    for (const sm of sitemaps) {
      const inner = await fetchSitemapUrls(sm, opts)
      for (const u of inner) urls.push(u)
    }
    return urls
  } catch {
    return []
  }
}
