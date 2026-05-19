import asyncio
import json
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            mission_id = '48cce68c-0eca-45ce-a31c-5b9c7c30a988'
            mission = await conn.fetchrow("SELECT * FROM missions WHERE id = $1", mission_id)
            if not mission:
                print("Mission not found")
                return
                
            m_dict = dict(mission)
            events = json.loads(m_dict['events']) if isinstance(m_dict['events'], str) else m_dict['events']
            print(f"Mission {mission_id} Status: {m_dict['status']}")
            for e in events:
                print(f" - {e['message']}")
            
            # Check artifacts
            if m_dict['artifacts']:
                arts = json.loads(m_dict['artifacts']) if isinstance(m_dict['artifacts'], str) else m_dict['artifacts']
                for a in arts:
                    print(f"\nArtifact: {a['name']}")
                    print(a['content'])
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
