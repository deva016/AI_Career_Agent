import asyncio
from playwright.async_api import async_playwright
import sys
import time

async def main():
    BASE_URL = "http://localhost:3000"
    
    print("Initializing Playwright...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            context = await browser.new_context(
                viewport={'width': 1440, 'height': 900}
            )
            page = await context.new_page()
            
            print(f"Navigating to {BASE_URL}/auth/signin...")
            await page.goto(f"{BASE_URL}/auth/signin", wait_until="networkidle")
            
            # Click the mock login button
            print("Clicking Mock Login button...")
            await page.wait_for_selector("#mock-login-btn")
            await page.click("#mock-login-btn")
            
            print("Waiting for redirect to Dashboard...")
            await page.wait_for_url("**/dashboard**", timeout=15000)
            print("Successfully reached dashboard!")
            
            # Go to Missions Log to trigger the agent
            print("Navigating to Missions Log...")
            await page.goto(f"{BASE_URL}/dashboard/missions", wait_until="networkidle")
            await page.wait_for_timeout(2000)
            await page.screenshot(path="e2e_missions_initial.png", full_page=True)
            
            # Check if there's a Launch First Mission or Launch Search button
            print("Looking for Agent Launch buttons...")
            first_mission_btns = await page.get_by_role("button", name="Launch First Mission").count()
            launch_search_btns = await page.get_by_role("button", name="Launch Search").count()
            
            if first_mission_btns > 0:
                print("Clicking 'Launch First Mission' button...")
                await page.get_by_role("button", name="Launch First Mission").first.click()
            elif launch_search_btns > 0:
                print("Clicking 'Launch Search' button...")
                await page.get_by_role("button", name="Launch Search").first.click()
            else:
                print("No Agent launch buttons found on Missions page!")

            print("Waiting for Launch Modal...")
            await page.wait_for_selector("#query")
            await page.wait_for_timeout(500)
            
            print("Filling form...")
            await page.fill("#query", "Software Engineer")
            await page.screenshot(path="e2e_missions_modal.png", full_page=True)
            
            print("Clicking submit (Launch Agents)...")
            await page.get_by_role("button", name="Launch Agents").click()
            
            print("Waiting for Agent UI to respond...")
            await page.wait_for_timeout(3000)
            await page.screenshot(path="e2e_missions_running.png", full_page=True)
            
            print("Waiting another 10 seconds for SSE stream updates...")
            await page.wait_for_timeout(10000)
            await page.screenshot(path="e2e_missions_progress.png", full_page=True)
            
            print("Test Complete. Agent Workflow visually mapped.")
                
        except Exception as e:
            print(f"ERROR during testing: {e}")
            try:
                await page.screenshot(path="e2e_error.png", full_page=True)
            except:
                pass
            sys.exit(1)
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
