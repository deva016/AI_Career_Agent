"""
Insights API Router
"""

from fastapi import APIRouter, Depends
from typing import Dict, Any

from core.database import db
from core.auth import get_current_user

router = APIRouter()

@router.get("")
async def get_insights(user_id: str = Depends(get_current_user)):
    """Get aggregated insights for the dashboard."""
    insights = await db.get_insights(user_id=user_id)
    return insights
