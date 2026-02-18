"""
Jobs API Router

Endpoints for managing job listings.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from core.database import db
from core.auth import get_current_user

router = APIRouter()


# ========== Pydantic Models ==========

class JobResponse(BaseModel):
    """Job listing response."""
    id: str
    title: str
    company: str
    location: str
    description: str
    url: str
    source: str
    salary_range: Optional[str] = None
    job_type: Optional[str] = None
    status: str = "new"
    match_score: Optional[float] = None
    scraped_at: Optional[datetime] = None


class JobListResponse(BaseModel):
    """List of jobs response."""
    jobs: List[JobResponse]
    total: int
    offset: int
    limit: int


# ========== Endpoints ==========

@router.get("", response_model=JobListResponse)
async def list_jobs(
    user_id: str = Depends(get_current_user),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List all jobs for the user.
    
    Supports filtering by status and pagination.
    """
    jobs = await db.get_jobs(
        user_id=user_id,
        limit=limit,
        offset=offset,
        status=status,
    )
    
    return JobListResponse(
        jobs=[JobResponse(
            id=str(j["id"]),
            title=j["title"],
            company=j["company"],
            location=j["location"],
            description=j["description"][:500] + "..." if len(j.get("description", "")) > 500 else j.get("description", ""),
            url=j.get("job_url", j.get("url", "")),
            source=j["source"],
            salary_range=j.get("salary_range"),
            job_type=j.get("job_type"),
            status=j.get("status", "new"),
            scraped_at=j.get("scraped_at"),
        ) for j in jobs],
        total=len(jobs),
        offset=offset,
        limit=limit,
    )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, user_id: str = Depends(get_current_user)):
    """Get a specific job by ID."""
    job = await db.get_job_by_id(job_id=job_id, user_id=user_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobResponse(
        id=str(job["id"]),
        title=job["title"],
        company=job["company"],
        location=job["location"],
        description=job["description"],
        url=job.get("job_url", job.get("url", "")),
        source=job["source"],
        salary_range=job.get("salary_range"),
        job_type=job.get("job_type"),
        status=job.get("status", "new"),
        scraped_at=job.get("scraped_at"),
    )


@router.patch("/{job_id}/status")
async def update_job_status(
    job_id: str,
    status: str,
    user_id: str = Depends(get_current_user),
):
    """Update the status of a job (e.g., applied, rejected, saved)."""
    # TODO: Implement update in database
    return {"job_id": job_id, "status": status, "updated": True}


@router.post("/search")
async def search_jobs(
    query: str,
    user_id: str = Depends(get_current_user),
    limit: int = 10,
):
    """
    Search jobs using vector similarity.
    
    Uses embeddings to find semantically similar jobs.
    """
    from rag.embeddings import embeddings
    
    # Generate query embedding
    query_embedding = await embeddings.embed_text(query)
    
    # Search jobs
    jobs = await db.search_jobs_by_embedding(
        user_id=user_id,
        embedding=query_embedding,
        limit=limit,
    )
    
    return {
        "query": query,
        "results": [
            {
                "id": str(j["id"]),
                "title": j["title"],
                "company": j["company"],
                "similarity": j.get("similarity", 0),
            }
            for j in jobs
        ],
    }
