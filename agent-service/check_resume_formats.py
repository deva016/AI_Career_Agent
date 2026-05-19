import asyncio
from core.database import db

async def main():
    async with db.connection() as conn:
        rows = await conn.fetch("SELECT id, format, title FROM resumes")
        for r in rows:
            print(f"ID: {r['id']} | Format: {r['format']} | Title: {r['title']}")

if __name__ == "__main__":
    asyncio.run(main())
