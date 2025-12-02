"""
Auth API routes for AsherGO
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from database import query_one, execute_returning
from auth import (
    hash_password,
    verify_password,
    create_token,
    decode_token,
    get_trial_end_date
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# Request/Response Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    id: int
    email: str
    subscription_status: str
    trial_ends_at: Optional[str]
    created_at: str


# Dependency to get current user from token
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Extract and verify user from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    # Expect "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    token = parts[1]

    try:
        payload = decode_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    # Get user from database
    user = query_one(
        "SELECT id, email, first_name, subscription_status, trial_ends_at, created_at FROM users WHERE id = %s",
        (payload["user_id"],)
    )

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Check subscription status
    if user["subscription_status"] == "trial":
        if user["trial_ends_at"] and user["trial_ends_at"] < datetime.now():
            # Trial expired
            user["subscription_status"] = "expired"

    return user


@router.post("/signup")
async def signup(request: SignupRequest):
    """Create a new user account"""
    # Check if email already exists
    existing = query_one("SELECT id FROM users WHERE email = %s", (request.email,))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Validate password
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Create user
    password_hash = hash_password(request.password)
    trial_ends_at = get_trial_end_date()
    first_name = request.first_name.strip() if request.first_name else None

    user = execute_returning(
        """
        INSERT INTO users (email, password_hash, first_name, subscription_status, trial_ends_at)
        VALUES (%s, %s, %s, 'trial', %s)
        RETURNING id, email, first_name, subscription_status, trial_ends_at, created_at
        """,
        (request.email, password_hash, first_name, trial_ends_at)
    )

    # Create token
    token = create_token(user["id"], user["email"])

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "subscription_status": user["subscription_status"],
            "trial_ends_at": user["trial_ends_at"].isoformat() if user["trial_ends_at"] else None,
            "created_at": user["created_at"].isoformat() if user["created_at"] else None
        }
    }


@router.post("/login")
async def login(request: LoginRequest):
    """Login with email and password"""
    # Get user
    user = query_one(
        "SELECT id, email, first_name, password_hash, subscription_status, trial_ends_at, created_at FROM users WHERE email = %s",
        (request.email,)
    )

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verify password
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create token
    token = create_token(user["id"], user["email"])

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "subscription_status": user["subscription_status"],
            "trial_ends_at": user["trial_ends_at"].isoformat() if user["trial_ends_at"] else None,
            "created_at": user["created_at"].isoformat() if user["created_at"] else None
        }
    }


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    """Logout (with JWT this is mainly client-side, but confirms valid session)"""
    return {"success": True, "message": "Logged out"}


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user info and subscription status"""
    return {
        "id": user["id"],
        "email": user["email"],
        "first_name": user.get("first_name"),
        "subscription_status": user["subscription_status"],
        "trial_ends_at": user["trial_ends_at"].isoformat() if user["trial_ends_at"] else None,
        "created_at": user["created_at"].isoformat() if user["created_at"] else None
    }


class ApiKeysRequest(BaseModel):
    openai: Optional[str] = None
    anthropic: Optional[str] = None
    google: Optional[str] = None
    xai: Optional[str] = None


@router.get("/api-keys")
async def get_api_keys(user: dict = Depends(get_current_user)):
    """Get user's stored API keys (masked)"""
    result = query_one(
        "SELECT api_keys FROM users WHERE id = %s",
        (user["id"],)
    )

    api_keys = result["api_keys"] if result and result["api_keys"] else {}

    # Mask the keys for display (show first 4 and last 4 chars)
    def mask_key(key):
        if not key or len(key) < 12:
            return key
        return key[:4] + "..." + key[-4:]

    return {
        "openai": mask_key(api_keys.get("openai", "")),
        "anthropic": mask_key(api_keys.get("anthropic", "")),
        "google": mask_key(api_keys.get("google", "")),
        "xai": mask_key(api_keys.get("xai", "")),
        "has_openai": bool(api_keys.get("openai")),
        "has_anthropic": bool(api_keys.get("anthropic")),
        "has_google": bool(api_keys.get("google")),
        "has_xai": bool(api_keys.get("xai"))
    }


@router.put("/api-keys")
async def update_api_keys(request: ApiKeysRequest, user: dict = Depends(get_current_user)):
    """Update user's API keys"""
    import json

    # Get existing keys
    result = query_one(
        "SELECT api_keys FROM users WHERE id = %s",
        (user["id"],)
    )

    api_keys = result["api_keys"] if result and result["api_keys"] else {}

    # Update only provided keys (don't overwrite with None)
    if request.openai is not None:
        api_keys["openai"] = request.openai
    if request.anthropic is not None:
        api_keys["anthropic"] = request.anthropic
    if request.google is not None:
        api_keys["google"] = request.google
    if request.xai is not None:
        api_keys["xai"] = request.xai

    # Save to database
    from database import execute
    execute(
        "UPDATE users SET api_keys = %s WHERE id = %s",
        (json.dumps(api_keys), user["id"])
    )

    return {"success": True, "message": "API keys updated"}


class BetaTokenRequest(BaseModel):
    token: str


@router.post("/apply-beta-token")
async def apply_beta_token(request: BetaTokenRequest, user: dict = Depends(get_current_user)):
    """Apply beta token to copy API keys from master account"""
    import json
    from database import execute

    # Verify beta token
    if request.token != "ytresearch23":
        raise HTTPException(status_code=400, detail="Invalid beta token")

    # Get API keys from master account (elianajansick@gmail.com)
    master = query_one(
        "SELECT api_keys FROM users WHERE email = %s",
        ("elianajansick@gmail.com",)
    )

    if not master or not master["api_keys"]:
        raise HTTPException(status_code=500, detail="Master account not configured")

    # Copy API keys to user's account
    execute(
        "UPDATE users SET api_keys = %s WHERE id = %s",
        (json.dumps(master["api_keys"]), user["id"])
    )

    return {"success": True, "message": "Beta API keys applied successfully"}
