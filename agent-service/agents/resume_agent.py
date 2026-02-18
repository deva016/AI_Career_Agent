"""
Resume & Cover Letter Agent - LangGraph Implementation

This agent uses RAG to tailor resumes and generate cover letters
for specific job applications with HITL review.
"""

from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from datetime import datetime
import uuid

from graphs.state import (
    AgentState, MissionStatus, AgentType,
    create_initial_state, update_status, MissionEvent, Artifact
)
from core.llm import get_langchain_llm, LLMClient
from core.database import db
from rag.retriever import RAGRetriever, ChunkType


# ========== Prompts ==========

ANALYZE_JD_PROMPT = """Analyze this job description and extract:
1. Key required skills
2. Preferred qualifications
3. Key responsibilities
4. Company values/culture indicators
5. Keywords that should appear in a tailored resume

Job Description:
{job_description}

Respond in JSON format with keys: required_skills, preferred_qualifications, responsibilities, culture, keywords
"""

TAILOR_RESUME_PROMPT = """You are an expert resume writer. Tailor the candidate's resume content to match this job.

JOB TITLE: {job_title}
COMPANY: {company}

JOB REQUIREMENTS:
{job_analysis}

CANDIDATE'S RESUME CONTENT:
{resume_chunks}

Instructions:
1. Rewrite experience bullets to emphasize relevant skills
2. Reorganize skills section to highlight matching skills first
3. Add relevant keywords naturally
4. Keep metrics and achievements prominent
5. Maintain truthfulness - only rephrase, don't fabricate

Output a tailored resume in clean markdown format.
"""

COVER_LETTER_PROMPT = """Write a compelling cover letter for this job application.

JOB: {job_title} at {company}
LOCATION: {location}

JOB REQUIREMENTS:
{job_analysis}

CANDIDATE HIGHLIGHTS:
{resume_highlights}

Instructions:
1. Open with a strong hook showing enthusiasm for the role
2. Connect 2-3 specific experiences to job requirements
3. Show knowledge of the company
4. Close with a clear call to action
5. Keep it under 300 words

Write the cover letter:
"""


# ========== Node Functions ==========

async def analyze_job(state: AgentState) -> Dict:
    """
    Analyze the job description to extract requirements and keywords.
    """
    input_data = state["input_data"]
    job_id = input_data.get("job_id")
    
    # Get job from database if ID provided
    if job_id:
        jobs = await db.get_jobs(state["user_id"], limit=1)
        job = next((j for j in jobs if str(j["id"]) == job_id), None)
        if not job:
            return {
                "error": f"Job {job_id} not found",
                "status": MissionStatus.FAILED,
            }
        job_description = job["description"]
        job_title = job["title"]
        company = job["company"]
        location = job["location"]
    else:
        job_description = input_data.get("job_description", "")
        job_title = input_data.get("job_title", "")
        company = input_data.get("company", "")
        location = input_data.get("location", "")
    
    # Use LLM to analyze JD
    llm = LLMClient()
    analysis = await llm.simple_prompt(
        ANALYZE_JD_PROMPT.format(job_description=job_description),
        system="You are a job requirements analyst. Respond only in valid JSON."
    )
    
    # Validate JSON response with Pydantic
    from core.models import JobAnalysis, parse_llm_json
    job_analysis = parse_llm_json(analysis, JobAnalysis)
    
    return {
        "context": {
            **state.get("context", {}),
            "job_title": job_title,
            "company": company,
            "location": location,
            "job_description": job_description,
            "job_analysis": job_analysis.model_dump_json(),
        },
        "events": [MissionEvent(
            type="log",
            message=f"Analyzed job requirements for {job_title} at {company}",
        )],
        **update_status(state, MissionStatus.EXECUTING, "analyze_job", 20)
    }


async def match_resume_chunks(state: AgentState) -> Dict:
    """
    Use RAG to retrieve relevant resume chunks for the job.
    """
    context = state["context"]
    user_id = state["user_id"]
    
    # Create retriever
    retriever = RAGRetriever(user_id)
    
    # Get relevant chunks
    chunks = await retriever.retrieve_for_job(
        job_description=context["job_description"],
        job_title=context["job_title"],
    )
    
    # Format chunks for prompt
    all_chunks = []
    for chunk_type, type_chunks in chunks.items():
        all_chunks.extend(type_chunks)
    
    formatted = retriever.format_for_prompt(all_chunks)
    
    return {
        "context": {
            **context,
            "retrieved_chunks": chunks,
            "formatted_chunks": formatted,
            "chunk_count": len(all_chunks),
        },
        "events": [MissionEvent(
            type="log",
            message=f"Retrieved {len(all_chunks)} relevant resume chunks",
            data={"types": list(chunks.keys())}
        )],
        **update_status(state, MissionStatus.EXECUTING, "match_chunks", 40)
    }


async def generate_tailored_content(state: AgentState) -> Dict:
    """
    Generate tailored resume and cover letter using LLM.
    """
    context = state["context"]
    llm = LLMClient()
    
    # Generate tailored resume
    tailored_resume = await llm.simple_prompt(
        TAILOR_RESUME_PROMPT.format(
            job_title=context["job_title"],
            company=context["company"],
            job_analysis=context["job_analysis"],
            resume_chunks=context["formatted_chunks"],
        ),
        system="You are an expert ATS-optimized resume writer."
    )
    
    # Generate cover letter
    cover_letter = await llm.simple_prompt(
        COVER_LETTER_PROMPT.format(
            job_title=context["job_title"],
            company=context["company"],
            location=context["location"],
            job_analysis=context["job_analysis"],
            resume_highlights=context["formatted_chunks"][:2000],  # Limit for prompt
        ),
        system="You are an expert cover letter writer."
    )
    
    # Create artifacts
    resume_artifact = Artifact(
        id=str(uuid.uuid4()),
        type="markdown",
        name=f"Resume_{context['company'].replace(' ', '_')}.md",
        content=tailored_resume,
    )
    
    cover_letter_artifact = Artifact(
        id=str(uuid.uuid4()),
        type="markdown",
        name=f"CoverLetter_{context['company'].replace(' ', '_')}.md",
        content=cover_letter,
    )
    
    return {
        "context": {
            **context,
            "tailored_resume": tailored_resume,
            "cover_letter": cover_letter,
        },
        "artifacts": [resume_artifact, cover_letter_artifact],
        "events": [MissionEvent(
            type="log",
            message="Generated tailored resume and cover letter",
        )],
        **update_status(state, MissionStatus.EXECUTING, "generate", 70)
    }


async def hitl_review_gate(state: AgentState) -> Dict:
    """
    Pause for human-in-the-loop review of generated content.
    """
    context = state["context"]
    
    return {
        "status": MissionStatus.NEEDS_REVIEW,
        "current_node": "hitl_review",
        "progress": 80,
        "requires_approval": True,
        "approval_reason": f"Review tailored resume and cover letter for {context['job_title']} at {context['company']}",
        "events": [MissionEvent(
            type="status_change",
            message="Waiting for user review",
            data={"artifacts": [a.to_dict() for a in state.get("artifacts", [])]}
        )],
    }


async def finalize_artifact(state: AgentState) -> Dict:
    """
    Finalize approved content and mark mission complete.
    """
    context = state["context"]
    user_feedback = state.get("user_feedback")
    
    # If user provided feedback, note it
    if user_feedback:
        # Could regenerate here based on feedback
        pass
    
    return {
        "status": MissionStatus.COMPLETED,
        "current_node": "complete",
        "progress": 100,
        "completed_at": datetime.now().isoformat(),
        "output_data": {
            "job_title": context["job_title"],
            "company": context["company"],
            "resume_generated": True,
            "cover_letter_generated": True,
        },
        "events": [MissionEvent(
            type="status_change",
            message=f"Resume and cover letter finalized for {context['company']}",
        )],
    }


# ========== Conditional Routing ==========

def should_wait_for_approval(state: AgentState) -> str:
    """Route based on approval status."""
    if state.get("status") == MissionStatus.NEEDS_REVIEW:
        return "wait"
    return "finalize"


# ========== Graph Builder ==========

def build_resume_agent_graph() -> StateGraph:
    """Build the Resume Agent graph."""
    
    graph = StateGraph(AgentState)
    
    # Add nodes
    graph.add_node("analyze", analyze_job)
    graph.add_node("match", match_resume_chunks)
    graph.add_node("generate", generate_tailored_content)
    graph.add_node("review", hitl_review_gate)
    graph.add_node("finalize", finalize_artifact)
    
    # Define edges
    graph.set_entry_point("analyze")
    graph.add_edge("analyze", "match")
    graph.add_edge("match", "generate")
    graph.add_edge("generate", "review")
    
    # Conditional edge after review
    graph.add_conditional_edges(
        "review",
        should_wait_for_approval,
        {
            "wait": END,  # Will resume after approval
            "finalize": "finalize",
        }
    )
    graph.add_edge("finalize", END)
    
    return graph.compile()


# ========== Runner ==========

async def run_resume_agent(
    user_id: str,
    job_id: Optional[str] = None,
    job_description: Optional[str] = None,
    job_title: Optional[str] = None,
    company: Optional[str] = None,
    location: Optional[str] = None,
) -> AgentState:
    """
    Run the Resume Agent.
    
    Args:
        user_id: The user's ID
        job_id: Optional job ID from database
        job_description: Job description text (if not using job_id)
        job_title: Job title
        company: Company name
        location: Job location
        
    Returns:
        Agent state (may be paused for HITL review)
    """
    mission_id = str(uuid.uuid4())
    
    initial_state = create_initial_state(
        mission_id=mission_id,
        user_id=user_id,
        agent_type=AgentType.RESUME_WRITER,
        input_data={
            "job_id": job_id,
            "job_description": job_description,
            "job_title": job_title,
            "company": company,
            "location": location,
        }
    )
    
    graph = build_resume_agent_graph()
    final_state = await graph.ainvoke(initial_state)
    
    return final_state
