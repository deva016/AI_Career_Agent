import asyncio
import httpx
import json

async def main():
    url = "http://localhost:8000/api/agent/mission/job-finder"
    headers = {
        "X-User-Email": "sandeep.bommidi01@gmail.com",
        "Content-Type": "application/json"
    }
    data = {
        "query": "Software Engineer",
        "target_roles": ["Software Engineer"],
        "target_locations": ["United States"]
    }
    
    print(f"Triggering job finder mission for sandeep.bommidi01@gmail.com...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=data, timeout=30.0)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            mission_id = response.json().get("mission_id")
            if mission_id:
                print(f"Mission {mission_id} started. Waiting for completion...")
                # Poll for status
                for _ in range(30):
                    await asyncio.sleep(5)
                    status_url = f"http://localhost:8000/api/agent/mission/{mission_id}"
                    status_res = await client.get(status_url, headers=headers)
                    state = status_res.json()
                    print(f"Status: {state['status']} | Progress: {state['progress']}%")
                    if state['status'] in ['completed', 'failed']:
                        print("Mission Finished!")
                        print(json.dumps(state, indent=2))
                        break
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
