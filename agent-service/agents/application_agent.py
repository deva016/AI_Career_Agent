"""
Application Automation Agent - LangGraph Implementation

This agent automates job applications using Playwright.
It detects the ATS, fills forms, handles questions using KB/LLM,
and submits applications with HITL review.
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
from core.llm import get_langchain_llm, LLMClient
from core.database import db
from ats.detector import detect_ats_platform, ATSPlatform


# ========== Node Functions ==========

async def detect_ats(state: AgentState) -> Dict:
    """
    Detect the ATS platform for the target job URL.
    """
    input_data = state["input_data"]
    job_id = input_data.get("job_id")
    url = input_data.get("url")
    
    # Get URL from DB if not provided
    if job_id and not url:
        jobs = await db.get_jobs(state["user_id"], limit=1)
        job = next((j for j in jobs if str(j["id"]) == job_id), None)
        if job:
            url = job["url"]
    
    if not url:
        return {
            "error": "No job URL provided",
            "status": MissionStatus.FAILED,
        }
    
    platform = detect_ats_platform(url)
    
    return {
        "context": {
            **state.get("context", {}),
            "url": url,
            "platform": platform.value,
        },
        "events": [MissionEvent(
            type="log",
            message=f"Detected ATS platform: {platform.value}",
            data={"platform": platform.value}
        )],
        **update_status(state, MissionStatus.RUNNING, "detect_ats", 10)
    }


async def load_knowledge_base(state: AgentState) -> Dict:
    """
    Load user's knowledge base for answering questions.
    """
    user_id = state["user_id"]
    settings = await db.get_user_settings(user_id)
    kb = settings.get("knowledge_base", {}) if settings else {}
    
    return {
        "context": {**state["context"], "knowledge_base": kb},
        "events": [MissionEvent(
            type="log",
            message=f"Loaded Knowledge Base with {len(kb)} entries",
        )],
        **update_status(state, MissionStatus.RUNNING, "load_kb", 20)
    }


async def fill_application_form(state: AgentState) -> Dict:
    """
    Use Playwright to navigate to URL and fill the form.
    
    NOTE: Real browser automation requires full Playwright setup.
    For this agent implementation, we will mock the browser interaction
    but structure it exactly how it would work.
    """
    context = state["context"]
    url = context["url"]
    platform = context["platform"]
    kb = context["knowledge_base"]
    
    # Mock Playwright execution
    # In production: async with async_playwright() as p: ...
    
    # Simulate finding questions
    mock_questions = [
        {"id": "q1", "text": "Are you authorized to work in the US?", "type": "radio"},
        {"id": "q2", "text": "How many years of Python experience?", "type": "number"},
        {"id": "q3", "text": "Why do you want to work here?", "type": "textarea"},
    ]
    
    return {
        "context": {
            **context,
            "form_questions": mock_questions,
            "answers": {},
        },
        "events": [MissionEvent(
            type="log",
            message=f"Accessed application form on {platform}",
            data={"questions_found": len(mock_questions)}
        )],
        **update_status(state, MissionStatus.EXECUTING, "fill_form", 50)
    }


async def handle_questions(state: AgentState) -> Dict:
    """
    Generate answers for form questions using KB and LLM.
    """
    context = state["context"]
    questions = context.get("form_questions", [])
    kb = context.get("knowledge_base", {})
    llm = LLMClient()
    
    answers = {}
    low_confidence_answers = []
    
    for q in questions:
        question_text = q["text"]
        
        # 1. Check direct KB match (simplified)
        if "authorized" in question_text.lower() and "work_auth" in kb:
            answers[q["id"]] = kb["work_auth"]
            continue
            
        # 2. Use LLM to answer
        prompt = f"""
        Answer this job application question based on the candidate's profile.
        
        Question: {question_text}
        
        Candidate Profile:
        {json.dumps(kb, indent=2)}
        
        If you are unsure, reply with "dunno".
        Keep answer concise.
        """
        
        response = await llm.quick_llm(prompt)
        
        if "dunno" in response.lower():
            low_confidence_answers.append({
                "question": question_text,
                "suggested_answer": "",
                "reason": "Missing info in profile"
            })
        else:
            answers[q["id"]] = response
    
    return {
        "context": {
            **context,
            "answers": answers,
            "low_confidence_answers": low_confidence_answers,
        },
        "events": [MissionEvent(
            type="log",
            message=f"Generated answers for {len(questions)} questions",
            data={"low_confidence_count": len(low_confidence_answers)}
        )],
        **update_status(state, MissionStatus.EXECUTING, "handle_questions", 70)
    }


async def hitl_review_gate(state: AgentState) -> Dict:
    """
    Pause if there are low confidence answers or for final review.
    """
    context = state["context"]
    low_confidence = context.get("low_confidence_answers", [])
    
    # Always pause for demo safety, or if issues found
    if low_confidence or True: 
        return {
            "status": MissionStatus.NEEDS_REVIEW,
            "current_node": "hitl_review",
            "progress": 80,
            "requires_approval": True,
            "approval_reason": f"Review application answers for {context.get('url')}",
            "events": [MissionEvent(
                type="status_change",
                message="Waiting for user review of application",
                data={"low_confidence": low_confidence}
            )],
        }
    
    return {}


async def submit_application(state: AgentState) -> Dict:
    """
    Submit the application (Mock).
    """
    context = state["context"]
    
    # In production: Click submit button with Playwright
    
    return {
        "status": MissionStatus.COMPLETED,
        "current_node": "complete",
        "progress": 100,
        "completed_at": datetime.now().isoformat(),
        "output_data": {
            "application_status": "submitted",
            "platform": context["platform"],
            "url": context["url"],
        },
        "events": [MissionEvent(
            type="status_change",
            message="Application submitted successfully",
        )],
    }


# ========== Conditional Routing ==========

def should_wait(state: AgentState) -> str:
    if state.get("status") == MissionStatus.NEEDS_REVIEW:
        return "wait"
    return "submit"


# ========== Graph Builder ==========

def build_application_agent_graph() -> StateGraph:
    """Build the Application Agent graph."""
    
    graph = StateGraph(AgentState)
    
    graph.add_node("detect_ats", detect_ats)
    graph.add_node("load_kb", load_knowledge_base)
    graph.add_node("fill_form", fill_application_form)
    graph.add_node("handle_questions", handle_questions)
    graph.add_node("review", hitl_review_gate)
    graph.add_node("submit", submit_application)
    
    graph.set_entry_point("detect_ats")
    graph.add_edge("detect_ats", "load_kb")
    graph.add_edge("load_kb", "fill_form")
    graph.add_edge("fill_form", "handle_questions")
    graph.add_edge("handle_questions", "review")
    
    graph.add_conditional_edges(
        "review",
        should_wait,
        {
            "wait": END,
            "submit": "submit",
        }
    )
    graph.add_edge("submit", END)
    
    return graph.compile()


# ========== Runner ==========

async def run_application_agent(
    user_id: str,
    job_id: Optional[str] = None,
    url: Optional[str] = None,
    resume_id: Optional[str] = None,
) -> AgentState:
    """
    Run the Application Agent.
    """
    mission_id = str(uuid.uuid4())
    
    initial_state = create_initial_state(
        mission_id=mission_id,
        user_id=user_id,
        agent_type=AgentType.APPLICATION,
        input_data={
            "job_id": job_id,
            "url": url,
            "resume_id": resume_id,
        }
    )
    
    graph = build_application_agent_graph()
    final_state = await graph.ainvoke(initial_state)
    
    return final_state
