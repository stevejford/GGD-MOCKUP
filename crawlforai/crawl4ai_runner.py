import asyncio
import argparse
import os
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen, Request
from xml.etree import ElementTree as ET
import json
import re
import requests
from urllib.parse import urljoin, urlparse
from pathlib import Path


# Ensure UTF-8 console output on Windows to avoid 'charmap' Unicode errors
import sys
try:
  # Python 3.7+
  sys.stdout.reconfigure(encoding='utf-8', errors='replace')
  sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
  pass
# Also hint to child libs
os.environ.setdefault('PYTHONIOENCODING', 'utf-8')

def is_tracking_pixel(url):
  """Filter out tracking pixels and analytics beacons"""
  tracking_domains = [
    'adroll.com', 'google-analytics.com', 'googletagmanager.com',
    'facebook.com', 'doubleclick.net', 'bing.com', 'yahoo.com',
    'analytics.yahoo.com', 'pixel.zprk.io', 'bat.bing.com'
  ]
  return any(domain in url for domain in tracking_domains)

# Global cache to track downloaded assets by URL
_asset_cache = {}
_asset_stats = {
  'downloaded': 0, 'cached': 0, 'skipped': 0,
  'images': 0, 'pdfs': 0, 'txt_files': 0, 'other_files': 0
}

def clear_asset_cache():
  """Clear the asset cache and reset stats (call at start of new crawl)"""
  global _asset_cache, _asset_stats
  _asset_cache.clear()
  _asset_stats = {
    'downloaded': 0, 'cached': 0, 'skipped': 0,
    'images': 0, 'pdfs': 0, 'txt_files': 0, 'other_files': 0
  }
  print("Asset cache cleared")

def cleanup_duplicate_assets(out_dir):
  """Remove duplicate assets based on content hash (run after crawl)"""
  import hashlib
  from collections import defaultdict

  try:
    assets_dir = Path(out_dir) / 'assets'
    if not assets_dir.exists():
      return

    print("Scanning for duplicate assets...")

    # Track files by content hash
    content_hashes = defaultdict(list)

    # Scan all asset directories
    for root_dir in [assets_dir, assets_dir / 'pdf', assets_dir / 'txt']:
      if not root_dir.exists():
        continue

      for file_path in root_dir.iterdir():
        if file_path.is_file():
          try:
            with open(file_path, 'rb') as f:
              content = f.read()
            content_hash = hashlib.md5(content).hexdigest()
            content_hashes[content_hash].append(file_path)
          except Exception:
            continue

    # Remove duplicates (keep the first one, remove others)
    removed_count = 0
    for content_hash, file_list in content_hashes.items():
      if len(file_list) > 1:
        # Keep the first file, remove the rest
        for duplicate_file in file_list[1:]:
          try:
            duplicate_file.unlink()
            removed_count += 1
            print(f"Removed duplicate: {duplicate_file.name}")
          except Exception as e:
            print(f"Failed to remove {duplicate_file.name}: {e}")

    if removed_count > 0:
      print(f"Cleanup complete: Removed {removed_count} duplicate assets")
    else:
      print("No duplicate assets found")

  except Exception as e:
    print(f"Error during asset cleanup: {e}")

def get_asset_stats():
  """Get current asset download statistics"""
  return _asset_stats.copy()

def save_asset_cache(out_dir):
  """Save asset cache to disk for persistence"""
  try:
    cache_file = os.path.join(out_dir, '.asset_cache.json')
    with open(cache_file, 'w') as f:
      json.dump(_asset_cache, f, indent=2)
    print(f"Asset cache saved ({len(_asset_cache)} entries)")
  except Exception as e:
    print(f"Failed to save asset cache: {e}")

def load_asset_cache(out_dir):
  """Load asset cache from disk"""
  try:
    cache_file = os.path.join(out_dir, '.asset_cache.json')
    if os.path.exists(cache_file):
      with open(cache_file, 'r') as f:
        global _asset_cache
        _asset_cache = json.load(f)
      print(f"Asset cache loaded ({len(_asset_cache)} entries)")
    else:
      print("No existing asset cache found")
  except Exception as e:
    print(f"Failed to load asset cache: {e}")
    _asset_cache.clear()

def find_existing_file_by_content_hash(assets_dir, content_hash, is_pdf, is_text, is_other=False):
  """Find existing file with same content hash to avoid content duplicates"""
  import hashlib

  try:
    # Determine which directories to search
    search_dirs = [assets_dir]  # Always search main assets dir

    if is_pdf:
      pdf_dir = assets_dir / 'pdf'
      if pdf_dir.exists():
        search_dirs.append(pdf_dir)
    elif is_text:
      txt_dir = assets_dir / 'txt'
      if txt_dir.exists():
        search_dirs.append(txt_dir)
    elif is_other:
      other_dir = assets_dir / 'other'
      if other_dir.exists():
        search_dirs.append(other_dir)

    # Search all relevant directories
    for search_dir in search_dirs:
      if not search_dir.exists():
        continue

      for existing_file in search_dir.iterdir():
        if existing_file.is_file():
          try:
            # Calculate hash of existing file
            with open(existing_file, 'rb') as f:
              existing_content = f.read()
            existing_hash = hashlib.md5(existing_content).hexdigest()[:8]

            # If hashes match, we found a duplicate
            if existing_hash == content_hash:
              # Return relative path based on file location
              if existing_file.parent.name == 'pdf':
                return f"./assets/pdf/{existing_file.name}"
              elif existing_file.parent.name == 'txt':
                return f"./assets/txt/{existing_file.name}"
              elif existing_file.parent.name == 'other':
                return f"./assets/other/{existing_file.name}"
              else:
                return f"./assets/{existing_file.name}"

          except Exception:
            # Skip files we can't read
            continue

    return None

  except Exception as e:
    print(f"Error checking for content duplicates: {e}")
    return None

def normalize_url(url):
  """Normalize URL by removing dynamic parameters that cause duplicates"""
  from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

  try:
    parsed = urlparse(url)

    # Remove common dynamic parameters that cause duplicates
    dynamic_params = {
      'v', 'version', 'timestamp', 'ts', 't', 'cache', 'cb', 'cachebuster',
      '_', 'rand', 'random', 'time', 'nocache', 'bust', 'rev', 'r'
    }

    # Parse query parameters
    query_params = parse_qs(parsed.query, keep_blank_values=True)

    # Remove dynamic parameters
    filtered_params = {
      key: value for key, value in query_params.items()
      if key.lower() not in dynamic_params
    }

    # Rebuild query string
    new_query = urlencode(filtered_params, doseq=True)

    # Rebuild URL
    normalized = urlunparse((
      parsed.scheme, parsed.netloc, parsed.path,
      parsed.params, new_query, parsed.fragment
    ))

    return normalized

  except Exception:
    # If normalization fails, return original URL
    return url

def download_asset(url, assets_dir, base_url):
  """Download an image or PDF and return local path (with advanced deduplication)"""
  try:
    if is_tracking_pixel(url):
      return None

    # Make URL absolute
    if url.startswith('//'):
      url = 'https:' + url
    elif url.startswith('/'):
      url = urljoin(base_url, url)

    # Normalize URL to remove dynamic parameters
    normalized_url = normalize_url(url)

    # Check if we've already downloaded this normalized URL
    if normalized_url in _asset_cache:
      cached_path = _asset_cache[normalized_url]
      # Verify the file still exists
      if cached_path and (assets_dir / Path(cached_path).name).exists():
        _asset_stats['cached'] += 1
        print(f"Using cached asset (normalized): {url} -> {cached_path}")
        return cached_path
      else:
        # Remove from cache if file doesn't exist
        del _asset_cache[normalized_url]

    # Get file extension
    parsed = urlparse(url)
    path_parts = parsed.path.split('/')
    filename = path_parts[-1] if path_parts[-1] else 'image'

    # Clean filename and add extension if missing
    filename = re.sub(r'[^\w\-_\.]', '_', filename)
    if '.' not in filename:
      filename += '.jpg'  # Default extension

    # Create a hash-based filename using normalized URL to ensure uniqueness while avoiding duplicates
    import hashlib
    url_hash = hashlib.md5(normalized_url.encode()).hexdigest()[:8]
    name, ext = (filename.rsplit('.', 1) if '.' in filename else (filename, 'jpg'))
    unique_filename = f"{name}_{url_hash}.{ext}"

    # We'll determine the final path after checking content type
    local_path = assets_dir / unique_filename

    # Download file
    print(f"Downloading asset: {url}")
    response = requests.get(url, timeout=10, stream=True)
    response.raise_for_status()

    # Check if it's actually an image/PDF/text file or other downloadable file
    content_type = response.headers.get('content-type', '').lower()
    is_pdf = 'application/pdf' in content_type
    is_image = any(t in content_type for t in ['image/'])
    is_text = any(t in content_type for t in ['text/plain', 'application/octet-stream']) and url.lower().endswith('.txt')

    # Check for other common file types we want to download
    other_extensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.csv', '.xml', '.json']
    is_other = any(url.lower().endswith(ext) for ext in other_extensions)

    if not (is_pdf or is_image or is_text or is_other):
      _asset_stats['skipped'] += 1
      print(f"Skipping non-supported asset: {url} (content-type: {content_type})")
      return None

    # Determine the correct subdirectory based on content type
    if is_pdf:
      # Create PDF subdirectory
      pdf_dir = assets_dir / 'pdf'
      pdf_dir.mkdir(exist_ok=True)
      final_path = pdf_dir / unique_filename
      relative_path = f"./assets/pdf/{unique_filename}"
    elif is_text:
      # Create TXT subdirectory
      txt_dir = assets_dir / 'txt'
      txt_dir.mkdir(exist_ok=True)
      final_path = txt_dir / unique_filename
      relative_path = f"./assets/txt/{unique_filename}"
    elif is_other:
      # Create OTHER subdirectory for other file types
      other_dir = assets_dir / 'other'
      other_dir.mkdir(exist_ok=True)
      final_path = other_dir / unique_filename
      relative_path = f"./assets/other/{unique_filename}"
    else:
      # Images go in main assets directory
      final_path = local_path
      relative_path = f"./assets/{unique_filename}"

    # Update cache and check if file already exists in correct location
    if final_path.exists():
      _asset_cache[normalized_url] = relative_path
      _asset_stats['cached'] += 1

      # Track by file type for cached assets too
      if is_pdf:
        _asset_stats['pdfs'] += 1
        asset_type = "PDF"
      elif is_text:
        _asset_stats['txt_files'] += 1
        asset_type = "TXT"
      elif is_other:
        _asset_stats['other_files'] += 1
        asset_type = "other"
      else:
        _asset_stats['images'] += 1
        asset_type = "image"

      print(f"Cached {asset_type} already exists: {url} -> {relative_path}")
      return relative_path

    # Download content to memory first for content-based deduplication
    content = b''
    for chunk in response.iter_content(chunk_size=8192):
      content += chunk

    # Create content hash for duplicate detection
    content_hash = hashlib.md5(content).hexdigest()[:8]

    # Check if we already have a file with this exact content
    existing_file = find_existing_file_by_content_hash(assets_dir, content_hash, is_pdf, is_text, is_other)
    if existing_file:
      _asset_cache[normalized_url] = existing_file
      _asset_stats['cached'] += 1

      # Track by file type for cached content duplicates
      if is_pdf:
        _asset_stats['pdfs'] += 1
        asset_type = "PDF"
      elif is_text:
        _asset_stats['txt_files'] += 1
        asset_type = "TXT"
      elif is_other:
        _asset_stats['other_files'] += 1
        asset_type = "other"
      else:
        _asset_stats['images'] += 1
        asset_type = "image"

      print(f"Content duplicate found for {asset_type}: {url} -> {existing_file}")
      return existing_file

    # Save file to the correct location
    with open(final_path, 'wb') as f:
      f.write(content)

    _asset_cache[normalized_url] = relative_path
    _asset_stats['downloaded'] += 1

    # Track by file type
    if is_pdf:
      _asset_stats['pdfs'] += 1
      asset_type = "PDF"
    elif is_text:
      _asset_stats['txt_files'] += 1
      asset_type = "TXT"
    elif is_other:
      _asset_stats['other_files'] += 1
      asset_type = "other"
    else:
      _asset_stats['images'] += 1
      asset_type = "image"

    print(f"Downloaded {asset_type}: {url} -> {relative_path}")
    return relative_path

  except Exception as e:
    print(f"Failed to download {url}: {e}")
    return None

# Optional: if crawl4ai is not installed, the user must run
#   pip install -r requirements.txt
try:
  from crawl4ai import (  # type: ignore
    AsyncWebCrawler,
    BrowserConfig,
    CrawlerRunConfig,
    UndetectedAdapter,
    PlaywrightAdapter,
    RateLimiter,
    CrawlerMonitor,
    DisplayMode,
  )
  from crawl4ai.async_crawler_strategy import AsyncPlaywrightCrawlerStrategy  # type: ignore
  from crawl4ai.async_dispatcher import MemoryAdaptiveDispatcher, SemaphoreDispatcher  # type: ignore
  from crawl4ai.processors.pdf import PDFContentScrapingStrategy, PDFCrawlerStrategy  # type: ignore
except Exception as e:
  raise SystemExit("crawl4ai is not installed. Run: pip install -r requirements.txt") from e

ROOT = os.path.dirname(__file__)


def read_brands():
  with open(os.path.join(ROOT, 'brands.json'), 'r', encoding='utf-8') as f:
    return json.load(f)


def same_origin(u: str, origin: str) -> bool:
  try:
    return urlparse(u).netloc == urlparse(origin).netloc and urlparse(u).scheme in ("http", "https")
  except Exception:
    return False


def fetch_text(url: str, timeout: int = 10) -> str:
  req = Request(url, headers={'User-Agent': 'Crawl4AI-Runner/1.0'})
  with urlopen(req, timeout=timeout) as r:  # nosec - user controlled domains are partners
    return r.read().decode('utf-8', errors='ignore')


def discover_sitemap_urls(origin: str, timeout: int = 10) -> list[str]:
  seeds: set[str] = set()
  # robots.txt discovery
  try:
    robots = urljoin(origin, '/robots.txt')
    text = fetch_text(robots, timeout)
    for line in text.splitlines():
      if line.lower().startswith('sitemap:'):
        sm = line.split(':', 1)[1].strip()
        if sm:
          seeds.update(fetch_sitemap(sm, timeout))
  except Exception:
    pass
  # common fallbacks
  for p in ['/sitemap.xml', '/sitemap_index.xml']:
    try:
      seeds.update(fetch_sitemap(urljoin(origin, p), timeout))
    except Exception:
      pass
  # only same-origin
  return [u for u in seeds if same_origin(u, origin)]


def fetch_sitemap(sitemap_url: str, timeout: int = 10) -> list[str]:
  try:
    xml = fetch_text(sitemap_url, timeout)
    tree = ET.fromstring(xml)
  except Exception:
    return []
  ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
  urls: list[str] = []
  # urlset
  for loc in tree.findall('.//sm:url/sm:loc', ns):
    if loc.text:
      urls.append(loc.text.strip())
  # sitemapindex (one level deep)
  for loc in tree.findall('.//sm:sitemap/sm:loc', ns):
    if loc.text:
      urls.extend(fetch_sitemap(loc.text.strip(), timeout))
  return urls


def safe_name(u: str) -> str:
  p = urlparse(u)
  path = p.path.rstrip('/') or '/index'
  name = path.replace('/', '_')
  if p.query:
    name += '_' + p.query.replace('=', '-').replace('&', '_')
  return name + '.md'


async def crawl_brand(
    slug: str,
    origin: str,
    max_pages: int,
    concurrency: int,
    out_dir: str,
    *,
    enable_stealth: bool,
    use_undetected: bool,
    progressive: bool,
    headless: bool,
    wait_time: float,
    delay_before_return_html: float,
    user_agent: str | None,
    capture_network: bool,
    capture_console: bool,
    download_assets: bool = False,
):
  os.makedirs(out_dir, exist_ok=True)

  # Handle asset cache for deduplication
  if download_assets:
    # Load existing cache to avoid re-downloading assets from previous runs
    load_asset_cache(out_dir)
    print(f"[{slug}] Asset downloading enabled")
  # seed from sitemap; if none, start with origin
  urls = discover_sitemap_urls(origin)
  if not urls:
    urls = [origin]
  # limit pages if requested (0 => no limit)
  if max_pages and max_pages > 0:
    urls = urls[:max_pages]

  sem = asyncio.Semaphore(concurrency)

  async def run_with_config(url: str, *, stealth: bool, undetected: bool):
    headers = {"User-Agent": user_agent} if user_agent else None
    bcfg = BrowserConfig(enable_stealth=stealth, headless=headless, headers=headers, verbose=False)
    adapter = UndetectedAdapter() if undetected else PlaywrightAdapter()
    strategy = AsyncPlaywrightCrawlerStrategy(browser_config=bcfg, browser_adapter=adapter)
    run_cfg = CrawlerRunConfig(
      page_timeout=int(wait_time * 1000),  # Convert seconds to milliseconds
      delay_before_return_html=delay_before_return_html,
      capture_network_requests=capture_network,
      capture_console_messages=capture_console,
    )
    async with AsyncWebCrawler(crawler_strategy=strategy, config=bcfg) as crawler:
      return await crawler.arun(url=url, config=run_cfg)

  async def fetch_and_write(url: str):
    async with sem:
      try:
        result = None
        if progressive:
          # Step 1: regular without stealth (to avoid import issues)
          result = await run_with_config(url, stealth=False, undetected=False)
          success = getattr(result, 'success', False) and 'Access Denied' not in getattr(result, 'html', '')
          if not success:
            # Step 2: undetected without stealth
            result = await run_with_config(url, stealth=False, undetected=True)
        else:
          result = await run_with_config(url, stealth=enable_stealth, undetected=use_undetected)

        md = getattr(result, 'markdown', '') or ''
        fname = safe_name(url)
        # Write markdown
        # Extract asset URLs present in markdown for this page
        asset_urls = []
        try:
          # Find image markdown: ![alt](url)
          img_urls = re.findall(r'!\[[^\]]*\]\(([^\)]+)\)', md)
          asset_urls.extend(img_urls)

          # Find PDF links: [text](url.pdf "title") - extract just the URL part
          pdf_matches = re.findall(r'\[[^\]]*\]\(([^\s\)]*\.pdf)(?:\s[^\)]*)?\)', md, re.IGNORECASE)
          asset_urls.extend(pdf_matches)

          # Find TXT links: [text](url.txt "title") - extract just the URL part
          txt_matches = re.findall(r'\[[^\]]*\]\(([^\s\)]*\.txt)(?:\s[^\)]*)?\)', md, re.IGNORECASE)
          asset_urls.extend(txt_matches)

          # Find other file types: [text](url.ext "title") - extract just the URL part
          other_extensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'csv', 'xml', 'json']
          other_matches = []
          for ext in other_extensions:
            matches = re.findall(rf'\[[^\]]*\]\(([^\s\)]*\.{ext})(?:\s[^\)]*)?\)', md, re.IGNORECASE)
            other_matches.extend(matches)
          asset_urls.extend(other_matches)

        except Exception:
          asset_urls = []

        # Download assets if requested
        if download_assets and asset_urls:
          assets_dir = Path(out_dir) / 'assets'
          assets_dir.mkdir(exist_ok=True)

          # Download all assets (images, PDFs, TXT files) and update markdown
          for asset_url in asset_urls:
            local_path = download_asset(asset_url, assets_dir, getattr(result, 'url', url))
            if local_path:
              md = md.replace(f']({asset_url})', f']({local_path})')

        if asset_urls:
          meta = {
            "page_url": getattr(result, 'url', url),
            "asset_urls": asset_urls,
            "image_urls": img_urls,
            "pdf_urls": pdf_matches,
            "txt_urls": txt_matches,
            "other_urls": other_matches
          }
          meta_name = fname.replace('.md', '.assets.json')
          with open(os.path.join(out_dir, meta_name), 'w', encoding='utf-8') as fim:
            json.dump(meta, fim, indent=2)

        with open(os.path.join(out_dir, fname), 'w', encoding='utf-8') as f:
          f.write(md)
        # Optionally write capture data alongside markdown
        if capture_network or capture_console:
          capture = {
            "url": getattr(result, 'url', url),
            "network_requests": getattr(result, 'network_requests', []) or [],
            "console_messages": getattr(result, 'console_messages', []) or [],
          }
          cap_name = fname.replace('.md', '.capture.json')
          with open(os.path.join(out_dir, cap_name), 'w', encoding='utf-8') as fcap:
            json.dump(capture, fcap, indent=2)
        print(f'[{slug}] OK {url}')
      except Exception as e:
        print(f'[{slug}] ERROR {url} -> {e}')

  tasks = [fetch_and_write(u) for u in urls if same_origin(u, origin)]
  await asyncio.gather(*tasks)

  # Print asset download statistics and save cache
  if download_assets:
    stats = get_asset_stats()
    total_assets = stats['downloaded'] + stats['cached'] + stats['skipped']
    if total_assets > 0:
      print(f"[{slug}] Asset Summary: {stats['downloaded']} downloaded, {stats['cached']} cached (duplicates avoided), {stats['skipped']} skipped")
      print(f"[{slug}] File Types: {stats['images']} images, {stats['pdfs']} PDFs, {stats['txt_files']} TXT files, {stats['other_files']} other files")

    # Clean up any remaining duplicates
    cleanup_duplicate_assets(out_dir)

    # Save cache for future runs
    save_asset_cache(out_dir)


async def crawl_brand_many(
    slug: str,
    origin: str,
    max_pages: int,
    out_dir: str,
    *,
    enable_stealth: bool,
    use_undetected: bool,
    headless: bool,
    wait_time: float,
    delay_before_return_html: float,
    user_agent: str | None,
    capture_network: bool,
    capture_console: bool,
    dispatcher_type: str,
    stream: bool,
    memory_threshold: float,
    max_permit: int,
    semaphore_count: int,
    base_delay_low: float,
    base_delay_high: float,
    max_delay: float,
    max_retries: int,
    check_robots: bool,
    include_pdfs: bool,
):
  os.makedirs(out_dir, exist_ok=True)
  # seed list from sitemap (fallback to origin)
  urls = discover_sitemap_urls(origin)
  if not urls:
    urls = [origin]
  if max_pages and max_pages > 0:
    urls = urls[:max_pages]

  headers = {"User-Agent": user_agent} if user_agent else None
  bcfg = BrowserConfig(enable_stealth=enable_stealth, headless=headless, headers=headers, verbose=False)
  adapter = UndetectedAdapter() if use_undetected else PlaywrightAdapter()
  crawler_strategy = AsyncPlaywrightCrawlerStrategy(browser_config=bcfg, browser_adapter=adapter)

  # Rate limiter and monitor
  rl = RateLimiter(base_delay=(base_delay_low, base_delay_high), max_delay=max_delay, max_retries=max_retries)
  # Use TEXT display to reduce fancy unicode arrows in console
  monitor = CrawlerMonitor(max_visible_rows=15, display_mode=DisplayMode.TEXT)

  # Dispatcher choice
  if dispatcher_type == 'semaphore':
    dispatcher = SemaphoreDispatcher(semaphore_count=semaphore_count, rate_limiter=rl, monitor=monitor)
  else:
    dispatcher = MemoryAdaptiveDispatcher(memory_threshold_percent=memory_threshold, max_session_permit=max_permit, rate_limiter=rl, monitor=monitor)

  # URL-specific configs (PDF vs HTML)
  run_default = CrawlerRunConfig(
    page_timeout=int(wait_time * 1000),  # Convert seconds to milliseconds
    delay_before_return_html=delay_before_return_html,
    capture_network_requests=capture_network,
    capture_console_messages=capture_console,
    stream=stream,
    check_robots_txt=check_robots,
  )

  configs = [run_default]
  if include_pdfs:
    configs = [
      CrawlerRunConfig(
        url_matcher="*.pdf",
        scraping_strategy=PDFContentScrapingStrategy(),
        check_robots_txt=check_robots,
      ),
      run_default,
    ]

  async with AsyncWebCrawler(crawler_strategy=crawler_strategy, config=bcfg) as crawler:
    if stream:
      async for result in await crawler.arun_many(urls=urls, config=configs, dispatcher=dispatcher):
        await _write_result(slug, out_dir, result)
    else:
      results = await crawler.arun_many(urls=urls, config=configs, dispatcher=dispatcher)
      for result in results:
        await _write_result(slug, out_dir, result)


async def _write_result(slug: str, out_dir: str, result):
  try:
    url = getattr(result, 'url', 'unknown')
    md = getattr(result, 'markdown', '') or ''
    fname = safe_name(url)
    with open(os.path.join(out_dir, fname), 'w', encoding='utf-8') as f:
      f.write(md)
    # Extract image URLs present in markdown for this page (many-mode writer)
    img_urls = []
    try:
      img_urls = re.findall(r'!\[[^\]]*\]\(([^\)]+)\)', md)
    except Exception:
      img_urls = []
    if img_urls:
      meta = {
        "page_url": url,
        "image_urls": img_urls,
      }
      meta_name = fname.replace('.md', '.images.json')
      with open(os.path.join(out_dir, meta_name), 'w', encoding='utf-8') as fim:
        json.dump(meta, fim, indent=2)
    net = getattr(result, 'network_requests', None)
    con = getattr(result, 'console_messages', None)
    if net or con:
      capture = {"url": url, "network_requests": net or [], "console_messages": con or []}
      cap_name = fname.replace('.md', '.capture.json')
      with open(os.path.join(out_dir, cap_name), 'w', encoding='utf-8') as fcap:
        json.dump(capture, fcap, indent=2)
    print(f'[{slug}] OK {url}')
  except Exception as e:
    print(f'[{slug}] ERROR write result -> {e}')


def main():
  parser = argparse.ArgumentParser(description='Crawl partner brand sites using Crawl4AI and save Markdown')
  parser.add_argument('--brand', help='Single brand slug from brands.json')
  parser.add_argument('--maxPages', type=int, default=0, help='Limit pages per brand (0 = no limit)')
  parser.add_argument('--concurrency', type=int, default=4, help='Concurrent pages per brand')
  parser.add_argument('--stealth', action='store_true', help='Enable stealth mode fingerprint hardening (may cause import issues)')
  parser.add_argument('--downloadAssets', action='store_true', help='Download images and PDFs locally and rewrite markdown paths')
  parser.add_argument('--undetected', action='store_true', help='Use undetected browser adapter')
  parser.add_argument('--progressive', action='store_true', help='Try stealth first, then undetected if blocked')
  parser.add_argument('--headless', action='store_true', help='Run browser headless (default off)')
  parser.add_argument('--wait', type=float, default=3.0, help='Wait time after load (s)')
  parser.add_argument('--delay', type=float, default=2.0, help='Extra delay before returning HTML (s)')
  parser.add_argument('--userAgent', type=str, default=None, help='Custom User-Agent header')
  parser.add_argument('--captureNetwork', action='store_true', help='Capture all network requests/responses')
  parser.add_argument('--captureConsole', action='store_true', help='Capture browser console messages')
  # arun_many / dispatcher options
  parser.add_argument('--many', action='store_true', help='Use arun_many with dispatcher for multi-URL crawling')
  parser.add_argument('--dispatcher', choices=['memory','semaphore'], default='memory', help='Dispatcher type for arun_many')
  parser.add_argument('--stream', action='store_true', help='Stream results during arun_many')
  parser.add_argument('--memoryThreshold', type=float, default=80.0, help='Memory threshold % for MemoryAdaptiveDispatcher')
  parser.add_argument('--maxPermit', type=int, default=10, help='Max concurrent sessions for MemoryAdaptiveDispatcher')
  parser.add_argument('--semaphore', type=int, default=5, help='Semaphore count for SemaphoreDispatcher')
  parser.add_argument('--baseDelayLow', type=float, default=1.0, help='RateLimiter base delay low (s)')
  parser.add_argument('--baseDelayHigh', type=float, default=3.0, help='RateLimiter base delay high (s)')
  parser.add_argument('--maxDelay', type=float, default=30.0, help='RateLimiter max backoff delay (s)')
  parser.add_argument('--retries', type=int, default=3, help='RateLimiter max retries')
  parser.add_argument('--robots', action='store_true', help='Respect robots.txt during crawling')
  parser.add_argument('--pdfs', action='store_true', help='Include PDF URLs (use PDF scraping strategy)')
  args = parser.parse_args()

  brands = read_brands()
  targets = [b for b in brands if (not args.brand or b['slug'] == args.brand)]
  if not targets:
    raise SystemExit('No matching brands. Use --brand=<slug> or edit brands.json')

  for b in targets:
    slug = b['slug']
    origin = b['origin']
    out_dir = os.path.join(ROOT, 'output_markdown', slug)
    if args.many:
      asyncio.run(crawl_brand_many(
        slug, origin, args.maxPages, out_dir,
        enable_stealth=args.stealth,
        use_undetected=args.undetected,
        headless=args.headless,
        wait_time=args.wait,
        delay_before_return_html=args.delay,
        user_agent=args.userAgent,
        capture_network=args.captureNetwork,
        capture_console=args.captureConsole,
        dispatcher_type=args.dispatcher,
        stream=args.stream,
        memory_threshold=args.memoryThreshold,
        max_permit=args.maxPermit,
        semaphore_count=args.semaphore,
        base_delay_low=args.baseDelayLow,
        base_delay_high=args.baseDelayHigh,
        max_delay=args.maxDelay,
        max_retries=args.retries,
        check_robots=args.robots,
        include_pdfs=args.pdfs,
      ))
    else:
      asyncio.run(crawl_brand(
        slug, origin, args.maxPages, args.concurrency, out_dir,
        enable_stealth=args.stealth,
        use_undetected=args.undetected,
        progressive=args.progressive,
        headless=args.headless,
        wait_time=args.wait,
        delay_before_return_html=args.delay,
        user_agent=args.userAgent,
        capture_network=args.captureNetwork,
        capture_console=args.captureConsole,
        download_assets=args.downloadAssets,
      ))


if __name__ == '__main__':
  main()
