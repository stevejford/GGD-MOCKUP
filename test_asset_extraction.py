#!/usr/bin/env python3
"""
Test script to verify asset extraction from markdown content.
This helps debug why PDFs and other assets might not be downloaded.
"""

import re
import json
from pathlib import Path

def extract_assets_from_markdown(md_content):
    """Extract all asset URLs from markdown content"""
    asset_urls = []
    
    try:
        # Find image markdown: ![alt](url)
        img_urls = re.findall(r'!\[[^\]]*\]\(([^\)]+)\)', md_content)
        asset_urls.extend(img_urls)
        print(f"Found {len(img_urls)} image URLs")
        
        # Find PDF links: [text](url.pdf)
        pdf_urls = re.findall(r'\[[^\]]*\]\(([^\)]*\.pdf[^\)]*)\)', md_content, re.IGNORECASE)
        asset_urls.extend(pdf_urls)
        print(f"Found {len(pdf_urls)} PDF URLs")
        
        # Find TXT links: [text](url.txt)
        txt_urls = re.findall(r'\[[^\]]*\]\(([^\)]*\.txt[^\)]*)\)', md_content, re.IGNORECASE)
        asset_urls.extend(txt_urls)
        print(f"Found {len(txt_urls)} TXT URLs")
        
        return {
            'all_assets': asset_urls,
            'images': img_urls,
            'pdfs': pdf_urls,
            'txt_files': txt_urls
        }
        
    except Exception as e:
        print(f"Error extracting assets: {e}")
        return {'all_assets': [], 'images': [], 'pdfs': [], 'txt_files': []}

def test_sample_markdown():
    """Test with sample markdown content"""
    sample_md = """
# Test Page

![Company Logo](https://example.com/logo.png)

Download our [Product Manual](https://example.com/manual.pdf) for installation instructions.

Check the [Installation Guide](https://example.com/guide.pdf) and [Release Notes](https://example.com/notes.txt).

![Product Image](https://example.com/product.jpg)

[Another PDF](https://example.com/another.PDF) with uppercase extension.
"""
    
    print("=== Testing Sample Markdown ===")
    results = extract_assets_from_markdown(sample_md)
    
    print(f"\nResults:")
    print(f"Total assets: {len(results['all_assets'])}")
    print(f"Images: {results['images']}")
    print(f"PDFs: {results['pdfs']}")
    print(f"TXT files: {results['txt_files']}")

def test_real_markdown_file(file_path):
    """Test with a real markdown file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print(f"\n=== Testing Real File: {file_path} ===")
        results = extract_assets_from_markdown(content)
        
        print(f"\nResults:")
        print(f"Total assets: {len(results['all_assets'])}")
        print(f"Images: {len(results['images'])}")
        print(f"PDFs: {len(results['pdfs'])}")
        print(f"TXT files: {len(results['txt_files'])}")
        
        if results['pdfs']:
            print(f"\nFirst 5 PDF URLs found:")
            for i, pdf in enumerate(results['pdfs'][:5]):
                print(f"  {i+1}. {pdf}")
                
        return results
        
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return None

def analyze_existing_assets_json(json_path):
    """Analyze existing .images.json file to see what was tracked"""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"\n=== Analyzing Existing Assets JSON: {json_path} ===")
        
        if 'image_urls' in data:
            print(f"Tracked image URLs: {len(data['image_urls'])}")
            
            # Count PDFs in the image_urls (they shouldn't be there but might be)
            pdf_count = sum(1 for url in data['image_urls'] if url.lower().endswith('.pdf'))
            print(f"PDFs incorrectly in image_urls: {pdf_count}")
            
            if pdf_count > 0:
                print("First 3 PDFs found in image_urls:")
                pdf_urls = [url for url in data['image_urls'] if url.lower().endswith('.pdf')]
                for i, pdf in enumerate(pdf_urls[:3]):
                    print(f"  {i+1}. {pdf}")
        
        return data
        
    except Exception as e:
        print(f"Error reading JSON file {json_path}: {e}")
        return None

if __name__ == "__main__":
    # Test with sample markdown
    test_sample_markdown()
    
    # Test with real files if they exist
    base_path = Path("crawlforai/output_markdown/b-and-d")
    
    if base_path.exists():
        # Test a few real markdown files
        md_files = list(base_path.glob("*.md"))[:3]  # Test first 3 files
        
        for md_file in md_files:
            results = test_real_markdown_file(md_file)
            
            # Check corresponding .images.json file
            json_file = md_file.with_suffix('.images.json')
            if json_file.exists():
                analyze_existing_assets_json(json_file)
    else:
        print(f"\nBase path {base_path} not found. Run this script from the project root.")
