"""
LinkedIn Content Agent - LangGraph Implementation

This agent generates professional LinkedIn posts based on user achievements,
projects, or general industry trends.
"""

from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from datetime import datetime
import uuid

from graphs.state import (
    AgentState, MissionStatus, AgentType,
    create_initial_state, update_status, MissionEvent, Artifact
)
from core.llm import LLMClient
from core.database import db


# ========== Prompts ==========

LINKEDIN_POST_PROMPT = """Create a compelling LinkedIn post based on the following topic/context.

Topic: {topic}
Context: {context}

Requirements:
1. Professional yet authentic tone
2. Use short, punchy paragraphs
3. Include 3-5 relevant hashtags
4. End with an engaging question
5. Keep it under 1300 characters

Draft the post:
"""


# ========== Node Functions ==========

async def gather_context(state: AgentState) -> Dict:
    """
    Gather context for the post (recent achievements, resume highlights, or system events).
    """
    input_data = state["input_data"]
    trigger_type = input_data.get("trigger", "manual")
    user_id = state["user_id"]
    
    topic = input_data.get("topic", "Career Update")
    post_context = input_data.get("context", "")
    
    # Event-based logic
    if trigger_type == "milestone":
        # Fetch recent application stats
        recent_apps = await db.get_applications(user_id, limit=10)
        topic = "Job Search Progress"
        post_context = f"Candidate has applied to {len(recent_apps)} companies this week using autonomous agents."
    elif trigger_type == "skill_gain":
        topic = "Skill Development"
        # Topic/Context should be provided in input_data
        
    return {
        "context": {
            **state.get("context", {}),
            "topic": topic,
            "post_context": post_context,
            "trigger": trigger_type
        },
        "events": [MissionEvent(
            type="log",
            message=f"Gathered context for trigger: {trigger_type}",
        )],
        **update_status(state, MissionStatus.RUNNING, "gather_context", 20)
    }


async def generate_post(state: AgentState) -> Dict:
    """
    Generate the LinkedIn post draft using LLM.
    """
    context = state["context"]
    llm = LLMClient()
    
    draft = await llm.simple_prompt(
        LINKEDIN_POST_PROMPT.format(
            topic=context["topic"],
            context=context["post_context"]
        ),
        system="You are a LinkedIn personal branding expert."
    )
    
    # Create artifact
    post_artifact = Artifact(
        id=str(uuid.uuid4()),
        type="markdown",
        name=f"LinkedIn_Draft_{datetime.now().strftime('%Y%m%d')}.md",
        content=draft,
    )
    
    return {
        "context": {
            **context,
            "draft_content": draft,
        },
        "artifacts": [post_artifact],
        "events": [MissionEvent(
            type="log",
            message="Generated LinkedIn post draft",
        )],
        **update_status(state, MissionStatus.EXECUTING, "generate", 60)
    }


async def hitl_review_gate(state: AgentState) -> Dict:
    """
    Pause for user to review/edit the draft.
    """
    return {
        "status": MissionStatus.NEEDS_REVIEW,
        "current_node": "hitl_review",
        "progress": 80,
        "requires_approval": True,
        "approval_reason": "Review LinkedIn post draft",
        "events": [MissionEvent(
            type="status_change",
            message="Waiting for user review of draft",
            data={"draft": state["context"].get("draft_content")}
        )],
    }


async def schedule_post(state: AgentState) -> Dict:
    """
    Finalize and 'schedule' the post.
    """
    context = state["context"]
    user_feedback = state.get("user_feedback")
    
    final_content = user_feedback if user_feedback else context["draft_content"]
    
    # TODO: Store in linkedin_posts table
    # await db.create_linkedin_post(...)
    
    return {
        "status": MissionStatus.COMPLETED,
        "current_node": "complete",
        "progress": 100,
        "completed_at": datetime.now().isoformat(),
        "output_data": {
            "post_status": "scheduled",
            "content": final_content,
            "scheduled_time": "Now (Mock)",
        },
        "events": [MissionEvent(
            type="status_change",
            message="LinkedIn post scheduled",
        )],
    }


# ========== Conditional Routing ==========

def should_wait(state: AgentState) -> str:
    if state.get("status") == MissionStatus.NEEDS_REVIEW:
        return "wait"
    return "schedule"


# ========== Graph Builder ==========

def build_linkedin_agent_graph() -> StateGraph:
    graph = StateGraph(AgentState)
    
    graph.add_node("gather", gather_context)
    graph.add_node("generate", generate_post)
    graph.add_node("review", hitl_review_gate)
    graph.add_node("schedule", schedule_post)
    
    graph.set_entry_point("gather")
    graph.add_edge("gather", "generate")
    graph.add_edge("generate", "review")
    
    graph.add_conditional_edges(
        "review",
        should_wait,
        {
            "wait": END,
            "schedule": "schedule",
        }
    )
    graph.add_edge("schedule", END)
    
    return graph.compile()


# ========== Runner ==========

async def run_linkedin_agent(
    user_id: str,
    topic: Optional[str] = None,
    context: Optional[str] = None,
    mission_id: Optional[str] = None,
) -> AgentState:
    """
    Run the LinkedIn Agent.
    """
    if not mission_id:
        mission_id = str(uuid.uuid4())
    
    initial_state = create_initial_state(
        mission_id=mission_id,
        user_id=user_id,
        agent_type=AgentType.LINKEDIN,
        input_data={
            "topic": topic,
            "context": context,
        }
    )
    
    graph = build_linkedin_agent_graph()
    
    # Run graph with streaming to update database after each node
    final_state = initial_state
    try:
        async for state_update in graph.astream(initial_state):
            for node_name, node_output in state_update.items():
                if node_output:
                    for key, value in node_output.items():
                        if key in ["events", "artifacts"] and key in final_state:
                            final_state[key] = final_state[key] + value
                        else:
                            final_state[key] = value
                    
                    # Extract and normalize status
                    status = final_state.get("status", MissionStatus.RUNNING)
                    if hasattr(status, "value"):
                        status = status.value
                    
                    # Update database with current progress
                    try:
                        await db.update_mission(
                            mission_id,
                            status=str(status),
                            current_node=final_state.get("current_node", node_name),
                            progress=int(final_state.get("progress", 0)),
                            context=final_state.get("context"),
                            events=[e.to_dict() if hasattr(e, "to_dict") else e for e in final_state.get("events", [])],
                            artifacts=[a.to_dict() if hasattr(a, "to_dict") else a for a in final_state.get("artifacts", [])],
                            requires_approval=final_state.get("requires_approval", False),
                            approval_reason=final_state.get("approval_reason"),
                        )
                    except Exception as db_err:
                        import logging
                        logging.getLogger(__name__).error(f"Failed to update DB for mission {mission_id}: {db_err}")
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"LinkedIn Agent execution failed: {e}", exc_info=True)
        final_state["status"] = MissionStatus.FAILED
        final_state["error"] = str(e)
    
    return final_state
