from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from core.database import db
from core.auth import get_current_user

router = APIRouter()

class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    job_title: Optional[str] = None
    job_company: Optional[str] = None
    resume_id: Optional[str] = None
    status: str
    applied_at: datetime
    notes: Optional[str] = None

class ApplicationListResponse(BaseModel):
    applications: List[ApplicationResponse]
    total: int
    offset: int
    limit: int

@router.get("", response_model=ApplicationListResponse)
async def list_applications(
    user_id: str = Depends(get_current_user),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    apps = await db.get_applications(user_id=user_id, limit=limit, offset=offset)
    total = await db.get_table_count("applications", user_id)
    
    return ApplicationListResponse(
        applications=[ApplicationResponse(
            id=str(a["id"]),
            job_id=str(a["job_id"]),
            job_title=a.get("job_title"),
            job_company=a.get("job_company"),
            resume_id=str(a["resume_id"]) if a.get("resume_id") else None,
            status=a["status"],
            applied_at=a["applied_at"],
            notes=a.get("notes")
        ) for a in apps],
        total=total,
        offset=offset,
        limit=limit
    )
class ApplicationStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

@router.patch("/{application_id}/status")
async def update_application_status(
    application_id: str,
    payload: ApplicationStatusUpdate,
    user_id: str = Depends(get_current_user),
):
    """Update status of an application."""
    # Verify ownership indirectly by checking if it exists for this user in get_applications if needed, 
    # but update_application_status doesn't take user_id. 
    # Let's fix update_application_status to take user_id for security.
    success = await db.update_application_status(
        application_id=application_id,
        status=payload.status,
        notes=payload.notes,
        user_id=user_id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Application not found or access denied")
    return {"id": application_id, "status": payload.status, "updated": True}
