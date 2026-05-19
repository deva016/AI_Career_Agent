import asyncio
from agents.linkedin_agent import gather_context, generate_post
from graphs.state import create_initial_state, AgentType
from core.database import db

async def main():
    await db.get_pool()
    state = create_initial_state(
        mission_id="test-local-1",
        user_id="test-user-local",
        agent_type=AgentType.LINKEDIN,
        input_data={"topic": "AI", "context": "testing"}
    )
    
    print("Gathering context...")
    res1 = await gather_context(state)
    state.update(res1)
    
    print("Generating post (expecting failure to trace)...")
    try:
        res2 = await generate_post(state)
        print("Success!")
        print(res2)
    except Exception as e:
        print("Failed!")
        import traceback
        traceback.print_exc()
        
    await db.close_pool()

if __name__ == "__main__":
    asyncio.run(main())
