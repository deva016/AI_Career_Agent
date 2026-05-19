import asyncio
import json
import urllib.request
import urllib.error
import asyncpg
import os

async def test_endpoints():
    BASE_URL = "http://localhost:8000"
    
    db_url = "postgresql://neondb_owner:npg_BOk0T4xjGmfN@ep-fragrant-base-aimhwyab-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
    conn = await asyncpg.connect(db_url)
    user_email = await conn.fetchval("SELECT email FROM users LIMIT 1")
    await conn.close()
    
    if not user_email: return

    # 1. Test POST /api/interview/analyze ONLY
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

if __name__ == "__main__":
    asyncio.run(test_endpoints())
