from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import logging

from core.database import db
from core.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

class LinkedInPostResponse(BaseModel):
    id: str
    content: str
    status: str
    created_at: datetime
    scheduled_for: Optional[datetime] = None

class LinkedInPostListResponse(BaseModel):
    posts: List[LinkedInPostResponse]
    total: int
    offset: int
    limit: int

class GeneratePostRequest(BaseModel):
    topic: str
    context: Optional[str] = None

@router.get("/posts", response_model=LinkedInPostListResponse)
async def list_posts(
    user_id: str = Depends(get_current_user),
    status: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    offset: int = Query(0, ge=0),
):
    posts = await db.get_linkedin_posts(user_id=user_id, status=status, limit=limit, offset=offset)
    total = await db.get_table_count("linkedin_posts", user_id, status)
    
    return LinkedInPostListResponse(
        posts=[LinkedInPostResponse(
            id=str(p["id"]),
            content=p["content"],
            status=p["status"],
            created_at=p["created_at"],
            scheduled_for=p.get("scheduled_for")
        ) for p in posts],
        total=total,
        offset=offset,
        limit=limit
    )

@router.post("/generate")
async def generate_post(
    request: GeneratePostRequest,
    user_id: str = Depends(get_current_user),
):
    from core.llm import LLMClient
    
    llm = LLMClient()
    
    # Build the LinkedIn post generation prompt
    prompt_messages = [
        {
            "role": "system",
            "content": (
                "You are a professional LinkedIn content strategist. "
                "Write compelling, authentic LinkedIn posts that drive engagement. "
                "Use a professional yet human tone. Add relevant emojis sparingly. "
                "Structure the post with a hook, body, and a call-to-action or insight. "
                "Keep it under 1300 characters. Do NOT include any hashtags — they will be added separately. "
                "Output ONLY the post text, nothing else."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Write a LinkedIn post about: {request.topic}\n"
                + (f"\nAdditional context to include: {request.context}" if request.context else "")
            ),
        },
    ]
    
    content = await llm.chat(prompt_messages, temperature=0.75, max_tokens=600)
    
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

@router.post("/publish")
async def publish_post(
    post_id: str,
    content: Optional[str] = None,
    scheduled_for: Optional[datetime] = None,
    user_id: str = Depends(get_current_user)
):
    """Mark a LinkedIn post as published or schedule it."""
    # Simulation: Realistic network delay for API communication
    import asyncio
    logger.info(f"Initiating LinkedIn publishing for post {post_id}")
    await asyncio.sleep(1.5) # Simulate API roundtrip
    
    status = "published" if not scheduled_for else "scheduled"
    
    async with db.connection() as conn:
        res = await conn.execute(
            """
            UPDATE linkedin_posts 
            SET content = COALESCE($1, content), status = $2, scheduled_for = $3, published_at = $4
            WHERE id = $5 AND user_id = $6
            """,
            content, status, scheduled_for, (datetime.now() if not scheduled_for else None),
            uuid.UUID(post_id), user_id
        )
        if res == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Post not found")
        
    logger.info(f"LinkedIn post {post_id} successfully {status}")
    return {"id": post_id, "status": status, "success": True}
