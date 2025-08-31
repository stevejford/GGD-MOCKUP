# Media Tracking and Page Reconstruction System

## Overview
This document describes how pages and their connected media assets are tracked, stored, and can be reconstructed by an LLM or MCP server. The system provides complete traceability between web pages and their associated media files.

## Directory Structure
```
output_markdown/
└── {brand-name}/
    ├── assets/                    # Images (main folder)
    │   ├── logo_d562a2a0.png
    │   ├── image1_hash123.jpg
    │   ├── pdf/                   # PDF documents
    │   │   ├── manual_abc456.pdf
    │   │   └── brochure_def789.pdf
    │   └── txt/                   # Text files
    │       ├── readme_ghi012.txt
    │       └── notes_jkl345.txt
    ├── {page-slug}.md             # Markdown content with local asset paths
    ├── {page-slug}.assets.json    # Asset metadata for each page
    ├── {page-slug}.capture.json   # Network/console capture data (optional)
    └── .asset_cache.json          # Global asset URL-to-path mapping
```

## File Naming Convention
- **Pages**: `_{url-path-with-underscores}.md` (leading underscore, slashes become underscores)
- **Assets**: `{original-name}_{url-hash}.{extension}` (8-char MD5 hash for uniqueness)
- **Metadata**: `{page-slug}.assets.json` (matches page name, replaces .md with .assets.json)

## Asset Organization
### Images
- **Location**: `assets/` (main folder)
- **Types**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico`
- **Example**: `logo_d562a2a0.png`

### PDFs
- **Location**: `assets/pdf/`
- **Types**: `.pdf`
- **Example**: `manual_abc456.pdf`

### Text Files
- **Location**: `assets/txt/`
- **Types**: `.txt`
- **Example**: `readme_ghi012.txt`

## Tracking Files

### 1. Page Metadata (`{page}.assets.json`)
Each page with assets has a corresponding `.assets.json` file containing:

```json
{
  "page_url": "https://example.com/page",
  "asset_urls": [
    "https://example.com/image.jpg",
    "https://example.com/manual.pdf",
    "https://example.com/readme.txt"
  ],
  "image_urls": [
    "https://example.com/image.jpg"
  ],
  "pdf_urls": [
    "https://example.com/manual.pdf"
  ],
  "txt_urls": [
    "https://example.com/readme.txt"
  ]
}
```

**Purpose**: Links each page to its specific assets, categorized by type.

### 2. Global Asset Cache (`.asset_cache.json`)
Maps original URLs to local file paths:

```json
{
  "https://example.com/image.jpg": "./assets/image_abc123.jpg",
  "https://example.com/manual.pdf": "./assets/pdf/manual_def456.pdf",
  "https://example.com/readme.txt": "./assets/txt/readme_ghi789.txt"
}
```

**Purpose**: 
- Prevents duplicate downloads (same URL = same file)
- Provides URL-to-local-path mapping
- Enables cross-session asset reuse

### 3. Markdown Content (`{page}.md`)
Contains the actual page content with **rewritten asset URLs**:

```markdown
# Page Title

![Company Logo](./assets/logo_d562a2a0.png)

Download our [Product Manual](./assets/pdf/manual_abc456.pdf)

See [Installation Notes](./assets/txt/readme_ghi012.txt)
```

**Key Points**:
- Original URLs are replaced with local paths
- Paths are relative (`./assets/...`)
- All asset types are supported in markdown

## Duplicate Prevention System

### URL-Based Deduplication
- Each asset URL gets an 8-character MD5 hash
- Same URL = same hash = same filename
- Files are only downloaded once, even if referenced on multiple pages

### Cross-Session Persistence
- `.asset_cache.json` survives crawler restarts
- Previously downloaded assets are reused
- Cache verification ensures files still exist

### Hash-Based Naming
- Format: `{original-name}_{url-hash}.{extension}`
- Example: `logo_d562a2a0.png` (logo.png with hash d562a2a0)
- Guarantees unique filenames while maintaining readability

## Page Reconstruction Process

### For an LLM/MCP Server to rebuild a page:

1. **Identify the page**: `_about-us.md`

2. **Load page content**: Read markdown with local asset paths
   ```markdown
   ![Logo](./assets/logo_d562a2a0.png)
   [Manual](./assets/pdf/manual_abc456.pdf)
   ```

3. **Load asset metadata**: Read `_about-us.assets.json`
   ```json
   {
     "page_url": "https://example.com/about-us",
     "asset_urls": ["https://example.com/logo.png", "https://example.com/manual.pdf"]
   }
   ```

4. **Map local to original URLs**: Use `.asset_cache.json`
   ```json
   {
     "https://example.com/logo.png": "./assets/logo_d562a2a0.png",
     "https://example.com/manual.pdf": "./assets/pdf/manual_abc456.pdf"
   }
   ```

5. **Reconstruct with original URLs** (if needed):
   ```markdown
   ![Logo](https://example.com/logo.png)
   [Manual](https://example.com/manual.pdf)
   ```

6. **Access local files**: All assets are available locally in organized folders

## Asset Discovery in Markdown

The system extracts assets using these patterns:

### Images
- **Pattern**: `![alt](url)`
- **Example**: `![Company Logo](https://example.com/logo.png)`

### PDFs
- **Pattern**: `[text](url.pdf)`
- **Example**: `[Download Manual](https://example.com/manual.pdf)`

### Text Files
- **Pattern**: `[text](url.txt)`
- **Example**: `[Read Notes](https://example.com/notes.txt)`

## Statistics and Monitoring

The system tracks:
- **Downloaded**: New assets downloaded
- **Cached**: Duplicates avoided by reusing existing files
- **Skipped**: Non-media files ignored
- **By Type**: Images, PDFs, TXT files counted separately

Example output:
```
Asset Summary: 15 downloaded, 8 cached (duplicates avoided), 3 skipped
File Types: 10 images, 4 PDFs, 1 TXT files
```

## MCP Server Implementation Guidelines

### Required Functions
1. **`list_pages(brand)`**: List all pages for a brand
2. **`get_page_content(brand, page)`**: Get markdown content
3. **`get_page_assets(brand, page)`**: Get asset metadata
4. **`get_asset_cache(brand)`**: Get global URL mappings
5. **`reconstruct_page(brand, page, use_original_urls=false)`**: Rebuild page
6. **`find_assets_by_type(brand, type)`**: Find all PDFs/images/txt files
7. **`get_asset_stats(brand)`**: Get download statistics

### Asset Resolution
```python
def resolve_asset_path(brand, local_path):
    """Convert local path to absolute file system path"""
    return f"output_markdown/{brand}/{local_path}"

def get_original_url(brand, local_path):
    """Get original URL from local path using cache"""
    cache = load_asset_cache(brand)
    for url, path in cache.items():
        if path == local_path:
            return url
    return None
```

### Page Reconstruction
```python
def reconstruct_page(brand, page_slug, use_original_urls=False):
    """Reconstruct page with local or original URLs"""
    content = load_markdown(f"{brand}/{page_slug}.md")
    
    if use_original_urls:
        cache = load_asset_cache(brand)
        for original_url, local_path in cache.items():
            content = content.replace(local_path, original_url)
    
    return content
```

## Error Handling

### Missing Files
- Check if asset files exist before referencing
- Use `.asset_cache.json` to verify expected files
- Handle gracefully if assets are moved/deleted

### Broken Links
- Validate local paths in markdown
- Cross-reference with asset metadata
- Report inconsistencies between cache and filesystem

### Cache Corruption
- Rebuild cache from filesystem if needed
- Verify hash consistency
- Re-download assets if local files are corrupted

## Best Practices

1. **Always use the asset cache** for URL-to-path mapping
2. **Preserve relative paths** in markdown for portability
3. **Validate file existence** before serving assets
4. **Maintain metadata consistency** between files
5. **Handle missing assets gracefully** in reconstruction
6. **Use batch operations** for processing multiple pages
7. **Implement proper error logging** for debugging

This system ensures complete traceability and enables reliable page reconstruction while maintaining efficient storage and preventing duplicate downloads.
