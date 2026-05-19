import asyncio
import uuid
from core.database import db

async def check():
    user_id = "f0e8c7bc-2c45-4c1c-a292-228bdcf88f87"
    async with db.connection() as conn:
        chunks = await conn.fetch("SELECT id, resume_id, chunk_type, content, embedding IS NOT NULL as has_vector FROM resume_chunks WHERE user_id = $1", user_id)
        print(f"DEBUG: Found {len(chunks)} chunks for user {user_id}")
        for c in chunks:
            rid = str(c['resume_id']) if c['resume_id'] else "None"
            print(f"CH_ID: {c['id']} | RID: {rid} | TYPE: {c['chunk_type']} | VECTOR: {c['has_vector']} | TXT: {c['content'][:50]}...")

if __name__ == "__main__":
    asyncio.run(check())
