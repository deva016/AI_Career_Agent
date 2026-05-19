import asyncio
import json
from core.database import db

async def check():
    user_id = "f0e8c7bc-2c45-4c1c-a292-228bdcf88f87"
    missions = await db.list_missions(user_id, limit=10)
    print("MISSIONS:")
    for m in missions:
        print(f"ID: {m['id']} | Status: {m['status']} | Type: {m['agent_type']} | Created: {m['created_at']}")
    
    resumes = await db.get_resumes(user_id)
    print("\nRESUMES:")
    for r in resumes:
        has_tailored = bool(r.get('tailored_content'))
        tailored_snippet = r.get('tailored_content', '')[:50] if has_tailored else 'N/A'
        print(f"ID: {r['id']} | Title: {r.get('title')} | Tailored: {has_tailored} | Snippet: {tailored_snippet}")

if __name__ == "__main__":
    asyncio.run(check())
