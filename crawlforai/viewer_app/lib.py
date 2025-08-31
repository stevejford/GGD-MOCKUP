import os
import json
from pathlib import Path
from typing import List, Tuple, Optional

ROOT = Path(__file__).resolve().parents[1]


def get_crawl_root() -> Path:
    env = os.getenv('CRAWL_MD_ROOT')
    if env and env.strip():
        return Path(env).resolve()
    # default to ../crawlforai/output_markdown relative to app root
    return (ROOT / 'output_markdown').resolve()


def list_brands() -> List[str]:
    root = get_crawl_root()
    if not root.exists():
        return []
    return [p.name for p in root.iterdir() if p.is_dir() and not p.name.startswith('_')]


def list_brand_files(brand: str) -> List[str]:
    dir_path = get_crawl_root() / brand
    if not dir_path.exists():
        return []
    return sorted([p.name for p in dir_path.iterdir() if p.is_file() and p.suffix == '.md'])


def read_brand_file(brand: str, fname: str) -> Tuple[str, Optional[dict]]:
    dir_path = get_crawl_root() / brand
    md_path = dir_path / fname
    cap_path = md_path.with_suffix('.capture.json')
    markdown = ''
    capture = None
    try:
        markdown = md_path.read_text(encoding='utf-8')
    except Exception:
        markdown = ''
    try:
        if cap_path.exists():
            capture = json.loads(cap_path.read_text(encoding='utf-8'))
    except Exception:
        capture = None
    return markdown, capture


def aggregated_path(brand: str) -> Optional[Path]:
    agg = get_crawl_root() / '_aggregated' / f'{brand}.md'
    return agg if agg.exists() else None


def read_aggregated(brand: str) -> str:
    p = aggregated_path(brand)
    if not p:
        return ''
    try:
        return p.read_text(encoding='utf-8')
    except Exception:
        return ''

