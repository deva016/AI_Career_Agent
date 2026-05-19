import asyncio
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            user = await conn.fetchrow("SELECT id FROM users LIMIT 1")
            user_id = str(user['id'])
            
            jobs = await conn.fetch("SELECT id, title, company, job_url, scraped_at FROM jobs WHERE user_id = $1 ORDER BY scraped_at DESC LIMIT 5", user_id)
            print(f"Recent Jobs in DB for {user_id}:")
            for j in jobs:
                print(f" - {j['title']} @ {j['company']} (Link: {j['job_url']}) Scraped: {j['scraped_at']}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
