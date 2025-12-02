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
    """Call AI provider with user's API keys and selected model"""
    from openai import OpenAI
    import anthropic
    import google.generativeai as genai

    # Model mapping: friendly ID -> actual API model name
    # Synced with ai_providers.py for consistency
    MODEL_MAP = {
        # OpenAI - map to real available models
        "gpt-5.1": "gpt-4o",
        "gpt-5": "gpt-4o",
        "gpt-5-mini": "gpt-4o-mini",
        "gpt-4.1": "gpt-4-turbo",
        "gpt-4o": "gpt-4o",
        "o3": "o1-mini",  # o3 doesn't exist, use o1-mini
        "o4-mini": "o1-mini",
        # Claude - map to real available models
        "claude-sonnet-4.5": "claude-sonnet-4-5-20250929",
        "claude-haiku-4.5": "claude-3-5-haiku-20241022",
        "claude-opus-4.1": "claude-opus-4-1-20250805",
        "claude-opus-4": "claude-3-opus-20240229",
        "claude-sonnet-4": "claude-sonnet-4-20250514",
        "claude-3.5-sonnet": "claude-3-5-sonnet-20241022",
        "claude-3-opus": "claude-3-opus-20240229",
        "claude-3-haiku": "claude-3-haiku-20240307",
        # Gemini - map to real available models
        "gemini-2.5-pro": "gemini-2.5-pro",
        "gemini-2.5-flash": "gemini-2.5-flash",
        "gemini-2.0-flash": "gemini-2.0-flash-001",
        # Grok - map to real available models (grok-beta deprecated, use grok-3)
        "grok-4.1-fast": "grok-3",
        "grok-4": "grok-3",
        "grok-3": "grok-3",
        "grok-beta": "grok-3",
    }

    # Determine which provider and model to use
    # OpenAI models: gpt-*, o3, o4-mini, or provider_id == 'openai'
    if provider_id == 'openai' or provider_id.startswith('gpt') or provider_id.startswith('o3') or provider_id.startswith('o4'):
        api_key = api_keys.get('openai')
        if not api_key:
            raise Exception("OpenAI API key not configured. Add it in Settings.")

        client = OpenAI(api_key=api_key)
        openai_messages = []
        if system_prompt:
            openai_messages.append({"role": "system", "content": system_prompt})
        openai_messages.extend(messages)

        # Use selected model or default to gpt-4o, translate through MODEL_MAP
        selected_model = MODEL_MAP.get(model, model) if model else "gpt-4o"

        response = client.chat.completions.create(
            model=selected_model,
            messages=openai_messages
        )
        return response.choices[0].message.content

    elif provider_id == 'claude' or provider_id.startswith('claude'):
        api_key = api_keys.get('anthropic')
        if not api_key:
            raise Exception("Anthropic API key not configured. Add it in Settings.")

        # Use selected model or default, translate through MODEL_MAP
        selected_model = MODEL_MAP.get(model, model) if model else "claude-sonnet-4-20250514"

        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model=selected_model,
            max_tokens=4096,
            system=system_prompt if system_prompt else "You are a helpful AI assistant.",
            messages=messages
        )
        return response.content[0].text

    elif provider_id == 'gemini' or provider_id.startswith('gemini'):
        api_key = api_keys.get('google')
        if not api_key:
            raise Exception("Google API key not configured. Add it in Settings.")

        # Use selected model or default, translate through MODEL_MAP
        selected_model = MODEL_MAP.get(model, model) if model else "gemini-2.0-flash-exp"

        genai.configure(api_key=api_key)
        gemini_model = genai.GenerativeModel(selected_model)

        # Build chat history
        chat_history = []
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            chat_history.append({"role": role, "parts": [msg["content"]]})

        chat = gemini_model.start_chat(history=chat_history)
        current_message = messages[-1]["content"]
        if system_prompt:
            current_message = f"{system_prompt}\n\n{current_message}"

        response = chat.send_message(current_message)
        return response.text

    elif provider_id == 'grok' or provider_id.startswith('grok'):
        api_key = api_keys.get('xai')
        if not api_key:
            raise Exception("xAI API key not configured. Add it in Settings.")

        # Use selected model or default, translate through MODEL_MAP
        selected_model = MODEL_MAP.get(model, model) if model else "grok-2-latest"

        try:
            client = OpenAI(api_key=api_key, base_url="https://api.x.ai/v1")
            grok_messages = []
            if system_prompt:
                grok_messages.append({"role": "system", "content": system_prompt})
            grok_messages.extend(messages)

            response = client.chat.completions.create(
                model=selected_model,
                messages=grok_messages
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Grok error: {e}")
            raise Exception(f"Grok API error: {str(e)}")

    else:
        raise Exception(f"Unknown provider: {provider_id}")


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
                ORDER BY timestamp ASC
                """,
                (conversation_id,)
            )
            all_messages = cur.fetchall()

    # Filter history: include user messages and only this provider's assistant messages
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

    history = []
    for m in all_messages:
        if m["role"] == "user":
            history.append({"role": "user", "content": m["content"]})
        elif m["role"] == "assistant" and is_provider_message(m["model"], request.provider):
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
