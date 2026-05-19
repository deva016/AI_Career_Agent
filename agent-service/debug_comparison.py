import asyncio
import json
from core.database import db

async def check():
    user_id = "f0e8c7bc-2c45-4c1c-a292-228bdcf88f87"
    missions = await db.list_missions(user_id, limit=5)
    print("MISSIONS:")
    for m in missions:
        print(f"ID: {m['id']} | Status: {m['status']} | Type: {m['agent_type']}")
        if m['agent_type'] == 'resume':
             print(f"  Input Data: {m.get('input_data')}")
    
    resumes = await db.get_resumes(user_id)
    print("\nRESUMES:")
    for r in resumes:
        has_tailored = bool(r.get('tailored_content'))
        print(f"ID: {r['id']} | Title: {r.get('title')} | Tailored: {has_tailored}")

if __name__ == "__main__":
    asyncio.run(check())
