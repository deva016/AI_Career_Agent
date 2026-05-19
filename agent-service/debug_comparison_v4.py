import asyncio
import json
from core.database import db

async def check():
    async with db.connection() as conn:
        users = await conn.fetch("SELECT id, email FROM users")
        if not users:
            print("No users.")
            return
            
        for u in users:
            user_id = u['id']
            print(f"\nUSER: {u['email']} ({user_id})")
            
            # Use raw SQL to avoid any wrapper issues
            missions = await conn.fetch("SELECT id, status, agent_type, created_at FROM missions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5", str(user_id))
            print("  MISSIONS:")
            for m in missions:
                print(f"    {m['id']} | {m['status']} | {m['agent_type']}")
            
            resumes = await conn.fetch("SELECT id, title, tailored_content IS NOT NULL as has_tailored FROM resumes WHERE user_id = $1", str(user_id))
            print("  RESUMES:")
            for r in resumes:
                print(f"    {r['id']} | {r['title']} | Tailored: {r['has_tailored']}")

if __name__ == "__main__":
    asyncio.run(check())
