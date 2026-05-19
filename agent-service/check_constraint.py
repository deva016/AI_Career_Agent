import asyncio
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            # Check the details of unique_user_job_url
            constraint = await conn.fetchrow("""
                SELECT
                    conname as constraint_name,
                    pg_get_constraintdef(c.oid) as constraint_definition
                FROM pg_constraint c
                JOIN pg_namespace n ON n.oid = c.connamespace
                WHERE conname = 'unique_user_job_url'
            """)
            print(f"Constraint: {constraint['constraint_name']}")
            print(f"Definition: {constraint['constraint_definition']}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
