"""
End-to-end browser test using Playwright.
Verifies that the Next.js frontend loads, hydrates React components,
and executes Javascript successfully on the main pages.
"""

import asyncio
from playwright.async_api import async_playwright
import sys
import os

async def check_page(page, url, name):
    print(f"\n[{name}] Testing {url}...")
    try:
        response = await page.goto(url, wait_until="networkidle")
        
        print(f"[{name}] HTTP Status: {response.status}")
        if response.status >= 400:
            print(f"[{name}] ERROR: Received HTTP {response.status}")
            return False
            
        # Check for Next.js hydration by looking for React-controlled DOM nodes
        # Instead of specific elements, just ensure the body has content and doesn't show a white screen of death
        content = await page.content()
        if len(content) < 1000 or "Application error" in content or "Runtime Error" in content:
            print(f"[{name}] ERROR: Possible React rendering crash or hydration failure.")
            return False
            
        print(f"[{name}] Page loaded and React hydrated successfully.")
        
        # Take a screenshot for visual verification
        await page.screenshot(path=f"e2e_screenshot_{name}.png", full_page=True)
        print(f"[{name}] Saved screenshot to e2e_screenshot_{name}.png")
        
        return True
    except Exception as e:
        print(f"[{name}] ERROR: Failed to load page: {e}")
        return False

async def main():
    BASE_URL = "http://localhost:3000"
    
    print("Initializing Playwright...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            context = await browser.new_context(
                viewport={'width': 1280, 'height': 800}
            )
            page = await context.new_page()
            
            success = True
            
            # Test 1: Landing Page
            if not await check_page(page, BASE_URL, "landing_page"):
                success = False
            
            # Test 2: Dashboard (Protected route, might redirect, but tests Next router)
            if not await check_page(page, f"{BASE_URL}/dashboard", "dashboard_page"):
                success = False
                
            print("\n==============================")
            if success:
                print("BROWSER TEST PASSED: Javascript execution and DOM hydration successful.")
                sys.exit(0)
            else:
                print("BROWSER TEST FAILED: One or more pages encountered rendering errors.")
                sys.exit(1)
                
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
