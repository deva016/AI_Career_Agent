import asyncio
import json
from core.database import db

async def main():
    try:
        # Check for first user
        async with db.connection() as conn:
            user = await conn.fetchrow("SELECT * FROM users LIMIT 1")
            if not user:
                print("No users found")
                return
            
            user_id = str(user['id'])
            print(f"Checking for user {user['email']} (ID: {user_id})")
            
            stats = await db.get_dashboard_stats(user_id)
            print(f"Stats: {json.dumps(stats)}")
            
            # Check most recent missions
            missions = await conn.fetch("SELECT id, user_id, agent_type, status, error, artifacts FROM missions ORDER BY created_at DESC LIMIT 5")
            print("Recent Missions:")
            for m in missions:
                arts = m['artifacts']
                art_count = 0
                if arts:
                    try:
                        art_list = json.loads(arts) if isinstance(arts, str) else arts
                        art_count = len(art_list)
                    except:
                        art_count = "error"
                print(f"- {m['id']} [User: {m['user_id']}] [{m['agent_type']}]: {m['status']} (Arts: {art_count}, Error: {m['error']})")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
