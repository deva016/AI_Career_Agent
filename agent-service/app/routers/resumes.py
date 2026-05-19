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
    original_content: Optional[str] = None
    tailored_content: Optional[str] = None
    format: str
    created_at: datetime

@router.get("/")
async def list_resumes(
    user_id: str = Depends(get_current_user),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    try:
        resumes = await db.get_resumes(user_id=user_id, limit=limit, offset=offset)
        result = []
        for r in resumes:
            try:
                result.append(ResumeResponse(
                    id=str(r["id"]),
                    user_id=r["user_id"],
                    job_id=str(r["job_id"]) if r.get("job_id") else None,
                    title=r.get("title") or "Untitled Resume",
                    pdf_url=r.get("pdf_url"),
                    original_content=r.get("original_content"),
                    tailored_content=r.get("tailored_content"),
                    format=r.get("format") or "ats_friendly",
                    created_at=r["created_at"]
                ))
            except Exception as e:
                import logging
                logging.error(f"Error parsing resume row {r.get('id')}: {e}")
                continue
        return result
    except Exception as e:
        import logging
        logging.error(f"Error listing resumes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    pdf_url: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user),
):
    # If using Vercel Blob, the frontend will pass the pdf_url
    file_content = await file.read()
    final_url = pdf_url or f"https://storage.example.com/resumes/{user_id}/{uuid.uuid4()}.pdf"
    
    # Create resume entry
    async with db.connection() as conn:
        resume_id = await conn.fetchval(
            """
            INSERT INTO resumes (user_id, title, pdf_url, format)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            """,
            user_id, title or file.filename, final_url, "ats_friendly"
        )
        
    # Process the resume for RAG
    # This chunks the text, classifies chunks, generates embeddings and stores them.
    from rag.processor import ResumeProcessor
    processor = ResumeProcessor()
    success = await processor.process_resume(user_id=user_id, resume_id=str(resume_id), pdf_content=file_content)
    
    if not success:
        # We don't necessarily fail the upload, but it's good to log
        return {"id": str(resume_id), "url": final_url, "message": "Resume uploaded successfully, but parsing encountered warnings."}
    
    return {"id": str(resume_id), "url": final_url, "message": "Resume uploaded and processed successfully"}

@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    user_id: str = Depends(get_current_user),
):
    async with db.connection() as conn:
        # Verify ownership
        owner = await conn.fetchval("SELECT user_id FROM resumes WHERE id = $1", uuid.UUID(resume_id))
        if not owner:
            raise HTTPException(status_code=404, detail="Resume not found")
        if owner != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this resume")
            
        # Delete chunks first
        await conn.execute("DELETE FROM resume_chunks WHERE resume_id = $1", uuid.UUID(resume_id))
        # Delete applications that reference this resume (or set to NULL)
        await conn.execute("UPDATE applications SET resume_id = NULL WHERE resume_id = $1", uuid.UUID(resume_id))
        # Delete the resume
        await conn.execute("DELETE FROM resumes WHERE id = $1", uuid.UUID(resume_id))
        
    return {"status": "success", "message": "Resume deleted successfully"}
