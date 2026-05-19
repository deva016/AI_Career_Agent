import asyncio
import json
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            mission_id = '5323b301-3f86-447d-a1ee-5ca28b687f50'
            mission = await conn.fetchrow("SELECT artifacts FROM missions WHERE id = $1", mission_id)
            if not mission or not mission['artifacts']:
                print("No artifacts yet")
                return
            arts = json.loads(mission['artifacts']) if isinstance(mission['artifacts'], str) else mission['artifacts']
            for a in arts:
                if a['name'] == 'job_search_summary':
                    print("CONTENT FOUND:")
                    print(a['content'])
                    # Try to parse it as JSON to verify
                    try:
                        parsed = json.loads(a['content'])
                        print("\nVERIFIED JSON:")
                        print(json.dumps(parsed, indent=2))
                    except Exception as e:
                        print(f"\nSTILL NOT VALID JSON: {e}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
