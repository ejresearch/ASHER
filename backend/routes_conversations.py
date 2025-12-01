"""
Conversation API routes for AsherGO
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database import query_one, execute_returning, execute
from routes_auth import get_current_user

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


# Request/Response Models
class CreateConversationRequest(BaseModel):
    title: str
    system_prompt: Optional[str] = ""
    documents: Optional[List[dict]] = []


class RenameConversationRequest(BaseModel):
    title: str


class UpdateConversationRequest(BaseModel):
    title: Optional[str] = None
    system_prompt: Optional[str] = None
    documents: Optional[List[dict]] = None
    provider_settings: Optional[dict] = None


class ConversationSummary(BaseModel):
    id: int
    title: str
    created_at: str
    updated_at: str


class Message(BaseModel):
    id: int
    role: str
    content: str
    model: Optional[str]
    timestamp: str


class ConversationDetail(BaseModel):
    id: int
    title: str
    created_at: str
    updated_at: str
    messages: List[Message]


@router.get("")
async def list_conversations(user: dict = Depends(get_current_user)):
    """List all conversations for the current user"""
    from database import get_db
    from psycopg2.extras import RealDictCursor

    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, title, created_at, updated_at
                FROM conversations
                WHERE user_id = %s
                ORDER BY updated_at DESC
                """,
                (user["id"],)
            )
            conversations = cur.fetchall()

    return {
        "conversations": [
            {
                "id": c["id"],
                "title": c["title"],
                "created_at": c["created_at"].isoformat() if c["created_at"] else None,
                "updated_at": c["updated_at"].isoformat() if c["updated_at"] else None
            }
            for c in conversations
        ]
    }


@router.post("")
async def create_conversation(request: CreateConversationRequest, user: dict = Depends(get_current_user)):
    """Create a new conversation"""
    import json

    if not request.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")

    conversation = execute_returning(
        """
        INSERT INTO conversations (user_id, title, system_prompt, documents)
        VALUES (%s, %s, %s, %s)
        RETURNING id, title, system_prompt, documents, created_at, updated_at
        """,
        (user["id"], request.title.strip(), request.system_prompt or "", json.dumps(request.documents or []))
    )

    return {
        "id": conversation["id"],
        "title": conversation["title"],
        "system_prompt": conversation["system_prompt"] or "",
        "documents": conversation["documents"] or [],
        "created_at": conversation["created_at"].isoformat() if conversation["created_at"] else None,
        "updated_at": conversation["updated_at"].isoformat() if conversation["updated_at"] else None
    }


@router.get("/{conversation_id}")
async def get_conversation(conversation_id: int, user: dict = Depends(get_current_user)):
    """Get a single conversation with all messages"""
    from database import get_db
    from psycopg2.extras import RealDictCursor

    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get conversation
            cur.execute(
                """
                SELECT id, title, system_prompt, documents, provider_settings, created_at, updated_at
                FROM conversations
                WHERE id = %s AND user_id = %s
                """,
                (conversation_id, user["id"])
            )
            conversation = cur.fetchone()

            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")

            # Get messages
            cur.execute(
                """
                SELECT id, role, content, model, timestamp
                FROM messages
                WHERE conversation_id = %s
                ORDER BY timestamp ASC
                """,
                (conversation_id,)
            )
            messages = cur.fetchall()

    return {
        "id": conversation["id"],
        "title": conversation["title"],
        "system_prompt": conversation["system_prompt"] or "",
        "documents": conversation["documents"] or [],
        "provider_settings": conversation["provider_settings"] or {},
        "created_at": conversation["created_at"].isoformat() if conversation["created_at"] else None,
        "updated_at": conversation["updated_at"].isoformat() if conversation["updated_at"] else None,
        "messages": [
            {
                "id": m["id"],
                "role": m["role"],
                "content": m["content"],
                "model": m["model"],
                "timestamp": m["timestamp"].isoformat() if m["timestamp"] else None
            }
            for m in messages
        ]
    }


@router.patch("/{conversation_id}")
async def update_conversation(
    conversation_id: int,
    request: UpdateConversationRequest,
    user: dict = Depends(get_current_user)
):
    """Update a conversation (title, system_prompt, documents)"""
    import json

    # Check ownership
    conversation = query_one(
        "SELECT id FROM conversations WHERE id = %s AND user_id = %s",
        (conversation_id, user["id"])
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Build dynamic update query
    updates = []
    params = []

    if request.title is not None:
        if not request.title.strip():
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        updates.append("title = %s")
        params.append(request.title.strip())

    if request.system_prompt is not None:
        updates.append("system_prompt = %s")
        params.append(request.system_prompt)

    if request.documents is not None:
        updates.append("documents = %s")
        params.append(json.dumps(request.documents))

    if request.provider_settings is not None:
        updates.append("provider_settings = %s")
        params.append(json.dumps(request.provider_settings))

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(conversation_id)

    updated = execute_returning(
        f"""
        UPDATE conversations
        SET {', '.join(updates)}
        WHERE id = %s
        RETURNING id, title, system_prompt, documents, provider_settings, created_at, updated_at
        """,
        tuple(params)
    )

    return {
        "id": updated["id"],
        "title": updated["title"],
        "system_prompt": updated["system_prompt"] or "",
        "documents": updated["documents"] or [],
        "provider_settings": updated["provider_settings"] or {},
        "created_at": updated["created_at"].isoformat() if updated["created_at"] else None,
        "updated_at": updated["updated_at"].isoformat() if updated["updated_at"] else None
    }


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: int, user: dict = Depends(get_current_user)):
    """Delete a conversation and all its messages"""
    # Check ownership
    conversation = query_one(
        "SELECT id, title FROM conversations WHERE id = %s AND user_id = %s",
        (conversation_id, user["id"])
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Delete (messages cascade automatically due to ON DELETE CASCADE)
    execute("DELETE FROM conversations WHERE id = %s", (conversation_id,))

    return {
        "success": True,
        "message": f"Conversation '{conversation['title']}' deleted"
    }
