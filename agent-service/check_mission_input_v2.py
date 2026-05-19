import asyncio
import json
from core.database import db

async def check():
    async with db.connection() as conn:
        mission = await conn.fetchrow("SELECT id, status, input_data FROM missions WHERE agent_type = 'resume' ORDER BY created_at DESC LIMIT 1")
        print(f"ID: {mission['id']}")
        print(f"Status: {mission['status']}")
        print(f"Input Data: {json.dumps(mission['input_data'])}")

if __name__ == "__main__":
    asyncio.run(check())
