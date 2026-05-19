import asyncio
from core.database import db

async def check():
    user_id = "f0e8c7bc-2c45-4c1c-a292-228bdcf88f87"
    async with db.connection() as conn:
        chunks = await conn.fetch("SELECT id, resume_id, chunk_type, content FROM resume_chunks WHERE user_id = $1", user_id)
        print(f"TOTAL CHUNKS: {len(chunks)}")
        for c in chunks:
            print(f"ID: {c['id']} | ResumeID: {c['resume_id']} | Type: {c['chunk_type']} | Snippet: {c['content'][:30]}...")

if __name__ == "__main__":
    asyncio.run(check())
