import asyncio
from core.database import db

async def main():
    await db.get_pool()
    res = await db._pool.fetchval("SELECT error FROM missions WHERE agent_type='linkedin' ORDER BY created_at DESC LIMIT 1")
    print("LINKEDIN ERROR:")
    print(res)
    await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
