"""
Authentication utilities for the agent service.
"""

from fastapi import Header, HTTPException
from typing import Optional


async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract user_id from Authorization header.
    
    In production, this should validate JWT tokens from NextAuth.
    For now, we'll extract from a simple Bearer token or default to demo-user.
    
    Args:
        authorization: Authorization header (Bearer <token>)
        
    Returns:
        user_id string
        
    Raises:
        HTTPException: If auth is required but missing
    """
    # TODO: Integrate with NextAuth JWT validation
    # For now, simple implementation
    
    if not authorization:
        # Development: allow demo user
        return "demo-user"
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization[7:]  # Remove "Bearer "
    
    # TODO: Decode and validate JWT
    # For now, just use the token as user_id
    # In production, decode JWT and extract user_id from payload
    
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    
    return token  # In production: return user_id from JWT payload


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
