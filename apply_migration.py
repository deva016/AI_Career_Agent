import os
import asyncio
import argparse
from dotenv import load_dotenv
import asyncpg

# Load environment variables
load_dotenv(dotenv_path="agent-service/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

async def apply_migration(file_path):
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found")
        return

    print(f"Applying migration: {file_path}")
    
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        with open(file_path, "r") as f:
            sql = f.read()
        
        await conn.execute(sql)
        print("Migration applied successfully!")
    except Exception as e:
        print(f"Error applying migration: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("file", help="Path to the migration SQL file")
    args = parser.parse_args()
    
    asyncio.run(apply_migration(args.file))
