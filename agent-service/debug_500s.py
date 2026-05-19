import asyncio
import json
import urllib.request
import urllib.error
import asyncpg
import os

async def test_endpoints():
    BASE_URL = "http://localhost:8000"
    
    # Connect via env var or hardcoded URL from your .env
    db_url = "postgresql://neondb_owner:npg_BOk0T4xjGmfN@ep-fragrant-base-aimhwyab-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
    print("Connecting to DB to get a valid user email...")
    conn = await asyncpg.connect(db_url)
    user_email = await conn.fetchval("SELECT email FROM users LIMIT 1")
    await conn.close()
    
    if not user_email:
        print("No users found in DB")
        return
        
    print(f"Using user email: {user_email}")

    # 1. Test POST /api/interview/analyze
    print("\nTesting POST /api/interview/analyze")
    req = urllib.request.Request(
        f"{BASE_URL}/api/interview/analyze",
        data=json.dumps({
            "question": "Tell me about a time you failed.",
            "answer": "I failed to write code properly.",
            "role_context": "Software Engineer"
        }).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-User-Email": user_email
        },
        method="POST"
    )
    
    try:
        urllib.request.urlopen(req)
        print(" -> SUCCESS")
    except urllib.error.HTTPError as e:
        print(f" -> ERROR {e.code}: {e.read().decode('utf-8')}")
        
    # 2. Test PATCH /api/settings
    print("\nTesting PATCH /api/settings")
    req = urllib.request.Request(
        f"{BASE_URL}/api/settings",
        data=json.dumps({
            "name": "E2E Tester",
            "target_roles": ["Software Engineer"],
            "target_locations": ["Remote"],
            "knowledge_base": {}
        }).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-User-Email": user_email
        },
        method="PATCH"
    )
    
    try:
        urllib.request.urlopen(req)
        print(" -> SUCCESS")
    except urllib.error.HTTPError as e:
        print(f" -> ERROR {e.code}: {e.read().decode('utf-8')}")

if __name__ == "__main__":
    asyncio.run(test_endpoints())
