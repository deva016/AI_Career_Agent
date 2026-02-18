"""
Authentication utilities for the agent service.
"""

from fastapi import Header, HTTPException
from typing import Optional


async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email")
) -> str:
    """
    Extract user_id from headers.
    
    Checks Authorization header first, then falls back to X-User-Email.
    Used for NextAuth integration.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        if token:
            return token
            
    if x_user_email:
        return x_user_email
        
    # Development fallback
    return "demo-user"


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
