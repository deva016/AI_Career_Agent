import asyncio
import json
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            user_count = await conn.fetchval("SELECT count(*) FROM users")
            job_count = await conn.fetchval("SELECT count(*) FROM jobs")
            mission_count = await conn.fetchval("SELECT count(*) FROM missions")
            artifact_count = await conn.fetchval("SELECT count(*) FROM artifacts")
            
            print(f"Counts: Users={user_count}, Jobs={job_count}, Missions={mission_count}, Artifacts={artifact_count}")
            
            if mission_count > 0:
                print("\nMost recent mission:")
                mission = await conn.fetchrow("SELECT * FROM missions ORDER BY created_at DESC LIMIT 1")
                print(dict(mission))
                
            if job_count > 0:
                print("\nMost recent jobs (last 2):")
                jobs = await conn.fetch("SELECT id, user_id, title, company, job_url FROM jobs ORDER BY scraped_at DESC LIMIT 2")
                for j in jobs:
                    print(dict(j))
            else:
                print("\nNo jobs found in database.")
                
            # Check for any mismatch in user IDs
            print("\nDistinct User IDs in tables:")
            users = await conn.fetch("SELECT DISTINCT id::text FROM users")
            missions = await conn.fetch("SELECT DISTINCT user_id FROM missions")
            jobs_users = await conn.fetch("SELECT DISTINCT user_id FROM jobs")
            artifacts_users = await conn.fetch("SELECT DISTINCT user_id FROM artifacts")
            
            print(f" - Users Table: {[u['id'] for u in users]}")
            print(f" - Missions Table: {[m['user_id'] for m in missions]}")
            print(f" - Jobs Table: {[j['user_id'] for j in jobs_users]}")
            print(f" - Artifacts Table: {[a['user_id'] for a in artifacts_users]}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
