import urllib.request
import urllib.parse
import json
import time

API_URL = "http://localhost:8000/api/agent"
HEADERS = {
    "X-User-Email": "realtime-test@example.com",
    "Content-Type": "application/json"
}

def request(method, url, data=None):
    req = urllib.request.Request(url, method=method, headers=HEADERS)
    if data:
        req.data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        return None

def main():
    print("Triggering LinkedIn Agent...")
    mission = request("POST", f"{API_URL}/mission/linkedin", {
        "topic": "AI in Career Management",
        "context": "Built an AI agent that automates job applications."
    })
    
    if not mission:
        return
        
    mission_id = mission['mission_id']
    print(f"Mission started: {mission_id}")
    
    for i in range(15):
        time.sleep(5)
        status_data = request("GET", f"{API_URL}/mission/{mission_id}")
        if not status_data:
            break
            
        status = status_data.get('status')
        print(f"Status: {status}")
        
        if status in ['completed', 'failed', 'approved']:
            print("Mission Finished!")
            print(f"Artifacts Created: {len(status_data.get('artifacts', []))}")
            break

if __name__ == "__main__":
    main()
