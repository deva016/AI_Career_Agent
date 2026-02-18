"""
Dashboard API Router

Endpoints for dashboard statistics and aggregated data.
"""

from fastapi import APIRouter, Depends
from core.database import db
from core.auth import get_current_user

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(user_id: str = Depends(get_current_user)):
    """
    Get aggregated statistics for the dashboard KPI strip.
    
    Returns real counts from jobs, applications, resumes, and missions.
    """
    stats = await db.get_dashboard_stats(user_id)
    return stats
