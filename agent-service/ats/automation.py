import logging
import asyncio
from typing import Dict, Any, List, Optional
from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from ats.detector import ATSPlatform

logger = logging.getLogger(__name__)

class ATSAutomation:
    """
    Automates job applications using Playwright.
    Handles different ATS platforms with specific logic.
    """
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        
    async def apply(
        self, 
        url: str, 
        platform: ATSPlatform, 
        user_data: Dict[str, Any], 
        resume_path: str,
        answers: Optional[Dict[str, str]] = None
    ) -> bool:
        """
        Apply to a job on a specific platform.
        """
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=self.headless)
            context = await browser.new_context()
            page = await context.new_page()
            
            try:
                success = False
                if platform == ATSPlatform.GREENHOUSE:
                    success = await self._apply_greenhouse(page, url, user_data, resume_path, answers)
                elif platform == ATSPlatform.LEVER:
                    success = await self._apply_lever(page, url, user_data, resume_path, answers)
                else:
                    logger.warning(f"Unsupported ATS platform: {platform}")
                    success = False
                    
                return success
            except Exception as e:
                logger.error(f"Application failed for {url}: {e}")
                return False
            finally:
                await browser.close()

    async def _apply_greenhouse(self, page: Page, url: str, user_data: Dict[str, Any], resume_path: str, answers: Optional[Dict[str, str]]) -> bool:
        """Greenhouse specific automation."""
        await page.goto(url)
        
        # Fill standard fields
        await page.fill("#first_name", user_data.get("first_name", ""))
        await page.fill("#last_name", user_data.get("last_name", ""))
        await page.fill("#email", user_data.get("email", ""))
        await page.fill("#phone", user_data.get("phone", ""))
        
        # Upload resume
        async with page.expect_file_chooser() as fc_info:
            await page.click('button[data-source="attach"]')
        file_chooser = await fc_info.value
        await file_chooser.set_files(resume_path)
        
        # Handle custom questions (if answers provided)
        if answers:
            # Logic to find questions and match keys
            pass
            
        # Logged in/out state check (HITL usually handles this or resume_agent)
        logger.info(f"Greenhouse form filled for {url}")
        # await page.click("#submit_app") # Don't auto-submit in demo mode
        return True

    async def _apply_lever(self, page: Page, url: str, user_data: Dict[str, Any], resume_path: str, answers: Optional[Dict[str, str]]) -> bool:
        """Lever specific automation."""
        # Lever usually has two steps: Job page -> Application page
        await page.goto(url)
        
        # Check if we need to click "Apply" first
        apply_btn = await page.query_selector("a.postings-btn")
        if apply_btn:
            await apply_btn.click()
            await page.wait_for_load_state("networkidle")
            
        # Fill standard fields
        await page.fill('input[name="name"]', f"{user_data.get('first_name')} {user_data.get('last_name')}")
        await page.fill('input[name="email"]', user_data.get("email", ""))
        await page.fill('input[name="phone"]', user_data.get("phone", ""))
        await page.fill('input[name="org"]', user_data.get("current_company", ""))
        
        # Upload resume
        async with page.expect_file_chooser() as fc_info:
            await page.click('input[type="file"]')
        file_chooser = await fc_info.value
        await file_chooser.set_files(resume_path)
        
        logger.info(f"Lever form filled for {url}")
        # await page.click("#submit-application") # Don't auto-submit in demo mode
        return True
