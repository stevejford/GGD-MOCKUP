#!/usr/bin/env python3
"""
Cleanup script to remove duplicate assets from ALL brand directories.
This will scan all brands and remove files with identical content.
"""

import hashlib
import os
from pathlib import Path
from collections import defaultdict

def cleanup_duplicate_assets(brand_dir):
    """Remove duplicate assets based on content hash for a single brand"""
    
    brand_name = brand_dir.name
    assets_dir = brand_dir / 'assets'
    
    if not assets_dir.exists():
        print(f"  ⚠️  No assets directory found for {brand_name}")
        return 0, 0
    
    print(f"  🔍 Scanning {brand_name}...")
    
    # Track files by content hash
    content_hashes = defaultdict(list)
    total_files = 0
    
    # Scan all asset directories
    for root_dir in [assets_dir, assets_dir / 'pdf', assets_dir / 'txt']:
        if not root_dir.exists():
            continue
            
        for file_path in root_dir.iterdir():
            if file_path.is_file():
                total_files += 1
                try:
                    with open(file_path, 'rb') as f:
                        content = f.read()
                    content_hash = hashlib.md5(content).hexdigest()
                    content_hashes[content_hash].append(file_path)
                        
                except Exception as e:
                    print(f"    ⚠️  Error reading {file_path.name}: {e}")
                    continue
    
    # Find and remove duplicates
    duplicate_groups = {h: files for h, files in content_hashes.items() if len(files) > 1}
    
    if not duplicate_groups:
        print(f"    ✅ {brand_name}: No duplicates found ({total_files} files)")
        return 0, 0
    
    removed_count = 0
    saved_space = 0
    
    for content_hash, file_list in duplicate_groups.items():
        # Sort by modification time (keep the oldest/first one)
        file_list.sort(key=lambda f: f.stat().st_mtime)
        
        keep_file = file_list[0]
        duplicate_files = file_list[1:]
        
        for duplicate_file in duplicate_files:
            try:
                file_size = duplicate_file.stat().st_size
                duplicate_file.unlink()
                removed_count += 1
                saved_space += file_size
            except Exception as e:
                print(f"    ⚠️  Failed to remove {duplicate_file.name}: {e}")
    
    print(f"    🧹 {brand_name}: Removed {removed_count} duplicates, saved {saved_space:,} bytes")
    
    # Update asset cache
    update_asset_cache(brand_dir, duplicate_groups)
    
    return removed_count, saved_space

def update_asset_cache(brand_dir, duplicate_groups):
    """Update asset cache to remove references to deleted duplicate files"""
    
    cache_file = brand_dir / '.asset_cache.json'
    if not cache_file.exists():
        return
    
    try:
        import json
        
        with open(cache_file, 'r') as f:
            cache = json.load(f)
        
        # Get list of all removed files
        removed_files = []
        for file_list in duplicate_groups.values():
            removed_files.extend([f.name for f in file_list[1:]])  # Skip the first (kept) file
        
        # Remove cache entries for deleted files
        updated_cache = {}
        removed_entries = 0
        
        for url, path in cache.items():
            filename = path.split('/')[-1]  # Extract filename from path
            if filename not in removed_files:
                updated_cache[url] = path
            else:
                removed_entries += 1
        
        # Save updated cache
        with open(cache_file, 'w') as f:
            json.dump(updated_cache, f, indent=2)
        
        if removed_entries > 0:
            print(f"    📝 Updated asset cache: removed {removed_entries} entries")
    
    except Exception as e:
        print(f"    ⚠️  Failed to update asset cache: {e}")

def get_brand_summary(brand_dir):
    """Get summary statistics for a brand"""
    
    assets_dir = brand_dir / 'assets'
    if not assets_dir.exists():
        return 0, 0, 0, 0
    
    pages = len(list(brand_dir.glob('*.md')))
    images = len(list(assets_dir.glob('*'))) if assets_dir.exists() else 0
    pdfs = len(list((assets_dir / 'pdf').glob('*.pdf'))) if (assets_dir / 'pdf').exists() else 0
    txts = len(list((assets_dir / 'txt').glob('*.txt'))) if (assets_dir / 'txt').exists() else 0
    
    # Subtract directories from image count
    if assets_dir.exists():
        for item in assets_dir.iterdir():
            if item.is_dir():
                images -= 1
    
    return pages, images, pdfs, txts

def main():
    """Main cleanup function for all brands"""
    
    output_dir = Path("crawlforai/output_markdown")
    
    if not output_dir.exists():
        print(f"Output directory not found: {output_dir}")
        print("Please run this script from the project root directory.")
        return
    
    print("🧹 Asset Duplicate Cleanup Tool - ALL BRANDS")
    print("=" * 60)
    
    # Get all brand directories
    brand_dirs = [d for d in output_dir.iterdir() if d.is_dir()]
    
    if not brand_dirs:
        print("No brand directories found.")
        return
    
    print(f"Found {len(brand_dirs)} brand directories:")
    
    # Show summary before cleanup
    print("\n📊 Current Status:")
    total_pages = 0
    total_images = 0
    total_pdfs = 0
    total_txts = 0
    
    for brand_dir in brand_dirs:
        pages, images, pdfs, txts = get_brand_summary(brand_dir)
        total_pages += pages
        total_images += images
        total_pdfs += pdfs
        total_txts += txts
        print(f"  {brand_dir.name}: {pages} pages, {images} images, {pdfs} PDFs, {txts} TXT files")
    
    print(f"\n📈 Totals: {total_pages} pages, {total_images} images, {total_pdfs} PDFs, {total_txts} TXT files")
    
    # Ask for confirmation
    response = input(f"\nClean up duplicates in ALL {len(brand_dirs)} brands? (y/N): ").strip().lower()
    if response != 'y':
        print("Cleanup cancelled.")
        return
    
    print("\n🚀 Starting cleanup...")
    
    # Clean up each brand
    total_removed = 0
    total_saved = 0
    
    for brand_dir in brand_dirs:
        removed, saved = cleanup_duplicate_assets(brand_dir)
        total_removed += removed
        total_saved += saved
    
    print(f"\n🎉 Cleanup Complete!")
    print(f"   Total files removed: {total_removed}")
    print(f"   Total space saved: {total_saved:,} bytes ({total_saved/1024/1024:.1f} MB)")
    
    if total_removed > 0:
        print(f"\n✨ Your crawl data is now optimized!")
        print(f"   Future crawls will be more efficient with the improved deduplication system.")
    else:
        print(f"\n✅ No duplicates found - your data is already optimized!")

if __name__ == "__main__":
    main()
