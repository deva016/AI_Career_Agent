import asyncio
import sys
import os

# Add agent-service to path
sys.path.append('d:/project/AI_Career_Agent/agent-service')

from scrapers.linkedin_scraper import LinkedInScraper

async def test():
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    print("Starting LinkedIn Scraper test...")
    criteria = {"keywords": ["Software"], "locations": ["Remote"]}
    
    try:
        async with LinkedInScraper(headless=True) as scraper:
            print("Scraper started. Scraping...")
            jobs = await scraper.scrape(criteria)
            print(f"Scraping finished. Found {len(jobs)} jobs.")
            for job in jobs[:3]:
                print(f"- {job['title']} @ {job['company']}")
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
