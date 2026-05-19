import asyncio
import json
import ast
from core.database import db

async def migrate_summaries():
    print("Starting migration of job_search_summary artifacts...")
    async with db.connection() as conn:
        # Find all job_search_summary artifacts
        artifacts = await conn.fetch("SELECT id, content FROM artifacts WHERE name = 'job_search_summary'")
        print(f"Found {len(artifacts)} summaries to check.")
        
        updated_count = 0
        for art in artifacts:
            content = art['content']
            if not content:
                continue
                
            # Check if it's already valid JSON
            try:
                json.loads(content)
                continue # Already JSON
            except:
                pass
            
            # If not JSON, it's likely a Python repr. Try to convert.
            try:
                # ast.literal_eval safely parses Python literals like dicts/lists
                data = ast.literal_eval(content)
                json_content = json.dumps(data)
                
                await conn.execute("UPDATE artifacts SET content = $1 WHERE id = $2", json_content, art['id'])
                updated_count += 1
            except Exception as e:
                print(f"Failed to migrate artifact {art['id']}: {e}")
                
        print(f"Migration complete. Successfully updated {updated_count} artifacts.")

if __name__ == "__main__":
    asyncio.run(migrate_summaries())
