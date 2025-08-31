# GGD Admin/Crawl Handover

This handover gives another developer everything needed to stabilize dev, verify the admin tools, initialize the database schema, and resolve the known issues on Windows.

## Project State Summary

- Next.js App Router (TypeScript, Tailwind). Clerk for auth.
- Admin tools live at `/admin/crawl-viewer` and include:
  - Scraper control (spawns Python Crawl4AI runner under `../crawlforai`)
  - Aggregation runner (combines per-brand Markdown)
  - Embed-to-Neon (OpenAI embeddings → pgvector table)
  - Vector search UI (cosine/L2/IP)
  - Admin health panel (auth, paths, DB status)
- Dev environment (Windows) had Webpack cache corruption; dev script now runs Turbopack and disables persistent cache.
- In development only, admin guard is bypassed (for ease of local work). In production it is protected by Clerk + allowlist.

## Current Known Issues and Fixes

1) Windows dev cache/chunk errors

- Error patterns: `Cannot find module './5611.js'`, vendor chunk ENOENT, rename failures in `.next\cache`.
- Fixes applied:
  - `package.json` dev script:
    - `set NEXT_DISABLE_WEBPACK_CACHE=1&& next dev --turbopack`
  - Recommendations if errors persist:
    - Move repo to a path without spaces (e.g. `D:\GGD_Mockup\geelong-garage-doors-clerk`).
    - Exclude the project directory from antivirus real-time scanning.
    - Hard-clean `.next` and `.next\cache` between runs.

2) Favicon route conflict

- Root cause: having both `public/favicon.ico` and `src/app/favicon.ico` created a conflict.
- Current state: keep only `src/app/favicon.ico`. If re-introducing a public favicon, ensure there is no app favicon route.

3) Admin allowlist mismatch

- In production, admin is protected by Clerk + allowlist. In development, admin is bypassed for convenience.
- Configure one or both in `.env.local` for production:
  - `ADMIN_EMAILS=user@example.com,another@example.com`
  - `ADMIN_USER_IDS=user_xxx,user_yyy` (Clerk IDs)

4) Crawl output folder missing

- Health often shows `md-root: missing` when the admin viewer starts.
- Fix options:
  - Create folder manually: `D:\GGD Mockup\crawlforai\output_markdown`.
  - Or click "Create folder" in the AdminStatus panel (calls `/api/admin/fix-md-root`).
  - Alternatively set `CRAWL_MD_ROOT` in `.env.local` to point to your actual Markdown folder.

5) Database URL misconfiguration

- If health shows `getaddrinfo ENOTFOUND base` or missing password, ensure `.env.local` has a full Neon URL with password:
  - `CRAWLER_DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require` (optionally `&channel_binding=require`)
  - Remove any conflicting `DATABASE_URL` env.

## Environment Variables

Set in `geelong-garage-doors-clerk/.env.local` (dev values shown as examples):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/trade-portal/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/trade-portal/dashboard

ADMIN_EMAILS=stevejford1@gmail.com
# ADMIN_USER_IDS=user_...

# Crawl output and runner roots
CRAWL_MD_ROOT="D:\GGD Mockup\crawlforai\output_markdown"
CRAWL_PY_ROOT="D:\GGD Mockup\crawlforai"

# Neon
CRAWLER_DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-...ap-southeast-2.aws.neon.tech/neondb?sslmode=require

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...
```

After any `.env.local` change, restart the dev server.

## Dev Commands

- Start dev (Turbopack + disabled Webpack cache):
  - `npm run dev`
- Full clean if needed:
  - Delete `.next` and `.next\cache` and restart dev.

## Important Code Locations

- Admin viewer: `src/app/admin/crawl-viewer/page.tsx`
  - Panels: `ScrapeControls`, `AdminEmbedPanel`, `AdminAggregatePanel`, `AdminSearchPanel`, `AdminStatus`
- Admin health: `GET /api/admin/health` — `src/app/api/admin/health/route.ts`
- Create md-root: `POST /api/admin/fix-md-root` — `src/app/api/admin/fix-md-root/route.ts`
- Init DB schema: `GET|POST /api/admin/init-db` — `src/app/api/admin/init-db/route.ts`
- Embed to Neon: `POST /api/embed` — `src/app/api/embed/route.ts`
- Vector search: `POST /api/search` — `src/app/api/search/route.ts`
- Brands list (for dropdowns): `GET /api/crawl/brands` — `src/app/api/crawl/brands/route.ts`
- Admin guard: `src/lib/admin-guard.ts` (returns `true` in development)
- Clerk middleware: `src/middleware.ts` (protects `/trade-portal` always; unprotects `/admin` in development)

## Database Schema

The `/api/admin/init-db` endpoint creates and/or ensures the DB schema below. You can run the SQL manually if preferred.

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Embeddings table
CREATE TABLE IF NOT EXISTS crawl_embeddings_vec (
  id bigserial PRIMARY KEY,
  brand text NOT NULL,
  file text NOT NULL,
  chunk_index int NOT NULL,
  url text,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  UNIQUE (brand, file, chunk_index)
);

-- HNSW cosine index
CREATE INDEX IF NOT EXISTS crawl_embeddings_vec_hnsw_cosine
  ON crawl_embeddings_vec USING hnsw (embedding vector_cosine_ops);

-- Raw pages table (for Node crawler)
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

## Admin Endpoints

- Health: `GET /api/admin/health` — JSON with `loggedIn`, `isAdmin`, paths status, DB status.
- Fix md-root: `POST /api/admin/fix-md-root` — creates `CRAWL_MD_ROOT` folder.
- Init DB: `GET|POST /api/admin/init-db` — sets up pgvector, tables, indexes.
- Embed brand: `POST /api/embed` — body: `{ brand, chunkSize?, overlap?, model? }`. Upserts by `(brand,file,chunk_index)`.
- Vector search: `POST /api/search` — body: `{ q, brand?, k?, model?, metric? }`, metric = `cosine|l2|ip`.
- List brands: `GET /api/crawl/brands` — reads brand directories from `CRAWL_MD_ROOT`.

## Crawl & Aggregate (Python)

Under `D:\GGD Mockup\crawlforai` (outside the Next app):

1) One-time setup:
```
pip install -r requirements.txt
crawl4ai-setup
python -m playwright install --with-deps chromium
```

2) Crawl to Markdown (quick test, one brand):
```
python crawl4ai_runner.py --brand=steel-line --maxPages=10 --progressive --captureNetwork --captureConsole
```

3) Full crawl:
```
python crawl4ai_runner.py --maxPages=0 --progressive --captureNetwork --captureConsole
```

4) Aggregate Markdown (optional):
```
python aggregate_markdown.py --prune=0.5 --minWords=50
```

## Admin Page Flow

1) Open `/admin/crawl-viewer`.
2) Check Admin Status (badges show Auth/Admin/md-root/DB). Click "Create folder" if md-root is missing.
3) Run scraper if needed (ScrapeControls). Logs stream in the panel.
4) Aggregate (optional) to produce `_aggregated/<brand>.md`.
5) Embed brand to Neon (AdminEmbedPanel) — success shows chunk count.
6) Search (AdminSearchPanel) — enter a query, select brand, view nearest chunks with distances and sources.

## Production Notes

- Remove dev bypass before shipping if stricter local testing is required:
  - `src/lib/admin-guard.ts` currently returns `true` in development; production uses allowlist.
  - `src/middleware.ts` unprotects `/admin` in development only; production requires Clerk.
- Ensure `.env.local` includes proper `ADMIN_EMAILS` or `ADMIN_USER_IDS` for production.
- Favicon: ensure only one favicon source (prefer App Router favicon at `src/app/favicon.ico`).

## Troubleshooting Checklist

- 500s on `/favicon.ico` or chunk errors → remove duplicate favicon, run Turbopack, clear `.next`, avoid spaces in path, exclude antivirus.
- Health shows `md-root: missing` → create folder (`/api/admin/fix-md-root`) or fix `CRAWL_MD_ROOT` env path.
- `getaddrinfo ENOTFOUND base` or DB errors → fix `CRAWLER_DATABASE_URL` (full Neon URL with password), restart dev.
- Admin 404 in prod → not in allowlist; add email or Clerk user ID to env.

---

If you need me to add an “Embed all brands” action with progress or collapse scrape advanced flags under a details panel to simplify the UI, I can implement that next.

