Crawler for partner brand sites

Overview
- Standalone Node crawler to fetch public brand pages, extract titles, meta descriptions, H1s, headings, body text summary and links.
- Saves JSON to `output/<brand>/...`. Optionally writes to Neon/Postgres if `CRAWLER_DATABASE_URL` is set.
- Same-origin crawl only. Seeds live in `brands.json`.

Quick start
- cd `crawlforai`
- Install deps: `npm install`
- Crawl all brands (50 pages/brand): `npm run crawl`
- Crawl a specific brand (e.g. steel-line): `npm run crawl -- --brand=steel-line`

Environment
- Optional Neon: set `CRAWLER_DATABASE_URL` to a Postgres connection string.

Notes
- Defaults: maxPages=50, rps=1, timeout=10s, retries=1. Adjust via CLI flags.
- Skips non-HTML responses and common static assets.

Markdown runner (Crawl4AI)
- The Python runner saves clean Markdown using Crawl4AI with anti-bot options and optional network/console capture.
- Usage:
  1. `pip install -r requirements.txt`
  2. `crawl4ai-setup`
  3. `python -m playwright install --with-deps chromium`
  4. `python crawl4ai_runner.py --brand=steel-line --maxPages=0 --progressive --captureNetwork --captureConsole`

Aggregate per brand
- After crawling, aggregate all pages for a brand into a single Markdown file (optional pruning/BM25 filters):
- Examples:
  - All brands, prune then BM25: `python aggregate_markdown.py --prune=0.5 --minWords=50 --bm25="garage doors" --bm25Threshold=1.2`
  - Single brand: `python aggregate_markdown.py --brand=steel-line --prune=0.5 --minWords=50`
- Output goes to `output_markdown/_aggregated/<brand>.md`.

Neon/Postgres storage (Node crawler)
- Set an env var or create `crawlforai/.env` with:
  - CRAWLER_DATABASE_URL=postgresql://<user>:<pass>@<host>/<db>?sslmode=require
- The Node crawler will auto-create a `brand_pages` table and upsert by URL.
- Quick test (single page into DB):
  - `cd crawlforai && npm install`
  - `CRAWLER_DATABASE_URL="postgresql://..." node crawler.js --brand=steel-line --maxPages=1`

Manual SQL (optional)
```
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
```
