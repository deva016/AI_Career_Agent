import asyncio
from core.database import db

async def check():
    user_id = "f0e8c7bc-2c45-4c1c-a292-228bdcf88f87"
    async with db.connection() as conn:
        count = await conn.fetchval("SELECT count(*) FROM resume_chunks WHERE user_id = $1", user_id)
        print(f"Chunk count: {count}")
        if count > 0:
            sample = await conn.fetch("SELECT chunk_type, content FROM resume_chunks WHERE user_id = $1 LIMIT 3", user_id)
            for s in sample:
                print(f"  Type: {s['chunk_type']} | Content: {s['content'][:50]}...")

if __name__ == "__main__":
    asyncio.run(check())
