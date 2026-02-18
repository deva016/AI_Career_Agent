import asyncio
import logging
import uuid
import sys
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add agent-service to path
sys.path.append('d:/project/AI_Career_Agent/agent-service')

from core.database import db
from graphs.state import AgentType, MissionStatus
from agents.job_finder import run_job_finder
from scrapers.linkedin_scraper import LinkedInScraper

async def test_linkedin_scraper():
    logger.info("--- Testing LinkedIn Scraper ---")
    criteria = {
        "keywords": ["Software Engineer"],
        "locations": ["Remote"],
        "remote_ok": True
    }
    
    async with LinkedInScraper(headless=True) as scraper:
        jobs = await scraper.scrape(criteria)
        logger.info(f"Found {len(jobs)} jobs")
        for job in jobs[:2]:
            logger.info(f"Job: {job['title']} at {job['company']}")
    return jobs

async def test_job_finder_mission():
    logger.info("--- Testing Job Finder Mission ---")
    user_id = "demo-user"
    mission_id = str(uuid.uuid4())
    
    # Run the agent
    result = await run_job_finder(
        user_id=user_id,
        query="React Developer",
        target_roles=["Frontend Developer"],
        target_locations=["San Francisco"],
        mission_id=mission_id
    )
    
    logger.info(f"Mission {mission_id} finished with status: {result['status']}")
    
    # Check database
    mission = await db.get_mission(mission_id)
    if mission:
        logger.info(f"DB Mission Status: {mission['status']}, Progress: {mission['progress']}%")
        logger.info(f"DB Mission Node: {mission['current_node']}")
    else:
        logger.error("Mission not found in DB")

async def main():
    # Initialize DB
    await db.get_pool()
    
    try:
        # Step 1: Test Scraper (The part that was failing with NotImplementedError)
        jobs = await test_linkedin_scraper()
        
        # Step 2: Test Full Mission logic (includes dedup and storage)
        if jobs:
            await test_job_finder_mission()
        else:
            logger.warning("Skipping mission test because no jobs were found")
            
    finally:
        await db.close_pool()

if __name__ == "__main__":
    # Windows fix
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    asyncio.run(main())
