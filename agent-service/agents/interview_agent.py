"""
Interview Preparation Agent - LangGraph Implementation

This agent helps candidates prepare for interviews by:
1. Researching the company and role
2. Generating tailored interview questions
3. Conducting mock interview sessions (via text)
"""

from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from datetime import datetime
import uuid
import json

from graphs.state import (
    AgentState, MissionStatus, AgentType,
    create_initial_state, update_status, MissionEvent, Artifact
)
from core.llm import LLMClient
from core.database import db


# ========== Prompts ==========

COMPANY_RESEARCH_PROMPT = """Research this company for an interview candidate.
Identify key values, recent news, products, and culture.

Company: {company}
Role: {role}

Output JSON with:
1. "values": list of core values
2. "products": key products/services
3. "recent_news": recent achievements or news
4. "culture_notes": potential culture fit points
"""

GENERATE_QUESTIONS_PROMPT = """Generate interview questions for this specific role and company.

Role: {role}
Company: {company}
Company Research: {research}
Job Description: {description}

Output JSON list of objects with:
- "question": string
- "type": "behavioral" | "technical" | "cultural"
- "context": why this question is likely (e.g. "Based on company value X")
- "ideal_answer_points": list of key points to cover
"""


# ========== Node Functions ==========

async def research_company(state: AgentState) -> Dict:
    """
    Research company using LLM (and potentially tools in future).
    """
    input_data = state["input_data"]
    company = input_data.get("company", "")
    role = input_data.get("role", "")
    job_id = input_data.get("job_id")
    
    description = ""
    if job_id:
        try:
            jobs = await db.get_jobs(state["user_id"], limit=1)
            job = next((j for j in jobs if str(j["id"]) == job_id), None)
            if job:
                description = job["description"]
                if not company: company = job["company"]
                if not role: role = job["title"]
        except Exception:
            pass

    llm = LLMClient()
    
    # Mock research by asking LLM to simulate it based on it's training data
    # Real implementation would use search tools
    research_json = await llm.simple_prompt(
        COMPANY_RESEARCH_PROMPT.format(company=company, role=role),
        system="You are an expert corporate researcher. Respond only in valid JSON."
    )
    
    # Validate with Pydantic
    from core.models import CompanyResearch, parse_llm_json
    research = parse_llm_json(research_json, CompanyResearch)
    
    return {
        "context": {
            **state.get("context", {}),
            "company": company,
            "role": role,
            "description": description,
            "research": research.model_dump(),
        },
        "events": [MissionEvent(
            type="log",
            message=f"Completed research for {company}",
        )],
        **update_status(state, MissionStatus.RUNNING, "research", 30)
    }


async def generate_questions(state: AgentState) -> Dict:
    """
    Generate tailored interview questions.
    """
    context = state["context"]
    llm = LLMClient()
    
    questions_json = await llm.simple_prompt(
        GENERATE_QUESTIONS_PROMPT.format(
            role=context["role"],
            company=context["company"],
            research=json.dumps(context["research"]),
            description=context.get("description", "")[:1000]
        ),
        system="You are an expert technical interviewer. Respond only in valid JSON."
    )
    
    try:
        questions = json.loads(questions_json)
    except:
        questions = []
    
    return {
        "context": {
            **context,
            "questions": questions,
        },
        "events": [MissionEvent(
            type="log",
            message=f"Generated {len(questions)} tailored interview questions",
        )],
        **update_status(state, MissionStatus.EXECUTING, "generate_q", 60)
    }


async def create_prep_guide(state: AgentState) -> Dict:
    """
    Create a comprehensive preparation guide artifact.
    """
    context = state["context"]
    research = context["research"]
    questions = context["questions"]
    company = context["company"]
    
    markdown = f"""# Interview Prep: {company}

## 🏢 Company Insights
**Core Values:**
{', '.join(research.get('values', []))}

**Key Products:**
{', '.join(research.get('products', []))}

**Culture Notes:**
{', '.join(research.get('culture_notes', []))}

## ❓ Anticipated Questions

"""
    for i, q in enumerate(questions, 1):
        markdown += f"### {i}. {q['question']} ({q['type'].title()})\n"
        markdown += f"_{q['context']}_\n\n"
        markdown += "**Key talking points:**\n"
        for point in q.get('ideal_answer_points', []):
            markdown += f"- {point}\n"
        markdown += "\n"
        
    artifact = Artifact(
        id=str(uuid.uuid4()),
        type="markdown",
        name=f"InterviewPrep_{company.replace(' ', '_')}.md",
        content=markdown,
    )
    
    return {
        "status": MissionStatus.COMPLETED,
        "current_node": "complete",
        "progress": 100,
        "completed_at": datetime.now().isoformat(),
        "output_data": {
            "question_count": len(questions),
            "company_analyzed": company,
        },
        "artifacts": [artifact],
        "events": [MissionEvent(
            type="status_change",
            message="Interview preparation guide generated",
        )],
    }


# ========== Graph Builder ==========

def build_interview_agent_graph() -> StateGraph:
    graph = StateGraph(AgentState)
    
    graph.add_node("research", research_company)
    graph.add_node("generate_q", generate_questions)
    graph.add_node("create_guide", create_prep_guide)
    
    graph.set_entry_point("research")
    graph.add_edge("research", "generate_q")
    graph.add_edge("generate_q", "create_guide")
    graph.add_edge("create_guide", END)
    
    return graph.compile()


# ========== Runner ==========

async def run_interview_agent(
    user_id: str,
    company: Optional[str] = None,
    role: Optional[str] = None,
    job_id: Optional[str] = None,
    mission_id: Optional[str] = None,
) -> AgentState:
    """
    Run the Interview Agent.
    """
    if not mission_id:
        mission_id = str(uuid.uuid4())
    
    initial_state = create_initial_state(
        mission_id=mission_id,
        user_id=user_id,
        agent_type=AgentType.INTERVIEW_PREP,
        input_data={
            "company": company,
            "role": role,
            "job_id": job_id,
        }
    )
    
    graph = build_interview_agent_graph()
    
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
                        )
                    except Exception as db_err:
                        import logging
                        logging.getLogger(__name__).error(f"Failed to update DB for mission {mission_id}: {db_err}")
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Interview Agent execution failed: {e}", exc_info=True)
        final_state["status"] = MissionStatus.FAILED
        final_state["error"] = str(e)
    
    return final_state
