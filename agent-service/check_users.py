import asyncio
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            users = await conn.fetch("SELECT DISTINCT user_id FROM artifacts")
            print(f"User IDs in artifacts: {[u['user_id'] for u in users]}")
            
            # Also check the users table
            active_users = await conn.fetch("SELECT id, email FROM users")
            print(f"Users in DB: {[{'id': str(u['id']), 'email': u['email']} for u in active_users]}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
