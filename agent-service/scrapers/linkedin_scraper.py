import logging
import asyncio
from typing import List, Dict, Any, Optional
from urllib.parse import quote
from scrapers.base import BaseScraper

logger = logging.getLogger(__name__)

class LinkedInScraper(BaseScraper):
    """
    LinkedIn specific job scraper.
    """
    
    BASE_URL = "https://www.linkedin.com/jobs/search"
    
    async def scrape(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Scrape LinkedIn for jobs based on criteria.
        """
        keywords = criteria.get("keywords", [])
        locations = criteria.get("locations", [])
        
        query = " ".join(keywords)
        location = locations[0] if locations else "United States"
        
        # Construct search URL
        search_url = f"{self.BASE_URL}?keywords={quote(query)}&location={quote(location)}"
        
        # Add filters (simplified for now)
        if criteria.get("remote_ok"):
            search_url += "&f_WT=2" # Remote filter
            
        logger.info(f"Scraping LinkedIn: {search_url}")
        
        page = await self.get_page()
        jobs = []
        
        try:
            # Navigate to search page
            await page.goto(search_url, wait_until="networkidle")
            await self.random_delay(2, 4)
            
            # Scroll to load more jobs (LinkedIn loads jobs on scroll)
            for _ in range(3):
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await self.random_delay(1, 2)
            
            # Extract job cards
            # LinkedIn uses different selectors for logged-in vs public. 
            # This is for public/logged-out view which is easier to scrape.
            cards = await page.query_selector_all(".base-card, .job-search-card")
            logger.info(f"Found {len(cards)} job cards on LinkedIn")
            
            for card in cards[:10]: # Limit for audit/verification
                try:
                    title_elem = await card.query_selector(".base-search-card__title, .job-search-card__title")
                    company_elem = await card.query_selector(".base-search-card__subtitle, .job-search-card__subtitle")
                    location_elem = await card.query_selector(".job-search-card__location")
                    link_elem = await card.query_selector("a.base-card__full-link, a.job-search-card__link")
                    
                    if not title_elem or not link_elem:
                        continue
                        
                    title = (await title_elem.inner_text()).strip()
                    company = (await company_elem.inner_text()).strip() if company_elem else "Unknown"
                    location_val = (await location_elem.inner_text()).strip() if location_elem else location
                    url = await link_elem.get_attribute("href")
                    
                    # --- RECTIFIED: Extract Full Description ---
                    # Click the card to load details in the side panel (typical LinkedIn UX)
                    await card.click()
                    await self.random_delay(1, 2)
                    
                    # Try common selectors for the description panel
                    desc_elem = await page.query_selector(".show-more-less-html__markup, .description__text, .job-view-layout")
                    if desc_elem:
                        description = (await desc_elem.inner_text()).strip()
                    else:
                        description = f"Full description for {title} at {company} could not be parsed automatically. Visit {url} for details."
                        logger.warning(f"Failed to extract description for {title}")
                    
                    jobs.append({
                        "title": title,
                        "company": company,
                        "location": location_val,
                        "description": description,
                        "url": url,
                        "source": "linkedin",
                    })
                except Exception as e:
                    logger.error(f"Error parsing job card: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"LinkedIn scraping failed: {e}")
        finally:
            await page.close()
            
        return jobs
