import asyncio
from core.database import db

async def main():
    try:
        async with db.connection() as conn:
            user_id = "test-user-id"
            title = "Test Job"
            company = "Test Co"
            location = "Test Location"
            description = "Test Description"
            url = "https://example.com/test-job-1"
            source = "Test"
            
            print(f"Testing db.create_job...")
            job_id = await db.create_job(
                user_id=user_id,
                title=title,
                company=company,
                location=location,
                description=description,
                url=url,
                source=source
            )
            print(f"Result: {job_id}")
            
    except Exception as e:
        print(f"Caught Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
