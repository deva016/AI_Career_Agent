import asyncio
from core.database import db

async def main():
    async with db.connection() as conn:
        rows = await conn.fetch("SELECT id, title, original_content IS NOT NULL as has_original, tailored_content IS NOT NULL as has_tailored FROM resumes")
        for row in rows:
            print(f"Resume: {row['title']} | Has Original: {row['has_original']} | Has Tailored: {row['has_tailored']}")

if __name__ == "__main__":
    asyncio.run(main())
