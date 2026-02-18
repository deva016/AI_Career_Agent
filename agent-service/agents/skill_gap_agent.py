"""
Skill Gap Analysis Agent - LangGraph Implementation

This agent compares the user's resume against target job descriptions
to identify missing skills and recommend learning resources.
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
from rag.retriever import RAGRetriever, ChunkType


# ========== Prompts ==========

EXTRACT_SKILLS_PROMPT = """Extract the key technical and soft skills required for this job.
Return ONLY a JSON list of strings.

Job Description:
{job_description}
"""

GAP_ANALYSIS_PROMPT = """Compare the candidate's skills with the required job skills.

REQUIRED SKILLS:
{required_skills}

CANDIDATE SKILLS/EXPERIENCE:
{candidate_profile}

Output JSON with:
1. "matching_skills": list of skills the candidate has
2. "missing_skills": list of skills the candidate lacks
3. "recommendations": list of specific resources or actions to bridge gaps (e.g. "Learn Docker basics", "Build a React project")
"""


# ========== Node Functions ==========

async def fetch_target_jobs(state: AgentState) -> Dict:
    """
    Fetch relevant jobs to analyze skills from.
    """
    input_data = state["input_data"]
    role = input_data.get("role", "Software Engineer")
    
    # Fetch top 5 recent jobs matching the role from DB
    # For now, just getting recent jobs
    jobs = await db.get_jobs(state["user_id"], limit=5)
    
    if not jobs:
        return {
            "error": "No jobs found to analyze",
            "status": MissionStatus.FAILED,
        }
    
    return {
        "context": {
            **state.get("context", {}),
            "target_jobs": jobs,
            "target_role": role,
        },
        "events": [MissionEvent(
            type="log",
            message=f"Analyzing {len(jobs)} jobs for role: {role}",
        )],
        **update_status(state, MissionStatus.RUNNING, "fetch_jobs", 20)
    }


async def extract_required_skills(state: AgentState) -> Dict:
    """
    Extract aggregated required skills from job descriptions using LLM.
    """
    context = state["context"]
    jobs = context["target_jobs"]
    llm = LLMClient()
    
    # Combine descriptions (truncated to avoid token limits)
    combined_desc = "\n\n".join([j["description"][:1000] for j in jobs])
    
    skills_json = await llm.simple_prompt(
        EXTRACT_SKILLS_PROMPT.format(job_description=combined_desc),
        system="You are a technical recruiter. Respond only in valid JSON."
    )
    
    # Parse as simple list or handle dict wrapper
    import json
    try:
        parsed = json.loads(skills_json)
        if isinstance(parsed, list):
            required_skills = parsed
        elif isinstance(parsed, dict):
            required_skills = parsed.get("skills", [])
        else:
            required_skills = []
    except:
        required_skills = []
    
    return {
        "context": {
            **context,
            "required_skills": required_skills,
        },
        "events": [MissionEvent(
            type="log",
            message=f"Identified {len(required_skills)} key skills from market data",
        )],
        **update_status(state, MissionStatus.EXECUTING, "extract_skills", 40)
    }


async def analyze_gaps(state: AgentState) -> Dict:
    """
    Compare required skills against user's resume chunks.
    """
    context = state["context"]
    user_id = state["user_id"]
    required_skills = context["required_skills"]
    
    # distinct skills from resume chunks
    # For efficiency, we'll just grab skill chunks
    chunks = await db.search_resume_chunks(
        user_id, 
        embedding=[0]*1536, # Dummy embedding, rely on fetching all or limit
        chunk_types=[ChunkType.SKILL.value, ChunkType.EXPERIENCE.value],
        limit=50
    )
    
    candidate_profile = "\n".join([c["content"] for c in chunks])
    
    llm = LLMClient()
    analysis_json = await llm.simple_prompt(
        GAP_ANALYSIS_PROMPT.format(
            required_skills=required_skills,
            candidate_profile=candidate_profile
        ),
        system="You are a career coach. Respond only in valid JSON."
    )
    
    # Validate with Pydantic
    from core.models import SkillGapAnalysis, parse_llm_json
    analysis = parse_llm_json(analysis_json, SkillGapAnalysis)
        
    return {
        "context": {
            **context,
            "gap_analysis": analysis.model_dump(),
        },
        "events": [MissionEvent(
            type="log",
            message="Completed gap analysis",
        )],
        **update_status(state, MissionStatus.EXECUTING, "analyze_gaps", 70)
    }


async def generate_report(state: AgentState) -> Dict:
    """
    Create a detailed markdown report of the analysis.
    """
    context = state["context"]
    analysis = context["gap_analysis"]
    role = context["target_role"]
    
    report = f"""# Skill Gap Analysis: {role}

## ✅ Matching Skills
{', '.join(analysis.get('matching_skills', []))}

## ⚠️ Missing Skills
{', '.join(analysis.get('missing_skills', []))}

## 🚀 Recommendations
"""
    for rec in analysis.get("recommendations", []):
        report += f"- {rec}\n"
        
    report += f"\n\n*Based on analysis of {len(context['target_jobs'])} local job listings.*"
    
    # Create artifact
    artifact = Artifact(
        id=str(uuid.uuid4()),
        type="markdown",
        name=f"SkillGap_{role.replace(' ', '_')}.md",
        content=report,
    )
    
    return {
        "status": MissionStatus.COMPLETED,
        "current_node": "complete",
        "progress": 100,
        "completed_at": datetime.now().isoformat(),
        "output_data": {
            "missing_skills": analysis.get("missing_skills", []),
            "score": len(analysis.get("matching_skills", [])) / (len(analysis.get("matching_skills", [])) + len(analysis.get("missing_skills", [])) + 1) * 100
        },
        "artifacts": [artifact],
        "events": [MissionEvent(
            type="status_change",
            message="Skill gap analysis report generated",
        )],
    }


# ========== Graph Builder ==========

def build_skill_gap_graph() -> StateGraph:
    graph = StateGraph(AgentState)
    
    graph.add_node("fetch_jobs", fetch_target_jobs)
    graph.add_node("extract_skills", extract_required_skills)
    graph.add_node("analyze", analyze_gaps)
    graph.add_node("report", generate_report)
    
    graph.set_entry_point("fetch_jobs")
    graph.add_edge("fetch_jobs", "extract_skills")
    graph.add_edge("extract_skills", "analyze")
    graph.add_edge("analyze", "report")
    graph.add_edge("report", END)
    
    return graph.compile()


# ========== Runner ==========

async def run_skill_gap_agent(
    user_id: str,
    role: Optional[str] = None,
) -> AgentState:
    mission_id = str(uuid.uuid4())
    
    initial_state = create_initial_state(
        mission_id=mission_id,
        user_id=user_id,
        agent_type=AgentType.SKILL_GAP,
        input_data={"role": role}
    )
    
    graph = build_skill_gap_graph()
    final_state = await graph.ainvoke(initial_state)
    
    return final_state
