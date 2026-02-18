
import asyncio
import httpx
import sys
import json
import time

BASE_URL = "http://localhost:8000/api/agent"

async def main():
    print("Starting validation flow via HTTP API...")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        # 1. Start Mission
        print("\nSending POST /mission/job-finder...")
        payload = {
            "query": "Senior Python Developer",
            "target_roles": ["Senior Software Engineer", "Python Backend Developer"],
            "target_locations": ["Remote", "New York"]
        }
        
        try:
            response = await client.post(f"{BASE_URL}/mission/job-finder", json=payload)
            response.raise_for_status()
            data = response.json()
            mission_id = data["mission_id"]
            print(f"Mission started! ID: {mission_id}")
            print(f"Initial Status: {data['status']}")
        except Exception as e:
            print(f"FAILED to start mission: {e}")
            if 'response' in locals():
                print(f"Response: {response.text}")
            return

        # 2. Poll for Completion
        print(f"\nPolling status for mission {mission_id}...")
        start_time = time.time()
        max_wait = 120  # 2 minutes max
        
        while time.time() - start_time < max_wait:
            try:
                # Add delay
                await asyncio.sleep(2)
                
                resp = await client.get(f"{BASE_URL}/mission/{mission_id}")
                resp.raise_for_status()
                status_data = resp.json()
                
                status = status_data["status"]
                progress = status_data.get("progress", 0)
                node = status_data.get("current_node", "unknown")
                
                print(f"Status: {status} | Progress: {progress}% | Node: {node}")
                
                if status in ["completed", "failed", "requires_approval"]:
                    print(f"\nMission finished with status: {status}")
                    
                    if status == "completed":
                        # Check output
                        output = status_data.get("output_data", {})
                        jobs = output.get("jobs", [])
                        print(f"Found {len(jobs)} jobs.")
                        for j in jobs[:2]:
                            print(f"- {j.get('title')} at {j.get('company')}")
                    elif status == "failed":
                         print(f"Error: {status_data.get('error')}")
                         
                    break
            except Exception as e:
                print(f"Polling error: {e}")
                
        else:
            print("\nTimeout waiting for mission completion.")

if __name__ == "__main__":
    asyncio.run(main())
