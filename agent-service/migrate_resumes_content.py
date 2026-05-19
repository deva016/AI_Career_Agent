import asyncio
from core.database import db

async def main():
    async with db.connection() as conn:
        print("Migrating original_content for existing resumes...")
        resumes = await conn.fetch("SELECT id FROM resumes WHERE original_content IS NULL")
        for r in resumes:
            resume_id = r['id']
            chunks = await conn.fetch(
                "SELECT content FROM resume_chunks WHERE resume_id = $1 ORDER BY (metadata->>'index')::int",
                resume_id
            )
            if chunks:
                full_text = "\n\n".join([c['content'] for c in chunks])
                await conn.execute("UPDATE resumes SET original_content = $1 WHERE id = $2", full_text, resume_id)
                print(f"Migrated resume {resume_id}")
        print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(main())
