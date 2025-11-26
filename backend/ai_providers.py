"""
Multi-Provider AI Service for ASHER
Supports: OpenAI, Anthropic Claude, Google Gemini, xAI Grok
"""

import os
from typing import List, Dict, Optional
from openai import OpenAI
import anthropic
import google.generativeai as genai


class AIProvider:
    """Base class for AI providers"""

    def __init__(self):
        self.available = False
        self.error = None

    def chat(self, messages: List[Dict], system_prompt: str = "") -> str:
        raise NotImplementedError


class OpenAIProvider(AIProvider):
    """OpenAI GPT-4 / GPT-3.5 Provider"""

    def __init__(self, model: str = "gpt-4"):
        super().__init__()
        self.model = model
        api_key = os.getenv("OPENAI_API_KEY")

        if api_key and not api_key.startswith("your-"):
            try:
                self.client = OpenAI(api_key=api_key)
                self.available = True
            except Exception as e:
                self.error = str(e)
        else:
            self.error = "OPENAI_API_KEY not configured"

    def chat(self, messages: List[Dict], system_prompt: str = "") -> str:
        if not self.available:
            raise Exception(f"OpenAI not available: {self.error}")

        # Format messages for OpenAI
        openai_messages = []
        if system_prompt:
            openai_messages.append({"role": "system", "content": system_prompt})

        openai_messages.extend(messages)

        response = self.client.chat.completions.create(
            model=self.model,
            messages=openai_messages
        )

        return response.choices[0].message.content


class ClaudeProvider(AIProvider):
    """Anthropic Claude Provider"""

    def __init__(self, model: str = "claude-3-5-sonnet-20241022"):
        super().__init__()
        self.model = model
        api_key = os.getenv("ANTHROPIC_API_KEY")

        if api_key and not api_key.startswith("your-"):
            try:
                self.client = anthropic.Anthropic(api_key=api_key)
                self.available = True
            except Exception as e:
                self.error = str(e)
        else:
            self.error = "ANTHROPIC_API_KEY not configured"

    def chat(self, messages: List[Dict], system_prompt: str = "") -> str:
        if not self.available:
            raise Exception(f"Claude not available: {self.error}")

        # Claude format: separate system prompt from messages
        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system_prompt if system_prompt else "You are a helpful AI assistant.",
            messages=messages
        )

        return response.content[0].text


class GeminiProvider(AIProvider):
    """Google Gemini Provider"""

    def __init__(self, model: str = "gemini-1.5-flash"):
        super().__init__()
        self.model = model
        api_key = os.getenv("GOOGLE_API_KEY")

        if api_key and not api_key.startswith("your-"):
            try:
                genai.configure(api_key=api_key)
                self.client = genai.GenerativeModel(model)
                self.available = True
            except Exception as e:
                self.error = str(e)
        else:
            self.error = "GOOGLE_API_KEY not configured"

    def chat(self, messages: List[Dict], system_prompt: str = "") -> str:
        if not self.available:
            raise Exception(f"Gemini not available: {self.error}")

        # Format for Gemini
        chat_history = []
        current_message = ""

        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            if msg["role"] == "system":
                # Gemini doesn't have system role, prepend to first user message
                continue
            chat_history.append({
                "role": role,
                "parts": [msg["content"]]
            })

        # Get last user message
        if messages:
            current_message = messages[-1]["content"]
            chat_history = chat_history[:-1]  # Remove last message from history

        # Start chat with history
        chat = self.client.start_chat(history=chat_history)

        # Add system prompt to first message if exists
        if system_prompt and current_message:
            current_message = f"{system_prompt}\n\n{current_message}"

        response = chat.send_message(current_message)
        return response.text


class GrokProvider(AIProvider):
    """xAI Grok Provider (OpenAI-compatible API)"""

    def __init__(self, model: str = "grok-beta"):
        super().__init__()
        self.model = model
        api_key = os.getenv("XAI_API_KEY")

        if api_key and not api_key.startswith("your-"):
            try:
                # Grok uses OpenAI-compatible API
                self.client = OpenAI(
                    api_key=api_key,
                    base_url="https://api.x.ai/v1"
                )
                self.available = True
            except Exception as e:
                self.error = str(e)
        else:
            self.error = "XAI_API_KEY not configured"

    def chat(self, messages: List[Dict], system_prompt: str = "") -> str:
        if not self.available:
            raise Exception(f"Grok not available: {self.error}")

        # Format messages for Grok (OpenAI-compatible)
        grok_messages = []
        if system_prompt:
            grok_messages.append({"role": "system", "content": system_prompt})

        grok_messages.extend(messages)

        response = self.client.chat.completions.create(
            model=self.model,
            messages=grok_messages
        )

        return response.choices[0].message.content


class AIProviderManager:
    """Manages multiple AI providers"""

    PROVIDERS = {
        # OpenAI - Latest Models (Nov 2025)
        "openai-gpt5.1": {"class": OpenAIProvider, "model": "gpt-5.1", "name": "OpenAI GPT-5.1"},
        "openai-gpt5": {"class": OpenAIProvider, "model": "gpt-5", "name": "OpenAI GPT-5"},
        "openai-gpt5-mini": {"class": OpenAIProvider, "model": "gpt-5-mini", "name": "OpenAI GPT-5 Mini"},
        "openai-gpt4.1": {"class": OpenAIProvider, "model": "gpt-4.1", "name": "OpenAI GPT-4.1"},
        "openai-gpt4o": {"class": OpenAIProvider, "model": "gpt-4o", "name": "OpenAI GPT-4o"},
        "openai-o3": {"class": OpenAIProvider, "model": "o3", "name": "OpenAI o3"},
        "openai-o4-mini": {"class": OpenAIProvider, "model": "o4-mini", "name": "OpenAI o4-mini"},

        # Anthropic Claude - Latest Models (Nov 2025)
        "claude-sonnet-4.5": {"class": ClaudeProvider, "model": "claude-sonnet-4-5-20250929", "name": "Claude Sonnet 4.5"},
        "claude-opus-4.1": {"class": ClaudeProvider, "model": "claude-opus-4-1-20250805", "name": "Claude Opus 4.1"},
        "claude-sonnet-4": {"class": ClaudeProvider, "model": "claude-sonnet-4-20250514", "name": "Claude Sonnet 4"},

        # Google Gemini - Latest Models (Nov 2025)
        "gemini-2.5-pro": {"class": GeminiProvider, "model": "gemini-2.5-pro", "name": "Gemini 2.5 Pro"},
        "gemini-2.5-flash": {"class": GeminiProvider, "model": "gemini-2.5-flash", "name": "Gemini 2.5 Flash"},
        "gemini-2.0-flash": {"class": GeminiProvider, "model": "gemini-2.0-flash-001", "name": "Gemini 2.0 Flash"},

        # xAI Grok - Latest Models (Nov 2025)
        "grok-4-1-fast": {"class": GrokProvider, "model": "grok-4-1-fast-reasoning", "name": "xAI Grok 4.1 Fast"},
        "grok-4": {"class": GrokProvider, "model": "grok-4", "name": "xAI Grok 4"},
        "grok-3": {"class": GrokProvider, "model": "grok-3", "name": "xAI Grok 3"},
        "grok-beta": {"class": GrokProvider, "model": "grok-beta", "name": "xAI Grok Beta"},
    }

    @classmethod
    def get_provider(cls, provider_id: str) -> AIProvider:
        """Get an AI provider instance"""
        if provider_id not in cls.PROVIDERS:
            raise ValueError(f"Unknown provider: {provider_id}")

        config = cls.PROVIDERS[provider_id]
        return config["class"](model=config["model"])

    @classmethod
    def list_providers(cls) -> List[Dict]:
        """List all available providers and their status"""
        providers = []
        for provider_id, config in cls.PROVIDERS.items():
            provider = cls.get_provider(provider_id)
            providers.append({
                "id": provider_id,
                "name": config["name"],
                "model": config["model"],
                "available": provider.available,
                "error": provider.error
            })
        return providers

    @classmethod
    def chat(cls, provider_id: str, messages: List[Dict], system_prompt: str = "") -> str:
        """Send chat request to specified provider"""
        provider = cls.get_provider(provider_id)
        return provider.chat(messages, system_prompt)
