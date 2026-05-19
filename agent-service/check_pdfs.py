import asyncio
from core.database import db

async def check():
    user_id = "f0e8c7bc-2c45-4c1c-a292-228bdcf88f87"
    async with db.connection() as conn:
        resumes = await conn.fetch("SELECT id, title, pdf_url FROM resumes WHERE user_id = $1", user_id)
        for r in resumes:
            print(f"RESUME: {r['title']} | PDF_URL: {r['pdf_url']}")

if __name__ == "__main__":
    asyncio.run(check())
