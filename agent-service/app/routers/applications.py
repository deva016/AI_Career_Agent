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

@router.get("", response_model=List[ApplicationResponse])
async def list_applications(
    user_id: str = Depends(get_current_user),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    apps = await db.get_applications(user_id=user_id, limit=limit, offset=offset)
    return [ApplicationResponse(
        id=str(a["id"]),
        job_id=str(a["job_id"]),
        job_title=a.get("job_title"),
        job_company=a.get("job_company"),
        resume_id=str(a["resume_id"]) if a.get("resume_id") else None,
        status=a["status"],
        applied_at=a["applied_at"],
        notes=a.get("notes")
    ) for a in apps]
