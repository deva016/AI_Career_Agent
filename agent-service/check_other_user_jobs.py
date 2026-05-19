import asyncio
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            user_id = 'b137dc84-798a-478b-8023-cfe2b3ecab95'
            
            jobs = await conn.fetch("SELECT id, title, company, job_url, scraped_at FROM jobs WHERE user_id = $1 ORDER BY scraped_at DESC LIMIT 5", user_id)
            print(f"Recent Jobs in DB for {user_id}:")
            for j in jobs:
                print(f" - {j['title']} @ {j['company']} (Link: {j['job_url']})")
            if not jobs:
                print("No jobs found for this user ID.")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
