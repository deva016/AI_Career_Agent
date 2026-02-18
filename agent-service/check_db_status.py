import asyncio
from core.database import db

async def main():
    await db.get_pool()
    async with db.connection() as conn:
        res = await conn.fetchval('SELECT count(*) FROM jobs')
        print(f'Jobs count: {res}')
        
        res = await conn.fetchval('SELECT count(*) FROM missions')
        print(f'Missions count: {res}')
        
        # Check for recent jobs
        recent = await conn.fetch("SELECT title, company, scraped_at FROM jobs ORDER BY scraped_at DESC LIMIT 5")
        print("\nRecent Jobs:")
        for r in recent:
            print(f"- {r['title']} at {r['company']} (Scraped: {r.get('scraped_at', 'N/A')})")

        # Check for recent missions
        missions = await conn.fetch("SELECT id, status, progress, current_node, events FROM missions ORDER BY created_at DESC LIMIT 5")
        print("\nRecent Missions:")
        for m in missions:
            print(f"- Mission {m['id']}: {m['status']} ({m['progress']}%) at {m['current_node']}")
            if m['events']:
                import json
                events = json.loads(m['events']) if isinstance(m['events'], str) else m['events']
                for e in events:
                    print(f"  [{e.get('type')}] {e.get('message')}")

    await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
