from fastapi import APIRouter, HTTPException, Query, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from core.database import db
from core.auth import get_current_user

router = APIRouter()

class ResumeResponse(BaseModel):
    id: str
    user_id: str
    job_id: Optional[str] = None
    title: Optional[str] = None
    pdf_url: Optional[str] = None
    format: str
    created_at: datetime

@router.get("", response_model=List[ResumeResponse])
async def list_resumes(
    user_id: str = Depends(get_current_user),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    resumes = await db.get_resumes(user_id=user_id, limit=limit, offset=offset)
    return [ResumeResponse(
        id=str(r["id"]),
        user_id=r["user_id"],
        job_id=str(r["job_id"]) if r.get("job_id") else None,
        title=r.get("title"),
        pdf_url=r.get("pdf_url"),
        format=r.get("format", "ats_friendly"),
        created_at=r["created_at"]
    ) for r in resumes]

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user),
):
    # In a real app, upload to S3/Cloudinary/Neon Blob
    # For now, we'll just mock the URL and save to DB
    file_content = await file.read()
    mock_url = f"https://storage.example.com/resumes/{user_id}/{uuid.uuid4()}.pdf"
    
    # Create resume entry
    async with db.connection() as conn:
        resume_id = await conn.fetchval(
            """
            INSERT INTO resumes (user_id, title, pdf_url, format)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            """,
            user_id, title or file.filename, mock_url, "ats_friendly"
        )
    
    return {"id": str(resume_id), "url": mock_url, "message": "Resume uploaded successfully"}
