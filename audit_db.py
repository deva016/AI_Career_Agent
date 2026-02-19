import asyncio
import os
import sys
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv('agent-service/.env')

# Add agent-service to sys.path
sys.path.append(os.path.abspath('agent-service'))

from core.database import db

async def run_audit():
    print("--- AI Career Agent Database Audit ---")
    try:
        await db.get_pool()
        async with db.connection() as conn:
            # 1. List Public Tables
            tables = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
            table_names = sorted([t['table_name'] for t in tables])
            print(f"Tables Found ({len(table_names)}): {', '.join(table_names)}")
            
            # 2. Check each table
            for name in table_names:
                count = await conn.fetchval(f"SELECT count(*) FROM {name}")
                
                # Check for user_id column (Multi-tenancy verification)
                cols = await conn.fetch(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{name}' AND column_name = 'user_id'")
                has_user_id = "YES" if cols else "NO"
                
                # Check for embedding columns (pgvector verification)
                emb_cols = await conn.fetch(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{name}' AND data_type = 'USER-DEFINED'")
                vector_info = ""
                for ec in emb_cols:
                    vector_info += f" | {ec['column_name']} ({ec['data_type']})"
                
                print(f"- {name:20} | Count: {count:4} | UserID: {has_user_id}{vector_info}")

        await db.close_pool()
        print("\nAudit Complete.")
    except Exception as e:
        print(f"\nERROR during data audit: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_audit())
