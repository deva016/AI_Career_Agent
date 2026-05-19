"""
Artifacts API Router
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from core.database import db
from core.auth import get_current_user

router = APIRouter()

from uuid import UUID

class ArtifactResponse(BaseModel):
    id: str | UUID
    user_id: str
    type: str
    file_url: str
    name: str
    content: Optional[str] = None
    related_job_id: Optional[str | UUID] = None
    mission_id: Optional[str] = None
    created_at: datetime

@router.get("", response_model=List[ArtifactResponse])
async def list_artifacts(
    job_id: Optional[str] = None,
    mission_id: Optional[str] = None,
    type: Optional[str] = Query(None, alias="type"),
    user_id: str = Depends(get_current_user)
):
    """List all artifacts for the user with optional filters."""
    artifacts = await db.get_artifacts(
        user_id=user_id,
        job_id=job_id,
        mission_id=mission_id,
        artifact_type=type,
    )
    return [ArtifactResponse(**{**a, "id": str(a["id"]), "related_job_id": str(a["related_job_id"]) if a.get("related_job_id") else None}) for a in artifacts]

@router.get("/{artifact_id}", response_model=ArtifactResponse)
async def get_artifact(
    artifact_id: str,
    user_id: str = Depends(get_current_user)
):
    """Get a specific artifact."""
    artifact = await db.get_artifact(artifact_id=artifact_id, user_id=user_id)
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return ArtifactResponse(**{**artifact, "id": str(artifact["id"]), "related_job_id": str(artifact["related_job_id"]) if artifact.get("related_job_id") else None})

@router.delete("/{artifact_id}")
async def delete_artifact(
    artifact_id: str,
    user_id: str = Depends(get_current_user)
):
    """Delete a specific artifact."""
    artifact = await db.get_artifact(artifact_id=artifact_id, user_id=user_id)
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    async with db.connection() as conn:
        await conn.execute(
            "DELETE FROM artifacts WHERE id = $1 AND user_id = $2",
            artifact_id, user_id
        )
    return {"status": "deleted"}

