import asyncio
from playwright.async_api import async_playwright
import sys
import datetime

async def main():
    BASE_URL = "http://localhost:3000"
    REPORT_FILE = "issue_report.txt"
    
    # Initialize issue report
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write(f"=== E2E Playwright Issue Report ===\n")
        f.write(f"Started at: {datetime.datetime.now().isoformat()}\n\n")

    def log_issue(category, message, url):
        issue = f"[{category}] - {url}\n{message}\n{'-'*40}\n"
        print(f"\n[!!] CAUGHT {category}: {message[:100]}...")
        with open(REPORT_FILE, "a", encoding="utf-8") as f:
            f.write(issue)
            
    print("Initializing Advanced Playwright Context...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, channel="chrome")
        try:
            context = await browser.new_context(
                viewport={'width': 1440, 'height': 900}
            )
            page = await context.new_page()
            
            # --- ERROR TRACKING LISTENERS ---
            page.on("console", lambda msg: log_issue("CONSOLE_ERROR", msg.text, page.url) if msg.type in ["error", "warning"] and "webpack" not in msg.text.lower() else None)
            page.on("pageerror", lambda err: log_issue("RUNTIME_ERROR", str(err), page.url))
            
            async def handle_response(response):
                ignore_list = ["/noise.png", "fonts"]
                if response.status >= 400 and not any(ig in response.url for ig in ignore_list):
                    msg = f"Status {response.status}: {response.request.method} {response.url}"
                    log_issue("NETWORK_ERROR", msg, page.url)
            page.on("response", handle_response)
            # --------------------------------

            print(f"Navigating to {BASE_URL}/auth/signin...")
            await page.goto(f"{BASE_URL}/auth/signin", wait_until="networkidle")
            
            print("\n" + "="*50)
            print("*** ACTION REQUIRED ***")
            print("Please log in using Google OAuth in the opened browser window.")
            print("Waiting for you to arrive at the dashboard (timeout in 5 minutes)...")
            print("="*50 + "\n")
            
            await page.wait_for_url("**/dashboard**", timeout=300000)
            print("\nSuccessfully reached the dashboard! Auto-pilot taking over.\n")
            
            async def interact_dashboard():
                print("  [Action] Checking for HITL approval missions...")
                try:
                    approve_btn = page.get_by_role("button", name="Approve").first
                    if await approve_btn.is_visible(timeout=3000):
                        await approve_btn.click(timeout=3000)
                        print("  [Action] Clicked Approve! Waiting for Modal...")
                        await page.wait_for_selector("text=Review Workbench", timeout=5000)
                        await page.get_by_role("button", name="Approve").last.click(timeout=3000)
                except Exception:
                    print("  [Action] No pending HITL approvals found.")

            async def interact_missions():
                print("  [Action] Launching Mission...")
                try:
                    await page.get_by_role("button", name="Launch Search").click(timeout=5000)
                    
                    # Wait for Modal
                    await page.wait_for_selector("text=New Discovery Mission", timeout=5000)
                    
                    await page.locator("input#query").fill("SQL, Python, Power BI, Excel, Data Analysis, Statistics, Dashboard")
                    await page.locator("input#roles").fill("data analyst")
                    await page.locator("input#locations").fill("hyderabad")
                        
                    await page.get_by_role("button", name="Launch Agents").click(timeout=5000)
                    
                    # Wait for Toast Response
                    await page.wait_for_selector("text=Mission Launched!", timeout=10000)
                    print("  [Action] Mission launched successfully with response!")
                    
                    # Test filters
                    await page.get_by_role("combobox").click()
                    await page.get_by_text("Completed").first.click()
                    await page.wait_for_timeout(2000)
                except Exception as e:
                    print(f"  [Interaction Error] Missions: {e}")

            async def interact_jobs():
                print("  [Action] Searching Jobs...")
                try:
                    search = page.get_by_placeholder("Search jobs...").first
                    if await search.count() > 0:
                        await search.fill("Engineer")
                        await page.keyboard.press("Enter")
                        # Wait for network idle to ensure search results load
                        await page.wait_for_load_state("networkidle")
                except Exception as e:
                    print(f"  [Interaction Error] Jobs: {e}")

            async def interact_resumes():
                print("  [Action] Adding Manual Resume...")
                try:
                    manual_btn = page.get_by_role("button", name="Manual Entry").first
                    if await manual_btn.count() > 0:
                        await manual_btn.click(timeout=3000)
                        
                    textarea = page.locator("textarea").first
                    if await textarea.count() > 0:
                        await textarea.fill("Senior SDET with 5 years of Playwright experience.")
                        
                    save_btn = page.get_by_role("button", name="Save Entry").first
                    if await save_btn.count() > 0:
                        await save_btn.click(timeout=3000)
                        await page.wait_for_load_state("networkidle")
                except Exception as e:
                    print(f"  [Interaction Error] Resumes: {e}")

            async def interact_linkedin():
                print("  [Action] Generating LinkedIn Post...")
                try:
                    topic = page.locator("input[placeholder*='e.g. My journey']").first
                    if await topic.count() == 0:
                        topic = page.locator("input").nth(0)
                        
                    if await topic.count() > 0:
                        await topic.fill("Building an AI Career Agent that automates the job search process")
                    
                    context = page.locator("input[placeholder*='e.g. Mention']").first
                    if await context.count() == 0:
                        context = page.locator("input").nth(1)
                        
                    if await context.count() > 0:
                        await context.fill("I designed and built a full-stack multi-agent AI system that discovers jobs, analyzes job descriptions, matches skills, and prepares candidates for applications and interviews. Built using Python, LLM agents, and automation workflows.")
                        
                    generate_btn = page.get_by_role("button", name="AI Generate").first
                    if await generate_btn.count() == 0:
                        generate_btn = page.locator("button:has-text('Generate')").first
                        
                    if await generate_btn.count() > 0:
                        await generate_btn.click(timeout=3000)
                    
                    # Wait for Toast Response meaning Generation finished
                    try:
                        await page.wait_for_selector("text=Post Generated!", timeout=30000)
                        print("  [Action] AI Content Generated!")
                        
                        await page.get_by_role("button", name="Post Now").click(timeout=3000)
                        await page.wait_for_selector("text=Post Published!", timeout=10000)
                        print("  [Action] Post Published successfully!")
                    except Exception:
                        print("  [Action!] Timeout waiting for AI generation (likely LLM limit reached). Skipping publish click.")
                except Exception as e:
                    print(f"  [Interaction Error] LinkedIn: {e}")

            async def interact_interview():
                print("  [Action] Answering Interview Question...")
                try:
                    textarea = page.locator("textarea").first
                    if await textarea.count() > 0:
                        interview_answer = (
                            "Situation: During my AI project titled 'Development of an Open-Source AI Framework for Automated Brain Segmentation and Abnormality Detection in Neuroimaging', I encountered a major technical blocker just one week before the submission deadline. The segmentation model was significantly underperforming — Dice score was below 0.65, whereas our target benchmark was 0.85+ for clinical reliability. Additionally, training time was extremely high due to large 3D MRI volumes. "
                            "Task: As the primary developer responsible for model architecture, preprocessing pipeline, and evaluation metrics, my task was to: Improve segmentation performance, Optimize training efficiency, Deliver reproducible results (with visualizations and inference outputs) before the deadline. Failure would mean an incomplete submission and poor model reliability. "
                            "Action: I took the following steps: Root Cause Analysis: Conducted error analysis on failed segmentation masks. Identified that poor normalization and inconsistent voxel spacing were degrading model performance. Data Pipeline Optimization: Implemented z-score normalization across volumes. Standardized voxel spacing using interpolation. Applied patch-based training instead of full-volume training to reduce GPU memory overhead. Model Architecture Adjustment: Switched from a basic CNN to a modified 3D U-Net architecture. Added batch normalization and residual connections. Introduced Dice + Focal loss combination to address class imbalance. Stakeholder Communication: Immediately informed the project evaluator about the performance risk. Presented a clear recovery plan with: Identified root cause, Technical solution roadmap, Updated timeline (48-hour improvement cycle). Shared interim results transparently. Performance Optimization: Enabled mixed precision training. Reduced training time by ~35%. "
                            "Result: Dice score improved from 0.65 → 0.88. Training time reduced by 35–40%. Generated complete segmentation visualizations and statistical analysis. Submitted the project on time. The framework became modular and reusable for future neuroimaging tasks. Most importantly, proactive communication ensured stakeholder confidence was maintained despite the technical setback."
                        )
                        await textarea.fill(interview_answer)
                    
                    analyze_btn = page.get_by_role("button", name="Analyze Answer").first
                    if await analyze_btn.count() == 0:
                        analyze_btn = page.locator("button:has-text('Analyze')").first
                        
                    if await analyze_btn.count() > 0:
                        await analyze_btn.click(timeout=3000)
                    
                    # Wait for the AI Score metric to appear verifying analyzing is done
                    try:
                        await page.wait_for_selector("text=AI Evaluation Score", timeout=30000)
                        print("  [Action] Answer Analyzed Successfully!")
                        
                        show_btn = page.get_by_role("button", name="Show").first
                        if await show_btn.count() > 0:
                            await show_btn.click(timeout=3000)
                    except Exception as e:
                        print("  [Action!] Timeout waiting for analysis to finish (could be LLM limits)")
                except Exception as e:
                    print(f"  [Interaction Error] Interview: {e}")

            async def interact_applications():
                print("  [Action] Reviewing Application Tracker...")
                try:
                    search = page.get_by_placeholder("Search specific applications...").first
                    if await search.count() > 0:
                        await search.fill("Developer")
                    await page.wait_for_timeout(2000)
                except Exception as e:
                    print(f"  [Interaction Error] Applications: {e}")

            async def interact_documents():
                print("  [Action] Testing Document Artifacts...")
                try:
                    # Click on any artifact card to open preview if it exists
                    artifact = page.locator(".group.cursor-pointer").first
                    if await artifact.count() > 0:
                        await artifact.click(timeout=3000)
                        await page.wait_for_selector("text=Generated Content", timeout=3000)
                        await page.keyboard.press("Escape") # Close modal
                except Exception as e:
                    print(f"  [Interaction Error] Documents: {e}")

            async def interact_insights():
                print("  [Action] Testing Skill Insights...")
                try:
                    course_btn = page.get_by_role("button", name="Explore Courses").first
                    if await course_btn.count() > 0:
                        await course_btn.click(timeout=3000)
                except Exception as e:
                    print(f"  [Interaction Error] Insights: {e}")

            async def interact_settings():
                print("  [Action] Updating User Preferences...")
                try:
                    name_input = page.locator("input#name").first
                    if await name_input.count() > 0:
                        await name_input.fill("DEVESHWAR")
                    
                    save_btn = page.get_by_role("button", name="Save Changes").first
                    if await save_btn.count() > 0:
                        await save_btn.click(timeout=3000)
                        try:
                            await page.wait_for_selector("text=Profile updated successfully", timeout=5000)
                        except:
                            pass
                    
                    roles_input = page.locator("input#roles").first
                    if await roles_input.count() > 0:
                        await roles_input.fill("devlovper")
                        
                    loc_input = page.locator("input#location").first
                    if await loc_input.count() > 0:
                        await loc_input.fill("hyderabad")
                        
                    update_btn = page.get_by_role("button", name="Update Preferences").first
                    if await update_btn.count() > 0:
                        await update_btn.click(timeout=3000)
                        try:
                            await page.wait_for_selector("text=Job preferences updated", timeout=5000)
                        except:
                            pass
                        
                    print("  [Action] Settings Saved!")
                except Exception as e:
                    print(f"  [Interaction Error] Settings: {e}")

            async def visit_page(name, url_path, verification_selector=None, interaction_fn=None):
                print(f"[{name}] Navigating...")
                try:
                    link = page.locator(f"a[href='{url_path}']").first
                    if await link.count() > 0:
                        await link.click()
                    else:
                        print(f"  Sidebar link not found, hard navigating...")
                        await page.goto(f"{BASE_URL}{url_path}")
                    
                    await page.wait_for_load_state("networkidle")
                    
                    if verification_selector:
                        try:
                            await page.wait_for_selector(verification_selector, timeout=10000)
                        except:
                            print(f"  -> WARNING: Selector '{verification_selector}' not found.")
                    
                    await page.wait_for_timeout(2000)
                    
                    if interaction_fn:
                        await interaction_fn()
                        await page.wait_for_timeout(3000)
                    
                    print(f"  -> SUCCESS ({name})")
                except Exception as e:
                    print(f"  -> ERROR ({name}): {e}")
                    log_issue("PAGE_TIMEOUT_OR_CRASH", str(e), f"{BASE_URL}{url_path}")
            
            pages = [
                ("Dashboard", "/dashboard", "text=Command Center", interact_dashboard),
                ("Missions", "/dashboard/missions", "text=Missions", interact_missions),
                ("Jobs", "/dashboard/jobs", "text=Jobs Board", interact_jobs),
                ("Resumes", "/dashboard/resumes", "text=Resumes", interact_resumes),
                ("Applications", "/dashboard/applications", "text=Applications", interact_applications),
                ("LinkedIn", "/dashboard/linkedin", "text=LinkedIn", interact_linkedin),
                ("Interview", "/dashboard/interview", "text=Interview", interact_interview),
                ("Documents", "/dashboard/artifacts", "text=Documents", interact_documents),
                ("Insights", "/dashboard/insights", "text=Insights", interact_insights),
                ("Settings", "/settings", "text=Settings", interact_settings)
            ]
            
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(3000)
            
            for name, path, selector, interact in pages:
                if name == "Dashboard":
                    try:
                        await page.wait_for_selector(selector, timeout=10000)
                        if interact:
                            await interact()
                        print(f"  -> SUCCESS ({name})")
                    except Exception as e:
                        log_issue("PAGE_TIMEOUT_OR_CRASH", str(e), page.url)
                    await page.wait_for_timeout(3000)
                    continue
                    
                await visit_page(name, path, selector, interact)
            
            print("\n" + "="*50)
            print("Navigation and interaction complete! Check issue_report.txt for any hidden bugs.")
            print("Closing browser in 5 seconds...")
            print("="*50 + "\n")
            await page.wait_for_timeout(5000)
                
        except Exception as e:
            print(f"\n[FATAL] Script crashed: {e}")
            sys.exit(1)
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
