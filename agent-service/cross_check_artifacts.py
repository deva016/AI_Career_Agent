import asyncio
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            # Check for current user
            user = await conn.fetchrow("SELECT id, email FROM users WHERE email = 'sandeep.bommidi01@gmail.com'")
            if not user:
                print("User not found")
                return
            
            user_id = str(user['id'])
            print(f"User ID: {user_id}")
            
            # Count artifacts for this user
            count = await conn.fetchval("SELECT count(*) FROM artifacts WHERE user_id = $1", user_id)
            print(f"Artifacts for user in DB: {count}")
            
            # Count artifacts for recent missions
            missions = await conn.fetch("SELECT id FROM missions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5", user_id)
            for m in missions:
                mid = m['id']
                acount = await conn.fetchval("SELECT count(*) FROM artifacts WHERE mission_id = $1", mid)
                print(f"Mission {mid}: {acount} artifacts")
                
            # Total artifacts in table
            total = await conn.fetchval("SELECT count(*) FROM artifacts")
            print(f"Total artifacts in table: {total}")
            
            # Distinct user IDs in artifacts
            distinct_users = await conn.fetch("SELECT DISTINCT user_id FROM artifacts")
            print(f"Distinct User IDs in artifacts: {[u['user_id'] for u in distinct_users]}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
