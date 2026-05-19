import asyncio
import json
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            mission_id = '30ae46ea-2ae0-48d4-bde6-868ceb36040f'
            mission = await conn.fetchrow("SELECT * FROM missions WHERE id = $1", mission_id)
            if not mission:
                print("Mission not found")
                return
                
            m_dict = dict(mission)
            # Parse events
            events = json.loads(m_dict['events']) if isinstance(m_dict['events'], str) else m_dict['events']
            print("Mission Events:")
            for e in events:
                print(f" - {e['message']}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
