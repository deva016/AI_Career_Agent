"""
Agent API Router

Endpoints for triggering and managing agent missions.
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import asyncio
import json
import uuid

from graphs.state import AgentState, MissionStatus, AgentType
from agents.job_finder import run_job_finder
from agents.resume_agent import run_resume_agent
from agents.application_agent import run_application_agent
from agents.linkedin_agent import run_linkedin_agent
from agents.skill_gap_agent import run_skill_gap_agent
from agents.interview_agent import run_interview_agent

from core.database import db
from core.auth import get_current_user, verify_user_owns_resource
from core.models import parse_llm_json  # Ensure models are available

# Setup logging
import logging
logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory store removed - using database
# _missions: Dict[str, AgentState] = {}


# ========== Pydantic Models ==========

class JobFinderRequest(BaseModel):
    """Request to start a job finder mission."""
    query: Optional[str] = Field(None, description="Natural language search query")
    target_roles: Optional[List[str]] = Field(None, description="Target job titles")
    target_locations: Optional[List[str]] = Field(None, description="Target locations")


class ResumeTailorRequest(BaseModel):
    """Request to tailor resume for a job."""
    job_id: Optional[str] = Field(None, description="Job ID from database")
    job_description: Optional[str] = Field(None, description="Job description text")
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None


class ApplicationRequest(BaseModel):
    """Request to start an application automation mission."""
    job_id: Optional[str] = Field(None, description="Job ID from database")
    url: Optional[str] = Field(None, description="Job URL")
    resume_id: Optional[str] = Field(None, description="Specific resume to use")


class LinkedInRequest(BaseModel):
    """Request to generate a LinkedIn post."""
    topic: Optional[str] = Field(None, description="Post topic")
    context: Optional[str] = Field(None, description="Additional context")


class SkillGapRequest(BaseModel):
    """Request to analyze skill gaps."""
    role: Optional[str] = Field(None, description="Target role to analyze")


class InterviewRequest(BaseModel):
    """Request to generate interview prep."""
    company: Optional[str] = Field(None, description="Company name")
    role: Optional[str] = Field(None, description="Job role")
    job_id: Optional[str] = Field(None, description="Linked Job ID")


class MissionResponse(BaseModel):
    """Response containing mission status."""
    mission_id: str
    agent_type: Optional[str] = None
    status: str
    progress: int
    current_node: str
    events: List[Dict[str, Any]] = []
    artifacts: List[Dict[str, Any]] = []
    output_data: Optional[Dict[str, Any]] = None
    requires_approval: bool = False
    approval_reason: Optional[str] = None
    created_at: Optional[str] = None


class ApprovalRequest(BaseModel):
    """Request to approve or reject a mission."""
    approved: bool
    feedback: Optional[str] = None
    edited_content: Optional[str] = Field(None, description="Manually edited content to override AI draft")


# ========== Helper Functions ==========

def state_to_response(data: Dict) -> MissionResponse:
    """Convert DB mission data to API response."""
    mission_id = data.get("mission_id") or data.get("id") or "unknown"
    status = data.get("status") or "pending"
    if hasattr(status, "value"):
        status = status.value
    
    # Parse events/artifacts: they may be JSON strings from DB
    raw_events = data.get("events") or []
    if isinstance(raw_events, str):
        try:
            raw_events = json.loads(raw_events)
        except (json.JSONDecodeError, TypeError):
            raw_events = []
    events = [e.to_dict() if hasattr(e, "to_dict") else e for e in raw_events]
    
    raw_artifacts = data.get("artifacts") or []
    if isinstance(raw_artifacts, str):
        try:
            raw_artifacts = json.loads(raw_artifacts)
        except (json.JSONDecodeError, TypeError):
            raw_artifacts = []
    artifacts = [a.to_dict() if hasattr(a, "to_dict") else a for a in raw_artifacts]
    
    # Handle created_at
    created_at = data.get("created_at")
    if created_at and hasattr(created_at, "isoformat"):
        created_at = created_at.isoformat()
    
    return MissionResponse(
        mission_id=str(mission_id),
        agent_type=data.get("agent_type"),
        status=str(status),
        progress=int(data.get("progress") or 0),
        current_node=str(data.get("current_node") or "unknown"),
        events=events,
        artifacts=artifacts,
        output_data=data.get("output_data"),
        requires_approval=bool(data.get("requires_approval", False)),
        approval_reason=data.get("approval_reason"),
        created_at=str(created_at) if created_at else None,
    )


async def run_mission_background(mission_id: str, mission_type: str, user_id: str, **kwargs):
    """Run a mission in the background and persist results."""
    logger.info(f"Starting background mission {mission_id} ({mission_type})")
    
    try:
        # Update status to running
        await db.update_mission(mission_id, status=MissionStatus.RUNNING.value, progress=0, current_node="initializing")
        
        # Run the agent with mission_id for live updates
        if mission_type == "job_finder":
            state = await run_job_finder(user_id=user_id, mission_id=mission_id, **kwargs)
        elif mission_type == "resume":
            state = await run_resume_agent(user_id=user_id, mission_id=mission_id, **kwargs)
        elif mission_type == "application":
            state = await run_application_agent(user_id=user_id, mission_id=mission_id, **kwargs)
        elif mission_type == "linkedin":
            state = await run_linkedin_agent(user_id=user_id, mission_id=mission_id, **kwargs)
        elif mission_type == "skill_gap":
            state = await run_skill_gap_agent(user_id=user_id, mission_id=mission_id, **kwargs)
        elif mission_type == "interview":
            state = await run_interview_agent(user_id=user_id, mission_id=mission_id, **kwargs)
        else:
            raise ValueError(f"Unknown mission type: {mission_type}")
        
        # Persist final state
        # Convert enum status to string
        final_status = state["status"]
        if hasattr(final_status, "value"):
            final_status = final_status.value
            
        await db.update_mission(
            mission_id,
            status=final_status,
            current_node=state.get("current_node"),
            progress=state.get("progress"),
            output_data=state.get("output_data"),
            context=state.get("context"),
            events=[e.to_dict() if hasattr(e, "to_dict") else e for e in state.get("events", [])],
            artifacts=[a.to_dict() if hasattr(a, "to_dict") else a for a in state.get("artifacts", [])],
            requires_approval=state.get("requires_approval"),
            approval_reason=state.get("approval_reason"),
            error=state.get("error"),  # Pass error from state if present
            completed_at=datetime.now() if final_status in ["completed", "failed"] else None
        )
        logger.info(f"Mission {mission_id} complete: {final_status}")
        
    except Exception as e:
        logger.error(f"Mission {mission_id} failed: {e}", exc_info=True)
        await db.update_mission(
            mission_id,
            status=MissionStatus.FAILED.value,
            error=str(e),
            current_node="error",
            completed_at=datetime.now()
        )


# ========== Endpoints ==========

@router.post("/mission/job-finder", response_model=MissionResponse)
async def start_job_finder(
    request: JobFinderRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
):
    """
    Start a job finder mission.
    """
    if not request.query and not request.target_roles:
        raise HTTPException(status_code=400, detail="Must provide query or target_roles")
        
    mission_id = str(uuid.uuid4())
    input_data = request.model_dump()
    
    # Create mission in DB
    await db.create_mission(
        mission_id=mission_id,
        user_id=user_id,
        agent_type="job_finder",
        input_data=input_data
    )
    
    # Run in background
    background_tasks.add_task(
        run_mission_background,
        mission_id=mission_id,
        mission_type="job_finder",
        user_id=user_id,
        query=request.query,
        target_roles=request.target_roles,
        target_locations=request.target_locations,
    )
    
    # Return initial state
    return MissionResponse(
        mission_id=mission_id,
        status=MissionStatus.PENDING.value,
        progress=0,
        current_node="queued"
    )


@router.post("/mission/resume", response_model=MissionResponse)
async def start_resume_mission(
    request: ResumeTailorRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
):
    """
    Start a resume tailoring mission.
    """
    if not request.job_id and not request.job_description:
        raise HTTPException(status_code=400, detail="Must provide either job_id or job_description")
        
    mission_id = str(uuid.uuid4())
    
    await db.create_mission(
        mission_id=mission_id,
        user_id=user_id,
        agent_type="resume",
        input_data=request.model_dump()
    )
    
    background_tasks.add_task(
        run_mission_background,
        mission_id=mission_id,
        mission_type="resume",
        user_id=user_id,
        job_id=request.job_id,
        job_description=request.job_description,
        job_title=request.job_title,
        company=request.company,
        location=request.location,
    )
    
    return MissionResponse(
        mission_id=mission_id,
        status=MissionStatus.PENDING.value,
        progress=0,
        current_node="queued"
    )


@router.post("/mission/application", response_model=MissionResponse)
async def start_application_mission(
    request: ApplicationRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
):
    """
    Start an auto-application mission.
    """
    mission_id = str(uuid.uuid4())
    
    await db.create_mission(
        mission_id=mission_id,
        user_id=user_id,
        agent_type="application",
        input_data=request.model_dump()
    )
    
    background_tasks.add_task(
        run_mission_background,
        mission_id=mission_id,
        mission_type="application",
        user_id=user_id,
        job_id=request.job_id,
        url=request.url,
        resume_id=request.resume_id,
    )
    
    return MissionResponse(
        mission_id=mission_id,
        status=MissionStatus.PENDING.value,
        progress=0,
        current_node="queued"
    )


@router.post("/mission/linkedin", response_model=MissionResponse)
async def start_linkedin_mission(
    request: LinkedInRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
):
    """Start a LinkedIn post generation mission."""
    if not request.topic:
        raise HTTPException(status_code=400, detail="Must provide topic")
        
    mission_id = str(uuid.uuid4())
    
    await db.create_mission(
        mission_id=mission_id,
        user_id=user_id,
        agent_type="linkedin",
        input_data=request.model_dump()
    )
    
    background_tasks.add_task(
        run_mission_background,
        mission_id=mission_id,
        mission_type="linkedin",
        user_id=user_id,
        topic=request.topic,
        context=request.context,
    )
    
    return MissionResponse(
        mission_id=mission_id,
        status=MissionStatus.PENDING.value,
        progress=0,
        current_node="queued"
    )


@router.post("/mission/skill-gap", response_model=MissionResponse)
async def start_skill_gap_mission(
    request: SkillGapRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
):
    """Start a skill gap analysis mission."""
    if not request.role:
        raise HTTPException(status_code=400, detail="Must provide target role")
        
    mission_id = str(uuid.uuid4())
    
    await db.create_mission(
        mission_id=mission_id,
        user_id=user_id,
        agent_type="skill_gap",
        input_data=request.model_dump()
    )
    
    background_tasks.add_task(
        run_mission_background,
        mission_id=mission_id,
        mission_type="skill_gap",
        user_id=user_id,
        role=request.role,
    )
    
    return MissionResponse(
        mission_id=mission_id,
        status=MissionStatus.PENDING.value,
        progress=0,
        current_node="queued"
    )


@router.post("/mission/interview", response_model=MissionResponse)
async def start_interview_mission(
    request: InterviewRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
):
    """Start an interview preparation mission."""
    if not request.company:
        raise HTTPException(status_code=400, detail="Must provide company name")
        
    mission_id = str(uuid.uuid4())
    
    await db.create_mission(
        mission_id=mission_id,
        user_id=user_id,
        agent_type="interview",
        input_data=request.model_dump()
    )
    
    background_tasks.add_task(
        run_mission_background,
        mission_id=mission_id,
        mission_type="interview",
        user_id=user_id,
        company=request.company,
        role=request.role,
        job_id=request.job_id,
    )
    
    return MissionResponse(
        mission_id=mission_id,
        status=MissionStatus.PENDING.value,
        progress=0,
        current_node="queued"
    )


@router.get("/mission/{mission_id}", response_model=MissionResponse)
async def get_mission(
    mission_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get the current status of a mission."""
    mission = await db.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
        
    verify_user_owns_resource(user_id, mission["user_id"])
    
    return state_to_response(mission)


@router.post("/mission/{mission_id}/approve", response_model=MissionResponse)
async def approve_mission(
    mission_id: str, 
    request: ApprovalRequest,
    user_id: str = Depends(get_current_user),
):
    """Approve or reject a mission waiting for HITL review."""
    mission = await db.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
        
    verify_user_owns_resource(user_id, mission["user_id"])
    
    if not mission.get("requires_approval"):
        raise HTTPException(status_code=400, detail="Mission is not waiting for approval")
    
    updates = {
        "requires_approval": False,
        "user_feedback": request.feedback,
        "status": MissionStatus.APPROVED.value if request.approved else MissionStatus.REJECTED.value
    }
    
    # If user provided edited content, update the artifacts
    if request.edited_content:
        logger.info(f"Applying manual edits to mission {mission_id}")
        # Update artifacts with the new content
        artifacts = mission.get("artifacts", [])
        if artifacts:
            # Update the first markdown artifact (usually the resume/letter)
            artifacts[0]["content"] = request.edited_content
            updates["artifacts"] = artifacts
        
        # Also update output_data for consistency
        output_data = mission.get("output_data", {})
        output_data["content"] = request.edited_content
        updates["output_data"] = output_data
    
    if request.approved:
        # User approved the content
        updates["status"] = MissionStatus.COMPLETED.value
        updates["progress"] = 100
        updates["completed_at"] = datetime.now()
    else:
        # User requested regeneration with feedback
        updates["status"] = MissionStatus.RUNNING.value
        updates["progress"] = 50  # Reset for regeneration
        updates["requires_approval"] = False
        
        # Trigger background task for regeneration
        background_tasks.add_task(
            run_mission_background,
            mission_id=mission_id,
            mission_type=mission.get("agent_type"),
            user_id=user_id,
            feedback=request.feedback,
            is_regeneration=True,
            **mission.get("input_data", {})
        )
    
    await db.update_mission(mission_id, **updates)
    
    # Return updated mission
    updated_mission = await db.get_mission(mission_id)
    return state_to_response(updated_mission)


@router.get("/missions")
async def list_missions(
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    user_id: str = Depends(get_current_user),
):
    """List all missions for a user."""
    missions = await db.list_missions(
        user_id=user_id,
        status=status,
        limit=limit,
        offset=offset,
        summary=True
    )
    
    return {
        "missions": [state_to_response(m) for m in missions],
        "total": len(missions),  # Approximation for now
    }


@router.get("/events")
async def stream_events(user_id: str = Depends(get_current_user)):
    """Server-Sent Events stream for real-time mission updates."""
    async def event_generator():
        last_check = {}
        try:
            while True:
                # Poll DB for active missions of this user
                # Optimized: only check running missions
                missions = await db.list_missions(user_id, limit=50) # Get recent ones
                
                for mission in missions:
                    mission_id = mission["id"]
                    status = mission["status"]
                    progress = mission.get("progress", 0)
                    
                    # Check if status/progress changed
                    key = f"{mission_id}_{status}_{progress}"
                    if mission_id not in last_check or last_check[mission_id] != key:
                        last_check[mission_id] = key
                        
                        event_data = json.dumps({
                            "mission_id": mission_id,
                            "status": status,
                            "progress": progress,
                            # Send events too if needed
                        })
                        
                        yield f"data: {event_data}\n\n"
                
                await asyncio.sleep(2)
        except asyncio.CancelledError:
            logger.info(f"SSE stream disconnected for user {user_id}")
            # Clean exit
            return
            
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", # Nginx no-buffer
        }
    )
