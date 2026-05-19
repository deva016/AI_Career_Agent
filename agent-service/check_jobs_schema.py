import asyncio
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            columns = await conn.fetch("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'jobs'")
            for col in columns:
                print(f"{col['column_name']}: {col['data_type']} (Nullable: {col['is_nullable']})")
                
            constraints = await conn.fetch("SELECT conname FROM pg_constraint WHERE conrelid = 'jobs'::regclass")
            print("\nConstraints:")
            for con in constraints:
                print(f" - {con['conname']}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
