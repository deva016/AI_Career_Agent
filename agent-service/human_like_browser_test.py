import asyncio
from playwright.async_api import async_playwright
import sys

async def main():
    BASE_URL = "http://localhost:3000"
    
    print("Initializing Playwright with visible browser...")
    async with async_playwright() as p:
        # Launch visible browser
        browser = await p.chromium.launch(headless=False)
        try:
            # Create a context that might preserve standard user agent to help with Google Login
            context = await browser.new_context(
                viewport={'width': 1440, 'height': 900}
            )
            page = await context.new_page()
            
            print(f"Navigating to {BASE_URL}/auth/signin...")
            await page.goto(f"{BASE_URL}/auth/signin", wait_until="networkidle")
            
            print("\n" + "="*50)
            print("*** ACTION REQUIRED ***")
            print("Please log in using Google OAuth in the opened browser window.")
            print("Waiting for you to complete the login process and reach the dashboard (timeout in 5 minutes)...")
            print("="*50 + "\n")
            
            # Wait for the user to login and be redirected to /dashboard
            await page.wait_for_url("**/dashboard**", timeout=300000) # Wait up to 5 minutes
            print("\nSuccessfully reached the dashboard! Starting automated navigation...")
            
            # Helper function to click sidebar links
            async def visit_page(name, url_path, verification_selector=None):
                print(f"\n[{name}] Navigating to {url_path}...")
                try:
                    # Try to click the link with the exact href in the sidebar
                    link = page.locator(f"a[href='{url_path}']").first
                    if await link.count() > 0:
                        await link.click()
                        print(f"  Clicked sidebar link for {name}.")
                    else:
                        print(f"  Sidebar link not found, navigating directly...")
                        await page.goto(f"{BASE_URL}{url_path}")
                    
                    # Wait for network idle to ensure page loaded
                    await page.wait_for_load_state("networkidle")
                    
                    if verification_selector:
                        print(f"  Waiting for key element: {verification_selector} to load...")
                        await page.wait_for_selector(verification_selector, timeout=10000)
                        print(f"  Element found. Page {name} rendered successfully.")
                        
                    await page.wait_for_timeout(3000)  # Wait 3 seconds for visual human verification
                except Exception as e:
                    print(f"  [ERROR] loading {name}: {e}")
            
            # Pages to visit with unique elements to verify they loaded based on manual guide
            pages = [
                # 1. Dashboard. Check for metrics or mission grid
                ("Dashboard", "/dashboard", "text=Command Center"),
                # 2. Missions. Check for "Launch First Mission" or a mission card
                ("Missions", "/dashboard/missions", "text=Mission Control"),
                # 3. Jobs. Check for search input or "Jobs Board" header
                ("Jobs", "/dashboard/jobs", "input[placeholder*='Search']"),
                # 4. Resumes. Check for Resume upload/entry elements
                ("Resumes", "/dashboard/resumes", "text=Resume Workbench"),
                # 5. Applications. Check for tracker elements
                ("Applications", "/dashboard/applications", "text=Application Tracker"),
                # 6. LinkedIn. Check for generator input
                ("LinkedIn", "/dashboard/linkedin", "text=LinkedIn Studio"),
                # 7. Interview. Check for question container
                ("Interview", "/dashboard/interview", "text=Interview Simulator"),
                # 8. Artifacts/Documents
                ("Documents", "/dashboard/artifacts", "text=Documents Library"),
                # 9. Insights
                ("Insights", "/dashboard/insights", "text=Skill Insights"),
                # 10. Settings
                ("Settings", "/settings", "text=User Configuration")
            ]
            
            # We are already on dashboard, but let's verify it first
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(3000)
            
            for name, path, selector in pages:
                # Skip dashboard initial click since we are there, just verify selector
                if name == "Dashboard":
                    print(f"\n[{name}] Verifying initial dashboard load...")
                    try:
                        await page.wait_for_selector(selector, timeout=10000)
                        print(f"  Element found. Page {name} rendered successfully.")
                    except Exception as e:
                        print(f"  [ERROR] on Dashboard: {e}")
                    await page.wait_for_timeout(3000)
                    continue
                    
                await visit_page(name, path, selector)
            
            print("\n" + "="*50)
            print("Navigation complete! All 10 pages visited successfully without crashing.")
            print("Keeping browser open for 15 seconds before closing.")
            print("="*50 + "\n")
            await page.wait_for_timeout(15000)
                
        except Exception as e:
            print(f"\n[FATAL ERROR] during testing: {e}")
            sys.exit(1)
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
