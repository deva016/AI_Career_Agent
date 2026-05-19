import logging
import asyncio
from typing import List, Dict, Any
from scrapers.base import BaseScraper
from playwright.async_api import Page

logger = logging.getLogger(__name__)

class CompanyScraper(BaseScraper):
    """
    Generic scraper for company career pages.
    Attempts to identify job listings based on common patterns.
    """
    
    async def scrape(self, url: str) -> List[Dict[str, Any]]:
        """
        Scrape jobs from a company career page.
        """
        results = []
        async with self.run_browser() as page:
            try:
                logger.info(f"Scraping company career page: {url}")
                await page.goto(url, wait_until="networkidle")
                
                # Common job card selectors
                job_selectors = [
                    "div.job-listing",
                    "div.posting",
                    "li.job",
                    "tr.job-opening",
                    "div[data-automation-id='job-item']",
                    "a[href*='/jobs/']",
                    "a[href*='/posting/']"
                ]
                
                found_links = []
                for selector in job_selectors:
                    elements = await page.query_selector_all(selector)
                    if elements:
                        logger.info(f"Found {len(elements)} potential jobs with selector: {selector}")
                        for el in elements:
                            # Try to get link and title
                            href = await el.get_attribute("href")
                            if not href:
                                # Check if child <a> tag exists
                                link_el = await el.query_selector("a")
                                if link_el:
                                    href = await link_el.get_attribute("href")
                            
                            if href and href not in found_links:
                                # Ensure absolute URL
                                if href.startswith("/"):
                                    from urllib.parse import urljoin
                                    href = urljoin(url, href)
                                
                                title = await el.inner_text()
                                if title:
                                    title = title.split("\n")[0].strip() # Take first line as title
                                
                                results.append({
                                    "title": title or "Unknown Role",
                                    "company": "Detected Company", # Should be passed in or detected
                                    "url": href,
                                    "source": "company_page",
                                    "location": "See description"
                                })
                                found_links.append(href)
                        break # Stop at first successful selector
                        
                return results[:20] # Limit to top 20
            except Exception as e:
                logger.error(f"Failed to scrape company page {url}: {e}")
                return []
