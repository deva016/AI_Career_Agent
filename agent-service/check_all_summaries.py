import asyncio
import json
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            missions = await conn.fetch("SELECT id, artifacts FROM missions WHERE artifacts IS NOT NULL")
            for m in missions:
                arts = json.loads(m['artifacts']) if isinstance(m['artifacts'], str) else m['artifacts']
                for a in arts:
                    if a['name'] == 'job_search_summary':
                        print(f"Mission {m['id']} summary: {a['content']}")
                        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
