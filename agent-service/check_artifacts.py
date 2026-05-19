import asyncio
import json
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            # Check column names
            columns = await conn.fetch("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'artifacts'
            """)
            print("Columns in 'artifacts' table:")
            for col in columns:
                print(f" - {col['column_name']} ({col['data_type']})")
            
            # Fetch one row to see if there are any issues
            rows = await conn.fetch("SELECT * FROM artifacts LIMIT 1")
            if rows:
                print(f"Sample row data: {dict(rows[0])}")
            else:
                print("No rows in artifacts table")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
