import argparse
import glob
import json
import os
from typing import List, Tuple

try:
  from crawl4ai.content_filter_strategy import PruningContentFilter, BM25ContentFilter  # type: ignore
except Exception as e:
  raise SystemExit("crawl4ai is not installed. Run: pip install -r requirements.txt") from e

ROOT = os.path.dirname(__file__)


def read_markdown_and_url(md_path: str) -> Tuple[str, str]:
  """Return (markdown, url_if_known) by looking for a sibling .capture.json file."""
  md = ''
  try:
    with open(md_path, 'r', encoding='utf-8') as f:
      md = f.read()
  except Exception:
    pass
  url = ''
  cap_path = md_path.replace('.md', '.capture.json')
  if os.path.exists(cap_path):
    try:
      with open(cap_path, 'r', encoding='utf-8') as f:
        cap = json.load(f)
        url = cap.get('url', '') or ''
    except Exception:
      url = ''
  return md, url


def apply_filters(text: str, prune_threshold: float | None, prune_min_words: int | None, bm25_query: str | None, bm25_threshold: float | None) -> str:
  chunks: List[str] = [text]
  # Prune first (if configured)
  if prune_threshold is not None:
    pf = PruningContentFilter(threshold=prune_threshold, min_word_threshold=(prune_min_words or 0))
    pruned = []
    for ch in chunks:
      try:
        pruned.extend(pf.filter_content(ch))
      except Exception:
        pruned.append(ch)
    chunks = pruned if pruned else chunks
  # BM25 on the output (if configured)
  if bm25_query:
    bf = BM25ContentFilter(user_query=bm25_query, bm25_threshold=(bm25_threshold or 0.0))
    scored = []
    for ch in chunks:
      try:
        scored.extend(bf.filter_content(ch))
      except Exception:
        scored.append(ch)
    chunks = scored if scored else chunks
  return "\n\n---\n\n".join(chunks)


def aggregate_brand(brand_slug: str, *, bm25_query: str | None, bm25_threshold: float | None, prune_threshold: float | None, prune_min_words: int | None) -> str:
  in_dir = os.path.join(ROOT, 'output_markdown', brand_slug)
  out_dir = os.path.join(ROOT, 'output_markdown', '_aggregated')
  os.makedirs(out_dir, exist_ok=True)
  md_files = sorted(glob.glob(os.path.join(in_dir, '*.md')))
  if not md_files:
    return ''

  parts: List[str] = []
  for p in md_files:
    md, url = read_markdown_and_url(p)
    if not md:
      continue
    header = f"### Page: {url}\n\n" if url else ''
    parts.append(header + md)

  aggregated = "\n\n\n".join(parts)
  filtered = apply_filters(aggregated, prune_threshold, prune_min_words, bm25_query, bm25_threshold)
  out_path = os.path.join(out_dir, f"{brand_slug}.md")
  with open(out_path, 'w', encoding='utf-8') as f:
    f.write(filtered)
  return out_path


def main():
  parser = argparse.ArgumentParser(description='Aggregate crawled markdown per brand and optionally apply pruning/BM25 filters')
  parser.add_argument('--brand', help='Single brand slug to aggregate (default: all under output_markdown)')
  parser.add_argument('--bm25', dest='bm25_query', default=None, help='BM25 user query to keep relevant chunks')
  parser.add_argument('--bm25Threshold', type=float, default=None, help='BM25 score threshold (e.g., 1.2)')
  parser.add_argument('--prune', dest='prune_threshold', type=float, default=None, help='Pruning threshold (e.g., 0.5)')
  parser.add_argument('--minWords', dest='prune_min_words', type=int, default=None, help='Minimum words for pruning (e.g., 50)')
  args = parser.parse_args()

  base = os.path.join(ROOT, 'output_markdown')
  if args.brand:
    slugs = [args.brand]
  else:
    slugs = [d for d in os.listdir(base) if os.path.isdir(os.path.join(base, d)) and not d.startswith('_')]

  results = []
  for slug in slugs:
    out = aggregate_brand(
      slug,
      bm25_query=args.bm25_query,
      bm25_threshold=args.bm25Threshold,
      prune_threshold=args.prune_threshold,
      prune_min_words=args.prune_min_words,
    )
    if out:
      results.append((slug, out))
      print(f"[{slug}] Aggregated -> {out}")
    else:
      print(f"[{slug}] No markdown files found to aggregate.")

  if not results:
    print('No aggregates produced.')


if __name__ == '__main__':
  main()

