import asyncio
import logging
import random
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page

logger = logging.getLogger(__name__)

class BaseScraper(ABC):
    """
    Abstract base class for all job scrapers.
    Handles Playwright lifecycle and provides utility methods.
    """
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        
    async def __aenter__(self):
        await self.start()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.stop()
        
    async def start(self):
        """Initialize Playwright and launch browser."""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=self.headless)
        self.context = await self.browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        logger.info("Playwright browser started")
        
    async def stop(self):
        """Close browser and stop Playwright."""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'playwright'):
            await self.playwright.stop()
        logger.info("Playwright browser stopped")
        
    async def get_page(self) -> Page:
        """Create a new page in the current context."""
        if not self.context:
            await self.start()
        return await self.context.new_page()
        
    async def random_delay(self, min_sec: float = 1.0, max_sec: float = 3.0):
        """Introduce a random delay to simulate human behavior."""
        delay = random.uniform(min_sec, max_sec)
        await asyncio.sleep(delay)

    @abstractmethod
    async def scrape(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Main scraping logic to be implemented by subclasses.
        
        Args:
            criteria: Dictionary of search criteria (keywords, location, etc.)
            
        Returns:
            List of job dictionaries
        """
        pass
