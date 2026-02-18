"""
Job Finder Agent - LangGraph Implementation

This agent scrapes job listings, deduplicates them, generates embeddings,
and stores them in the database.
"""

from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from datetime import datetime
import uuid
import asyncio
import logging

from graphs.state import (
    AgentState, MissionStatus, AgentType,
    create_initial_state, update_status, MissionEvent, Artifact
)
from core.llm import get_langchain_llm
from core.database import db
from rag.embeddings import embeddings

# Setup logging
logger = logging.getLogger(__name__)


# ========== Node Functions ==========

async def parse_search_criteria(state: AgentState) -> Dict:
    """
    Parse user's job search criteria from input.
    Extracts keywords, location, experience level, etc.
    """
    input_data = state["input_data"]
    llm = get_langchain_llm()
    
    # If criteria already parsed, skip
    if "parsed_criteria" in state.get("context", {}):
        return {}
    
    # Use LLM to parse natural language search criteria
    raw_query = input_data.get("query", "")
    target_roles = input_data.get("target_roles", [])
    target_locations = input_data.get("target_locations", [])
    
    # Simple parsing for now - can be enhanced with LLM
    parsed = {
        "keywords": raw_query.split() if raw_query else target_roles,
        "locations": target_locations,
        "experience_level": input_data.get("experience_level", "any"),
        "job_type": input_data.get("job_type", "full-time"),
        "remote_ok": input_data.get("remote_ok", True),
    }
    
    return {
        "context": {**state.get("context", {}), "parsed_criteria": parsed},
        "events": [MissionEvent(
            type="log",
            message=f"Parsed search criteria: {len(parsed['keywords'])} keywords, {len(parsed['locations'])} locations",
            data=parsed
        )],
        **update_status(state, MissionStatus.RUNNING, "parse_criteria", 10)
    }


async def scrape_jobs(state: AgentState) -> Dict:
    """
    Scrape jobs from configured sources.
    For now, returns mock data. Real implementation will use Playwright.
    """
    criteria = state["context"].get("parsed_criteria", {})
    
    # TODO: Implement real scraping with Playwright
    # For now, generate mock job listings
    mock_jobs = [
        {
            "title": "Senior Software Engineer",
            "company": "TechCorp Inc.",
            "location": "San Francisco, CA (Remote)",
            "description": "We are looking for a Senior Software Engineer with 5+ years of experience in Python, React, and cloud technologies. You will work on building scalable microservices and leading technical initiatives.",
            "url": "https://example.com/jobs/1",
            "source": "mock",
            "salary_range": "$150k - $200k",
            "job_type": "full-time",
        },
        {
            "title": "Full Stack Developer",
            "company": "StartupXYZ",
            "location": "New York, NY",
            "description": "Join our fast-growing startup as a Full Stack Developer. Work with Next.js, Node.js, and PostgreSQL to build innovative products.",
            "url": "https://example.com/jobs/2",
            "source": "mock",
            "salary_range": "$120k - $160k",
            "job_type": "full-time",
        },
        {
            "title": "Backend Engineer",
            "company": "DataFlow Systems",
            "location": "Austin, TX (Hybrid)",
            "description": "Backend Engineer needed for our data platform team. Experience with Python, FastAPI, and distributed systems required.",
            "url": "https://example.com/jobs/3",
            "source": "mock",
            "salary_range": "$130k - $170k",
            "job_type": "full-time",
        },
    ]
    
    return {
        "context": {**state["context"], "scraped_jobs": mock_jobs},
        "events": [MissionEvent(
            type="log",
            message=f"Scraped {len(mock_jobs)} jobs from sources",
            data={"count": len(mock_jobs)}
        )],
        **update_status(state, MissionStatus.EXECUTING, "scrape_jobs", 40)
    }


async def deduplicate_jobs(state: AgentState) -> Dict:
    """
    Remove duplicate job listings based on URL and title+company.
    """
    scraped_jobs = state["context"].get("scraped_jobs", [])
    user_id = state["user_id"]
    
    # Get existing jobs from DB to check for duplicates
    existing_jobs = await db.get_jobs(user_id, limit=500)
    existing_urls = {job["url"] for job in existing_jobs}
    existing_keys = {f"{job['title']}|{job['company']}" for job in existing_jobs}
    
    # Filter out duplicates
    new_jobs = []
    for job in scraped_jobs:
        key = f"{job['title']}|{job['company']}"
        if job["url"] not in existing_urls and key not in existing_keys:
            new_jobs.append(job)
    
    duplicates_removed = len(scraped_jobs) - len(new_jobs)
    
    return {
        "context": {**state["context"], "new_jobs": new_jobs, "duplicates_removed": duplicates_removed},
        "events": [MissionEvent(
            type="log",
            message=f"Deduplicated: {len(new_jobs)} new jobs ({duplicates_removed} duplicates removed)",
            data={"new_count": len(new_jobs), "duplicates": duplicates_removed}
        )],
        **update_status(state, MissionStatus.EXECUTING, "deduplicate", 60)
    }


async def embed_and_store(state: AgentState) -> Dict:
    """
    Generate embeddings for new jobs and store in database.
    """
    try:
        new_jobs = state["context"].get("new_jobs", [])
        user_id = state["user_id"]
        
        logger.info(f"Embed Store: Processing {len(new_jobs)} jobs for user {user_id}")
        
        if not new_jobs:
            return {
                "events": [MissionEvent(
                    type="log",
                    message="No new jobs to store",
                )],
                **update_status(state, MissionStatus.EXECUTING, "embed_store", 90)
            }
        
        # Generate embeddings for job descriptions
        descriptions = [job["description"] for job in new_jobs]
        logger.info(f"Generating embeddings for {len(descriptions)} descriptions")
        job_embeddings = await embeddings.embed_texts(descriptions)
        
        if len(job_embeddings) != len(new_jobs):
            logger.warning(f"Mismatch: {len(new_jobs)} jobs but {len(job_embeddings)} embeddings")
        
        # Store jobs in database
        stored_ids = []
        for i, (job, embedding) in enumerate(zip(new_jobs, job_embeddings)):
            try:
                job_id = await db.create_job(
                    user_id=user_id,
                    title=job["title"],
                    company=job["company"],
                    location=job["location"],
                    description=job["description"],
                    url=job["url"],
                    source=job["source"],
                    embedding=embedding,
                    salary_range=job.get("salary_range"),
                    job_type=job.get("job_type"),
                )
                if job_id:
                    stored_ids.append(job_id)
                else:
                    logger.warning(f"Failed to create job {i}: {job['title']}")
            except Exception as job_err:
                logger.error(f"Error creating job {i}: {job_err}")
                # Continue with other jobs instead of failing batch
                continue
        
        logger.info(f"Successfully stored {len(stored_ids)} jobs")
        
        return {
            "context": {**state["context"], "stored_job_ids": stored_ids},
            "events": [MissionEvent(
                type="log",
                message=f"Stored {len(stored_ids)} jobs with embeddings",
                data={"job_ids": stored_ids}
            )],
            **update_status(state, MissionStatus.EXECUTING, "embed_store", 90)
        }
    except Exception as e:
        logger.error(f"Embed_and_store failed: {e}", exc_info=True)
        # Re-raise to be caught by runner loop
        raise


async def notify_frontend(state: AgentState) -> Dict:
    """
    Emit completion event for frontend to update.
    """
    new_jobs = state["context"].get("new_jobs", [])
    stored_ids = state["context"].get("stored_job_ids", [])
    
    # Create artifact with summary
    summary_artifact = Artifact(
        id=str(uuid.uuid4()),
        type="json",
        name="job_search_summary",
        content={
            "jobs_found": len(new_jobs),
            "jobs_stored": len(stored_ids),
            "criteria": state["context"].get("parsed_criteria"),
        }
    )
    
    return {
        "status": MissionStatus.COMPLETED,
        "current_node": "complete",
        "progress": 100,
        "completed_at": datetime.now().isoformat(),
        "output_data": {
            "jobs_found": len(new_jobs),
            "job_ids": stored_ids,
        },
        "artifacts": [summary_artifact],
        "events": [MissionEvent(
            type="status_change",
            message=f"Job search complete: {len(new_jobs)} new jobs found",
            data={"jobs_found": len(new_jobs)}
        )],
    }


# ========== Graph Builder ==========

def build_job_finder_graph() -> StateGraph:
    """Build the Job Finder agent graph."""
    
    # Create graph
    graph = StateGraph(AgentState)
    
    # Add nodes
    graph.add_node("parse_criteria", parse_search_criteria)
    graph.add_node("scrape", scrape_jobs)
    graph.add_node("deduplicate", deduplicate_jobs)
    graph.add_node("embed_store", embed_and_store)
    graph.add_node("notify", notify_frontend)
    
    # Define edges
    graph.set_entry_point("parse_criteria")
    graph.add_edge("parse_criteria", "scrape")
    graph.add_edge("scrape", "deduplicate")
    graph.add_edge("deduplicate", "embed_store")
    graph.add_edge("embed_store", "notify")
    graph.add_edge("notify", END)
    
    return graph.compile()


# ========== Runner ==========

async def run_job_finder(
    user_id: str,
    query: Optional[str] = None,
    target_roles: Optional[List[str]] = None,
    target_locations: Optional[List[str]] = None,
    mission_id: Optional[str] = None,  # Add mission_id parameter
) -> AgentState:
    """
    Run the Job Finder agent.
    
    Args:
        user_id: The user's ID
        query: Natural language job search query
        target_roles: List of target job titles
        target_locations: List of target locations
        mission_id: Mission ID for persistence (optional)
        
    Returns:
        Final agent state with results
    """
    if not mission_id:
        mission_id = str(uuid.uuid4())
    
    # Create initial state
    initial_state = create_initial_state(
        mission_id=mission_id,
        user_id=user_id,
        agent_type=AgentType.JOB_FINDER,
        input_data={
            "query": query,
            "target_roles": target_roles or [],
            "target_locations": target_locations or [],
        }
    )
    
    # Build graph
    graph = build_job_finder_graph()
    
    # Run graph with streaming to update database after each node
    final_state = initial_state
    try:
        async for state_update in graph.astream(initial_state):
            # state_update is a dict with node name as key and output as value
            for node_name, node_output in state_update.items():
                logger.info(f"Job Finder - Node '{node_name}' executed for mission {mission_id}")
                
                # Merge node output into current state
                if node_output:
                    final_state = {**final_state, **node_output}
                    
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
                        )
                        logger.info(f"Mission {mission_id} updated: {node_name}, progress={final_state.get('progress', 0)}%")
                    except Exception as db_err:
                        logger.error(f"Failed to update DB for mission {mission_id}: {db_err}", exc_info=True)
    except Exception as e:
        error_msg = str(e) or repr(e) or "Unknown error"
        logger.error(f"Job Finder graph execution failed for mission {mission_id}: {error_msg}", exc_info=True)
        final_state["status"] = MissionStatus.FAILED
        final_state["error"] = error_msg
    
    return final_state


