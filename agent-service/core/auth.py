"""
Authentication utilities for the agent service.
"""

import logging
from fastapi import Header, HTTPException
from typing import Optional
from core.config import get_settings

logger = logging.getLogger(__name__)


async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email")
) -> str:
    """
    Extract user_id from headers.
    
    Checks Authorization header first, then falls back to X-User-Email.
    In debug mode, allows a "demo-user" fallback for local development.
    In production (DEBUG_MODE=false), raises 401 if no auth is provided.
    """
    user_identifier = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        if token:
            user_identifier = token
            
    if not user_identifier and x_user_email:
        user_identifier = x_user_email
    
    if user_identifier:
        # Transparently convert email to UUID to prevent Postgres DataError across all endpoints
        if "@" in user_identifier:
            from core.database import db
            user = await db.get_user(user_identifier)
            if user:
                return str(user["id"])
            else:
                raise HTTPException(
                    status_code=401,
                    detail="User not found in database. Please log in again to sync."
                )
        return user_identifier
    
    raise HTTPException(
        status_code=401,
        detail="Authentication required. Provide Authorization or X-User-Email header."
    )


def verify_user_owns_resource(user_id: str, resource_user_id: str) -> None:
    """
    Verify that a user owns a resource.
    
    Args:
        user_id: Current user's ID
        resource_user_id: Resource owner's ID
        
    Raises:
        HTTPException: If user doesn't own the resource
    """
    if user_id != resource_user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource"
        )
