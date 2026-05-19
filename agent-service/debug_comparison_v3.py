import asyncio
import json
from core.database import db

async def check():
    # Try finding the right user first
    async with db.connection() as conn:
        users = await conn.fetch("SELECT id, email FROM users")
        print(f"DEBUG: Found {len(users)} users")
        if not users:
            print("No users in database.")
            return
            
        for u in users:
            user_id = u['id']
            print(f"\n--- Checking User: {u['email']} ({user_id}) ---")
            
            missions = await db.list_missions(user_id, limit=5)
            print("  MISSIONS:")
            if not missions: print("    None")
            for m in missions:
                print(f"    ID: {m['id']} | Status: {m['status']} | Type: {m['agent_type']}")
            
            resumes = await db.get_resumes(user_id)
            print("  RESUMES:")
            if not resumes: print("    None")
            for r in resumes:
                has_tailored = bool(r.get('tailored_content'))
                print(f"    ID: {r['id']} | Title: {r.get('title')} | Tailored: {has_tailored}")

if __name__ == "__main__":
    asyncio.run(check())
