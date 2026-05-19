import asyncio
import json
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            mission_id = '48cce68c-0eca-45ce-a31c-5b9c7c30a988'
            mission = await conn.fetchrow("SELECT artifacts FROM missions WHERE id = $1", mission_id)
            arts = json.loads(mission['artifacts']) if isinstance(mission['artifacts'], str) else mission['artifacts']
            for a in arts:
                if a['name'] == 'job_search_summary':
                    print(json.dumps(a['content'], indent=2))
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
