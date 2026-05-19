import asyncio
import logging
from scrapers.linkedin_scraper import LinkedInScraper

logging.basicConfig(level=logging.INFO)

async def test():
    async with LinkedInScraper(headless=True) as scraper:
        criteria = {
            "keywords": ["software engineer"],
            "locations": ["San Francisco"],
            "remote_ok": True
        }
        jobs = await scraper.scrape(criteria)
        print(f"Total jobs found: {len(jobs)}")
        for i, job in enumerate(jobs):
            print(f"{i+1}. {job['title']} at {job['company']}")

if __name__ == "__main__":
    asyncio.run(test())
