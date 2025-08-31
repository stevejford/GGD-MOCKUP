#!/usr/bin/env python3
"""
Cleanup script to remove duplicate assets from existing crawl data.
This will scan for files with identical content and remove duplicates.
"""

import hashlib
import os
from pathlib import Path
from collections import defaultdict

def cleanup_duplicate_assets(brand_dir):
    """Remove duplicate assets based on content hash"""
    
    assets_dir = Path(brand_dir) / 'assets'
    if not assets_dir.exists():
        print(f"Assets directory not found: {assets_dir}")
        return
    
    print(f"Scanning for duplicate assets in: {assets_dir}")
    
    # Track files by content hash
    content_hashes = defaultdict(list)
    total_files = 0
    
    # Scan all asset directories
    for root_dir in [assets_dir, assets_dir / 'pdf', assets_dir / 'txt']:
        if not root_dir.exists():
            continue
            
        print(f"Scanning directory: {root_dir}")
        
        for file_path in root_dir.iterdir():
            if file_path.is_file():
                total_files += 1
                try:
                    with open(file_path, 'rb') as f:
                        content = f.read()
                    content_hash = hashlib.md5(content).hexdigest()
                    content_hashes[content_hash].append(file_path)
                    
                    if total_files % 50 == 0:
                        print(f"  Processed {total_files} files...")
                        
                except Exception as e:
                    print(f"  Error reading {file_path.name}: {e}")
                    continue
    
    print(f"Scanned {total_files} files total")
    
    # Find and remove duplicates
    duplicate_groups = {h: files for h, files in content_hashes.items() if len(files) > 1}
    
    if not duplicate_groups:
        print("✅ No duplicate assets found!")
        return
    
    print(f"\n🔍 Found {len(duplicate_groups)} groups of duplicate files:")
    
    removed_count = 0
    saved_space = 0
    
    for content_hash, file_list in duplicate_groups.items():
        print(f"\nDuplicate group (hash: {content_hash[:8]}):")
        
        # Sort by modification time (keep the oldest/first one)
        file_list.sort(key=lambda f: f.stat().st_mtime)
        
        keep_file = file_list[0]
        duplicate_files = file_list[1:]
        
        print(f"  ✅ KEEPING: {keep_file.name}")
        
        for duplicate_file in duplicate_files:
            try:
                file_size = duplicate_file.stat().st_size
                duplicate_file.unlink()
                removed_count += 1
                saved_space += file_size
                print(f"  ❌ REMOVED: {duplicate_file.name} ({file_size:,} bytes)")
            except Exception as e:
                print(f"  ⚠️  FAILED to remove {duplicate_file.name}: {e}")
    
    print(f"\n🎉 Cleanup complete!")
    print(f"   Removed: {removed_count} duplicate files")
    print(f"   Saved space: {saved_space:,} bytes ({saved_space/1024/1024:.1f} MB)")
    
    # Update asset cache to remove references to deleted files
    update_asset_cache(brand_dir, duplicate_groups)

def update_asset_cache(brand_dir, duplicate_groups):
    """Update asset cache to remove references to deleted duplicate files"""
    
    cache_file = Path(brand_dir) / '.asset_cache.json'
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
            print(f"📝 Updated asset cache: removed {removed_entries} entries for deleted files")
    
    except Exception as e:
        print(f"⚠️  Failed to update asset cache: {e}")

def main():
    """Main cleanup function"""
    
    # Default to B&D directory
    brand_dir = Path("crawlforai/output_markdown/b-and-d")
    
    if not brand_dir.exists():
        print(f"Brand directory not found: {brand_dir}")
        print("Please run this script from the project root directory.")
        return
    
    print("🧹 Asset Duplicate Cleanup Tool")
    print("=" * 50)
    
    # Ask for confirmation
    response = input(f"Clean up duplicates in {brand_dir}? (y/N): ").strip().lower()
    if response != 'y':
        print("Cleanup cancelled.")
        return
    
    cleanup_duplicate_assets(brand_dir)

if __name__ == "__main__":
    main()
