"""
Message API routes for AsherGO
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
import os

from database import query_one, execute_returning, get_db
from routes_auth import get_current_user
from psycopg2.extras import RealDictCursor
from ai_providers import AIProviderManager

router = APIRouter(prefix="/api/conversations", tags=["messages"])


class SendMessageRequest(BaseModel):
    message: str
    provider: str
    system_prompt: str = ""
    model: Optional[str] = None
    skip_user_message: bool = False  # Skip saving user message (for batch requests)


class MessageResponse(BaseModel):
    user_message: dict
    assistant_message: dict


def call_ai_provider(provider_id: str, messages: List[Dict], system_prompt: str, api_keys: dict, model: str = None) -> str:
    """
    Call AI provider with user's API keys and selected model.
    This is a thin wrapper around AIProviderManager.chat() for backward compatibility.
    """
    return AIProviderManager.chat(
        provider_id=provider_id,
        messages=messages,
        system_prompt=system_prompt,
        api_keys=api_keys,
        model=model
    )


@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    request: SendMessageRequest,
    user: dict = Depends(get_current_user)
):
    """Send a message in a conversation, get AI response, save both"""

    # Check conversation ownership
    conversation = query_one(
        "SELECT id FROM conversations WHERE id = %s AND user_id = %s",
        (conversation_id, user["id"])
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get user's API keys
    user_data = query_one(
        "SELECT api_keys FROM users WHERE id = %s",
        (user["id"],)
    )
    api_keys = user_data["api_keys"] if user_data and user_data["api_keys"] else {}

    # Get existing messages for context - filter to only this provider's messages
    # Each provider should only see user messages and its own previous responses
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT role, content, model
                FROM messages
                WHERE conversation_id = %s
                ORDER BY id ASC
                """,
                (conversation_id,)
            )
            all_messages = cur.fetchall()

    # Filter history: only include user messages that this provider responded to
    # This ensures a provider doesn't see messages sent while it was disabled
    def is_provider_message(model, provider_id):
        """Check if a model string matches the provider"""
        if not model:
            return False
        model_lower = model.lower()
        # OpenAI models: gpt-*, o3, o4-mini
        if provider_id == 'openai' or provider_id.startswith('gpt') or provider_id.startswith('o3') or provider_id.startswith('o4'):
            return 'gpt' in model_lower or model_lower.startswith('o3') or model_lower.startswith('o4') or 'openai' in model_lower
        elif provider_id == 'claude' or provider_id.startswith('claude'):
            return 'claude' in model_lower
        elif provider_id == 'gemini' or provider_id.startswith('gemini'):
            return 'gemini' in model_lower
        elif provider_id == 'grok' or provider_id.startswith('grok'):
            return 'grok' in model_lower
        return False

    # Build history: only include user messages that have a response from this provider
    # This way, if a provider was disabled for a message, it won't see that message later
    history = []
    current_user_msg = None
    for m in all_messages:
        if m["role"] == "user":
            current_user_msg = m["content"]
        elif m["role"] == "assistant" and is_provider_message(m["model"], request.provider):
            # This provider responded, so include the user message and response
            if current_user_msg:
                history.append({"role": "user", "content": current_user_msg})
                current_user_msg = None  # Only add once per user message
            history.append({"role": "assistant", "content": m["content"]})

    # Build messages for AI
    messages = history + [{"role": "user", "content": request.message}]

    # Call AI provider with user's keys and selected model
    try:
        reply = call_ai_provider(
            provider_id=request.provider,
            messages=messages,
            system_prompt=request.system_prompt,
            api_keys=api_keys,
            model=request.model
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI provider error: {str(e)}")

    # Save messages to database
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            user_msg = None

            # Only save user message if not skipping (for batch requests, first call saves it)
            if not request.skip_user_message:
                cur.execute(
                    """
                    INSERT INTO messages (conversation_id, role, content, model)
                    VALUES (%s, 'user', %s, NULL)
                    RETURNING id, role, content, model, timestamp
                    """,
                    (conversation_id, request.message)
                )
                user_msg = cur.fetchone()

            # Save assistant message with actual model used
            model_used = request.model if request.model else request.provider
            cur.execute(
                """
                INSERT INTO messages (conversation_id, role, content, model)
                VALUES (%s, 'assistant', %s, %s)
                RETURNING id, role, content, model, timestamp
                """,
                (conversation_id, reply, model_used)
            )
            assistant_msg = cur.fetchone()

            # Update conversation updated_at
            cur.execute(
                "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (conversation_id,)
            )

            conn.commit()

    return {
        "user_message": {
            "id": user_msg["id"] if user_msg else None,
            "role": user_msg["role"] if user_msg else "user",
            "content": user_msg["content"] if user_msg else request.message,
            "model": user_msg["model"] if user_msg else None,
            "timestamp": user_msg["timestamp"].isoformat() if user_msg and user_msg["timestamp"] else None
        } if user_msg else None,
        "assistant_message": {
            "id": assistant_msg["id"],
            "role": assistant_msg["role"],
            "content": assistant_msg["content"],
            "model": assistant_msg["model"],
            "timestamp": assistant_msg["timestamp"].isoformat() if assistant_msg["timestamp"] else None
        }
    }
