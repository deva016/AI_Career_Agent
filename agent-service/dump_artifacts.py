import asyncio
import json
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            rows = await conn.fetch("SELECT * FROM artifacts LIMIT 10")
            print(f"Artifacts data:")
            for r in rows:
                d = dict(r)
                # Convert UUIDs to strings for printing
                d['id'] = str(d['id'])
                if d.get('related_job_id'):
                    d['related_job_id'] = str(d['related_job_id'])
                if d.get('created_at'):
                    d['created_at'] = d['created_at'].isoformat()
                print(json.dumps(d))
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
