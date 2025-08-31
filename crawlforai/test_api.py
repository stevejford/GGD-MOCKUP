#!/usr/bin/env python3
"""Test script to understand the new crawl4ai v0.7.4 API"""

import asyncio
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

async def test_new_api():
    """Test the new crawl4ai API to understand parameter changes"""
    try:
        # Test basic configuration
        browser_config = BrowserConfig(
            headless=True,
            verbose=True
        )
        
        # Test CrawlerRunConfig - see what parameters are available
        run_config = CrawlerRunConfig(
            # Remove wait_time and delay_before_return_html as they seem to be deprecated
            # wait_time=3.0,  # This parameter no longer exists
            # delay_before_return_html=2.0,  # This parameter no longer exists
            word_count_threshold=1,
            only_text=False,
        )
        
        async with AsyncWebCrawler(config=browser_config) as crawler:
            result = await crawler.arun(
                url="https://example.com",
                config=run_config
            )
            
            print("✅ API test successful!")
            print(f"Success: {result.success}")
            print(f"URL: {result.url}")
            print(f"Markdown length: {len(result.markdown) if result.markdown else 0}")
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_new_api())
