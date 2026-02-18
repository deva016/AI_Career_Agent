
import asyncio
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database import db
from core.config import get_settings

async def appy_migrations():
    print("🔄 Connecting to database...")
    pool = await db.get_pool()
    
    migrations = [
        "../migrations/003_add_missions_table.sql",
        "../migrations/004_job_deduplication.sql"
    ]
    
    
    # Debug: Check jobs table columns
    
    # manual fix for jobs url
    async with pool.acquire() as conn:
        print("🔧 Manually ensuring url column exists...")
        try:
            await conn.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS url TEXT")
            print("✅ URL column check passed")
        except Exception as e:
            print(f"⚠️ URL column check failed: {e}")

    async with pool.acquire() as conn:
        for migration in migrations:
            print(f"📄 Applying {migration}...")
            if not os.path.exists(migration):
                print(f"❌ File not found: {migration}")
                continue
                
            with open(migration, "r") as f:
                sql = f.read()
                
            try:
                await conn.execute(sql)
                print(f"✅ Successfully applied {migration}")
            except Exception as e:
                print(f"❌ Failed to apply {migration}: {e}")

    await db.close_pool()
    print("✨ Migration complete")

if __name__ == "__main__":
    asyncio.run(appy_migrations())
