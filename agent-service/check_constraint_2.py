import asyncio
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            constraint = await conn.fetchrow("""
                SELECT
                    conname as constraint_name,
                    pg_get_constraintdef(c.oid) as constraint_definition
                FROM pg_constraint c
                WHERE conname = 'jobs_job_url_key'
            """)
            if constraint:
                print(f"Constraint: {constraint['constraint_name']}")
                print(f"Definition: {constraint['constraint_definition']}")
            else:
                print("jobs_job_url_key not found")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
