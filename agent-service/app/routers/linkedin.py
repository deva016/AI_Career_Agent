from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from core.database import db
from core.auth import get_current_user

router = APIRouter()

class LinkedInPostResponse(BaseModel):
    id: str
    content: str
    status: str
    created_at: datetime
    scheduled_for: Optional[datetime] = None

class GeneratePostRequest(BaseModel):
    topic: str
    context: Optional[str] = None

@router.get("/posts", response_model=List[LinkedInPostResponse])
async def list_posts(
    user_id: str = Depends(get_current_user),
    status: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    offset: int = Query(0, ge=0),
):
    posts = await db.get_linkedin_posts(user_id=user_id, status=status, limit=limit, offset=offset)
    return [LinkedInPostResponse(
        id=str(p["id"]),
        content=p["content"],
        status=p["status"],
        created_at=p["created_at"],
        scheduled_for=p.get("scheduled_for")
    ) for p in posts]

@router.post("/generate")
async def generate_post(
    request: GeneratePostRequest,
    user_id: str = Depends(get_current_user),
):
    # This just creates a draft for now
    # The actual AI generation would happen via the LinkedIn Agent mission
    content = f"Draft post about {request.topic}: {request.context or ''}"
    
    async with db.connection() as conn:
        post_id = await conn.fetchval(
            """
            INSERT INTO linkedin_posts (user_id, content, status)
            VALUES ($1, $2, $3)
            RETURNING id
            """,
            user_id, content, "draft"
        )
    
    return {"id": str(post_id), "content": content, "status": "draft"}
