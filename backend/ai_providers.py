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

    def __init__(self, model: str = "gpt-4", api_key: str = None):
        super().__init__()
        self.model = model
        # Use provided API key or fall back to environment variable
        api_key = api_key or os.getenv("OPENAI_API_KEY")

        if api_key and not api_key.startswith("your-"):
            try:
                self.client = OpenAI(api_key=api_key)
                self.available = True
            except Exception as e:
                self.error = str(e)
        else:
            self.error = "OpenAI API key not configured. Add it in Settings."

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

    def __init__(self, model: str = "claude-3-5-sonnet-20241022", api_key: str = None):
        super().__init__()
        self.model = model
        # Use provided API key or fall back to environment variable
        api_key = api_key or os.getenv("ANTHROPIC_API_KEY")

        if api_key and not api_key.startswith("your-"):
            try:
                self.client = anthropic.Anthropic(api_key=api_key)
                self.available = True
            except Exception as e:
                self.error = str(e)
        else:
            self.error = "Anthropic API key not configured. Add it in Settings."

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

    def __init__(self, model: str = "gemini-1.5-flash", api_key: str = None):
        super().__init__()
        self.model = model
        # Use provided API key or fall back to environment variable
        api_key = api_key or os.getenv("GOOGLE_API_KEY")

        if api_key and not api_key.startswith("your-"):
            try:
                genai.configure(api_key=api_key)
                self.client = genai.GenerativeModel(model)
                self.available = True
            except Exception as e:
                self.error = str(e)
        else:
            self.error = "Google API key not configured. Add it in Settings."

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

    def __init__(self, model: str = "grok-3", api_key: str = None):
        super().__init__()
        self.model = model
        # Use provided API key or fall back to environment variable
        api_key = api_key or os.getenv("XAI_API_KEY")

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
            self.error = "xAI API key not configured. Add it in Settings."

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

    # Unified model mapping: friendly ID -> actual API model name
    # This is the SINGLE SOURCE OF TRUTH for all model mappings
    # Updated December 2025 with latest models
    MODEL_MAP = {
        # OpenAI - Latest models (Dec 2025)
        # GPT-5 series released Aug 2025, GPT-5.1 released Nov 2025
        "gpt-5.1": "gpt-5.1",              # Latest flagship (Nov 2025)
        "gpt-5.1-thinking": "gpt-5.1",     # Thinking mode
        "gpt-5": "gpt-5",                  # Released Aug 2025
        "gpt-5-pro": "gpt-5-pro",          # Extended reasoning
        "gpt-5-mini": "gpt-5-mini",        # Smaller/faster
        "gpt-4o": "gpt-4o",                # Still available
        "gpt-4-turbo": "gpt-4-turbo",      # Legacy
        "o3": "o3",                        # Reasoning model (now available)
        "o4-mini": "o4-mini",              # Reasoning model (now available)
        # Claude - Latest models (Dec 2025)
        # Opus 4.5 released Nov 24, 2025
        "claude-opus-4.5": "claude-opus-4-5-20251101",    # Latest (Nov 2025)
        "claude-sonnet-4.5": "claude-sonnet-4-5-20250929",
        "claude-haiku-4.5": "claude-3-5-haiku-20251015",  # Oct 2025
        "claude-opus-4.1": "claude-opus-4-1-20250805",
        "claude-sonnet-4": "claude-sonnet-4-20250514",
        "claude-3.5-sonnet": "claude-3-5-sonnet-20241022",
        "claude-3-opus": "claude-3-opus-20240229",
        "claude-3-haiku": "claude-3-haiku-20240307",
        # Gemini - Latest models (Dec 2025)
        # Based on API query - actual available models
        "gemini-3-pro": "gemini-3-pro-preview",     # Preview (Nov 2025)
        "gemini-3-deep-think": "gemini-3-pro-preview",
        "gemini-2.5-pro": "gemini-2.5-pro",
        "gemini-2.5-flash": "gemini-2.5-flash",
        "gemini-2.0-flash": "gemini-2.0-flash",
        # Grok - Latest models (Dec 2025)
        # Based on API query - actual available models
        "grok-4.1": "grok-4-1-fast-reasoning",      # Latest reasoning model
        "grok-4.1-thinking": "grok-4-1-fast-reasoning",
        "grok-4.1-fast": "grok-4-1-fast-non-reasoning",
        "grok-4": "grok-4-0709",
        "grok-3": "grok-3",
    }

    PROVIDERS = {
        # OpenAI - Latest Models (Dec 2025)
        # GPT-5.1 is the latest flagship model
        "openai-gpt5.1": {"class": OpenAIProvider, "model": "gpt-5.1", "name": "OpenAI GPT-5.1", "key_name": "openai"},
        "openai-gpt5.1-thinking": {"class": OpenAIProvider, "model": "gpt-5.1", "name": "OpenAI GPT-5.1 Thinking", "key_name": "openai"},
        "openai-gpt5": {"class": OpenAIProvider, "model": "gpt-5", "name": "OpenAI GPT-5", "key_name": "openai"},
        "openai-gpt5-pro": {"class": OpenAIProvider, "model": "gpt-5-pro", "name": "OpenAI GPT-5 Pro", "key_name": "openai"},
        "openai-gpt5-mini": {"class": OpenAIProvider, "model": "gpt-5-mini", "name": "OpenAI GPT-5 Mini", "key_name": "openai"},
        "openai-gpt4o": {"class": OpenAIProvider, "model": "gpt-4o", "name": "OpenAI GPT-4o", "key_name": "openai"},
        "openai-gpt4-turbo": {"class": OpenAIProvider, "model": "gpt-4-turbo", "name": "OpenAI GPT-4 Turbo", "key_name": "openai"},
        "openai-o3": {"class": OpenAIProvider, "model": "o3", "name": "OpenAI o3", "key_name": "openai"},
        "openai-o4-mini": {"class": OpenAIProvider, "model": "o4-mini", "name": "OpenAI o4-mini", "key_name": "openai"},
        # Generic openai provider - defaults to latest
        "openai": {"class": OpenAIProvider, "model": "gpt-5.1", "name": "OpenAI", "key_name": "openai"},

        # Anthropic Claude - Latest Models (Dec 2025)
        # Opus 4.5 is the latest and most capable
        "claude-opus-4.5": {"class": ClaudeProvider, "model": "claude-opus-4-5-20251101", "name": "Claude Opus 4.5", "key_name": "anthropic"},
        "claude-sonnet-4.5": {"class": ClaudeProvider, "model": "claude-sonnet-4-5-20250929", "name": "Claude Sonnet 4.5", "key_name": "anthropic"},
        "claude-haiku-4.5": {"class": ClaudeProvider, "model": "claude-3-5-haiku-20251015", "name": "Claude Haiku 4.5", "key_name": "anthropic"},
        "claude-opus-4.1": {"class": ClaudeProvider, "model": "claude-opus-4-1-20250805", "name": "Claude Opus 4.1", "key_name": "anthropic"},
        "claude-sonnet-4": {"class": ClaudeProvider, "model": "claude-sonnet-4-20250514", "name": "Claude Sonnet 4", "key_name": "anthropic"},
        # Generic claude provider - defaults to latest sonnet
        "claude": {"class": ClaudeProvider, "model": "claude-sonnet-4-5-20250929", "name": "Claude", "key_name": "anthropic"},

        # Google Gemini - Latest Models (Dec 2025)
        # Based on API query - actual available models
        "gemini-3-pro": {"class": GeminiProvider, "model": "gemini-3-pro-preview", "name": "Gemini 3 Pro (Preview)", "key_name": "google"},
        "gemini-3-deep-think": {"class": GeminiProvider, "model": "gemini-3-pro-preview", "name": "Gemini 3 Deep Think", "key_name": "google"},
        "gemini-2.5-pro": {"class": GeminiProvider, "model": "gemini-2.5-pro", "name": "Gemini 2.5 Pro", "key_name": "google"},
        "gemini-2.5-flash": {"class": GeminiProvider, "model": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "key_name": "google"},
        "gemini-2.0-flash": {"class": GeminiProvider, "model": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "key_name": "google"},
        # Generic gemini provider - defaults to stable 2.5 Pro
        "gemini": {"class": GeminiProvider, "model": "gemini-2.5-pro", "name": "Gemini", "key_name": "google"},

        # xAI Grok - Latest Models (Dec 2025)
        # Based on API query - actual available models
        "grok-4.1": {"class": GrokProvider, "model": "grok-4-1-fast-reasoning", "name": "xAI Grok 4.1", "key_name": "xai"},
        "grok-4.1-thinking": {"class": GrokProvider, "model": "grok-4-1-fast-reasoning", "name": "xAI Grok 4.1 Thinking", "key_name": "xai"},
        "grok-4.1-fast": {"class": GrokProvider, "model": "grok-4-1-fast-non-reasoning", "name": "xAI Grok 4.1 Fast", "key_name": "xai"},
        "grok-4": {"class": GrokProvider, "model": "grok-4-0709", "name": "xAI Grok 4", "key_name": "xai"},
        "grok-3": {"class": GrokProvider, "model": "grok-3", "name": "xAI Grok 3", "key_name": "xai"},
        # Generic grok provider - defaults to stable grok-3
        "grok": {"class": GrokProvider, "model": "grok-3", "name": "xAI Grok", "key_name": "xai"},
    }

    @classmethod
    def resolve_model(cls, model: str) -> str:
        """Resolve a friendly model name to the actual API model name"""
        return cls.MODEL_MAP.get(model, model)

    @classmethod
    def get_provider(cls, provider_id: str, api_key: str = None) -> AIProvider:
        """Get an AI provider instance, optionally with a specific API key"""
        if provider_id not in cls.PROVIDERS:
            raise ValueError(f"Unknown provider: {provider_id}")

        config = cls.PROVIDERS[provider_id]
        return config["class"](model=config["model"], api_key=api_key)

    @classmethod
    def get_key_name(cls, provider_id: str) -> str:
        """Get the API key name for a provider (openai, anthropic, google, xai)"""
        if provider_id not in cls.PROVIDERS:
            # Try to determine from provider_id prefix
            if provider_id.startswith('openai') or provider_id.startswith('gpt') or provider_id.startswith('o3') or provider_id.startswith('o4'):
                return 'openai'
            elif provider_id.startswith('claude'):
                return 'anthropic'
            elif provider_id.startswith('gemini'):
                return 'google'
            elif provider_id.startswith('grok'):
                return 'xai'
            return None
        return cls.PROVIDERS[provider_id].get("key_name")

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
    def chat(cls, provider_id: str, messages: List[Dict], system_prompt: str = "", api_keys: dict = None, model: str = None) -> str:
        """
        Send chat request to specified provider

        Args:
            provider_id: The provider to use (e.g., 'openai', 'claude', 'gemini', 'grok')
            messages: List of message dicts with 'role' and 'content'
            system_prompt: Optional system prompt
            api_keys: Optional dict of API keys {'openai': 'sk-...', 'anthropic': 'sk-ant-...', etc}
            model: Optional specific model to use (will be resolved through MODEL_MAP)
        """
        # Get the API key for this provider
        api_key = None
        if api_keys:
            key_name = cls.get_key_name(provider_id)
            if key_name:
                api_key = api_keys.get(key_name)

        # Get provider config
        if provider_id not in cls.PROVIDERS:
            raise ValueError(f"Unknown provider: {provider_id}")

        config = cls.PROVIDERS[provider_id]

        # Resolve model name if provided
        actual_model = config["model"]
        if model:
            actual_model = cls.resolve_model(model)

        # Create provider instance with the resolved model and API key
        provider = config["class"](model=actual_model, api_key=api_key)

        return provider.chat(messages, system_prompt)
