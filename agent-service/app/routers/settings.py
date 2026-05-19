"""
Settings API Router
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict
from pydantic import BaseModel
from core.database import db
from core.auth import get_current_user

router = APIRouter()

class UserSettingsUpdate(BaseModel):
    target_roles: Optional[List[str]] = None
    target_locations: Optional[List[str]] = None
    knowledge_base: Optional[Dict] = None
    # Add other fields if needed to match frontend
    name: Optional[str] = None

@router.get("")
async def get_settings(user_id: str = Depends(get_current_user)):
    """Get current user settings."""
    settings = await db.get_user_settings(user_id)
    user = await db.get_user(user_id)
    
    # Merge user data (name, email) with settings
    resp = {
        "user_id": user_id,
        "name": user["name"] if user else "",
        "email": user["email"] if user else "",
        "target_roles": [],
        "target_locations": [],
        "knowledge_base": {},
        **(settings if settings else {})
    }
    return resp

@router.patch("")
async def update_settings(payload: UserSettingsUpdate, user_id: str = Depends(get_current_user)):
    """Update user settings."""
    # Update profile name if provided
    if payload.name:
        await db.update_user_name(user_id, payload.name)

    # Update settings
    success = await db.upsert_user_settings(
        user_id=user_id,
        target_roles=payload.target_roles,
        target_locations=payload.target_locations,
        knowledge_base=payload.knowledge_base
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update settings")
        
    return {"status": "success", "message": "Settings updated"}

@router.post("/kb")
async def update_kb(payload: Dict, user_id: str = Depends(get_current_user)):
    """Specific endpoint for knowledge base updates."""
    success = await db.upsert_user_settings(
        user_id=user_id,
        knowledge_base=payload
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update Knowledge Base")
        
    return {"status": "success", "message": "Knowledge Base updated"}
