import asyncio
from core.database import db

async def main():
    async with db.connection() as conn:
        rows = await conn.fetch("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'resumes'")
        for row in rows:
            print(f"{row['column_name']}: {row['data_type']}")

if __name__ == "__main__":
    asyncio.run(main())
