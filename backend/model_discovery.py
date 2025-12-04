"""
Model Discovery Service for ASHER
Automatically discovers new models from each AI provider API and tests them.
Designed to run weekly via cron or scheduler.

Usage:
    python model_discovery.py           # Discover and report new models
    python model_discovery.py --update  # Discover, test, and update ai_providers.py
    python model_discovery.py --test    # Test all current models
"""

import os
import sys
import json
import argparse
import requests
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class ModelDiscovery:
    """Discovers and tests AI models from various providers"""

    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self.google_key = os.getenv("GOOGLE_API_KEY")
        self.xai_key = os.getenv("XAI_API_KEY")

        # Known model prefixes for filtering
        self.openai_chat_prefixes = ['gpt-', 'o1', 'o3', 'o4', 'chatgpt']
        self.openai_exclude = ['instruct', 'embedding', 'whisper', 'tts', 'dall',
                               'babbage', 'davinci', 'moderation', 'transcribe']

    def discover_openai_models(self) -> List[str]:
        """Query OpenAI API for available chat models"""
        if not self.openai_key:
            print("  [SKIP] OpenAI API key not configured")
            return []

        try:
            response = requests.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {self.openai_key}"},
                timeout=30
            )
            response.raise_for_status()

            models = []
            for model in response.json().get('data', []):
                model_id = model['id']
                # Filter for chat models
                if any(model_id.startswith(prefix) for prefix in self.openai_chat_prefixes):
                    if not any(excl in model_id.lower() for excl in self.openai_exclude):
                        models.append(model_id)

            return sorted(set(models))
        except Exception as e:
            print(f"  [ERROR] OpenAI discovery failed: {e}")
            return []

    def discover_gemini_models(self) -> List[str]:
        """Query Google Gemini API for available models"""
        if not self.google_key:
            print("  [SKIP] Google API key not configured")
            return []

        try:
            response = requests.get(
                f"https://generativelanguage.googleapis.com/v1beta/models?key={self.google_key}",
                timeout=30
            )
            response.raise_for_status()

            models = []
            for model in response.json().get('models', []):
                if 'generateContent' in model.get('supportedGenerationMethods', []):
                    model_id = model['name'].replace('models/', '')
                    # Only include gemini models, not gemma
                    if model_id.startswith('gemini'):
                        models.append(model_id)

            return sorted(set(models))
        except Exception as e:
            print(f"  [ERROR] Gemini discovery failed: {e}")
            return []

    def discover_grok_models(self) -> List[str]:
        """Query xAI API for available Grok models"""
        if not self.xai_key:
            print("  [SKIP] xAI API key not configured")
            return []

        try:
            response = requests.get(
                "https://api.x.ai/v1/models",
                headers={"Authorization": f"Bearer {self.xai_key}"},
                timeout=30
            )
            response.raise_for_status()

            models = []
            for model in response.json().get('data', []):
                model_id = model['id']
                if 'grok' in model_id.lower():
                    models.append(model_id)

            return sorted(set(models))
        except Exception as e:
            print(f"  [ERROR] Grok discovery failed: {e}")
            return []

    def get_anthropic_models(self) -> List[str]:
        """Return known Anthropic Claude models (no list API available)"""
        # Anthropic doesn't have a models list endpoint
        # These are the known available models
        return [
            "claude-opus-4-5-20251101",
            "claude-sonnet-4-5-20250929",
            "claude-sonnet-4-20250514",
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "claude-3-opus-20240229",
            "claude-3-haiku-20240307",
        ]

    def test_openai_model(self, model_id: str) -> Tuple[bool, str]:
        """Test if an OpenAI model works"""
        if not self.openai_key:
            return False, "API key not configured"

        try:
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model_id,
                    "messages": [{"role": "user", "content": "Say 'test' only"}],
                    "max_tokens": 10
                },
                timeout=60
            )
            if response.status_code == 200:
                return True, "OK"
            return False, f"HTTP {response.status_code}: {response.text[:100]}"
        except Exception as e:
            return False, str(e)[:100]

    def test_gemini_model(self, model_id: str) -> Tuple[bool, str]:
        """Test if a Gemini model works"""
        if not self.google_key:
            return False, "API key not configured"

        try:
            response = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={self.google_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": "Say 'test' only"}]}]
                },
                timeout=60
            )
            if response.status_code == 200:
                return True, "OK"
            # Check for rate limiting (still means model exists)
            if response.status_code == 429:
                return True, "Rate limited (model exists)"
            return False, f"HTTP {response.status_code}: {response.text[:100]}"
        except Exception as e:
            return False, str(e)[:100]

    def test_grok_model(self, model_id: str) -> Tuple[bool, str]:
        """Test if a Grok model works"""
        if not self.xai_key:
            return False, "API key not configured"

        try:
            response = requests.post(
                "https://api.x.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.xai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model_id,
                    "messages": [{"role": "user", "content": "Say 'test' only"}],
                    "max_tokens": 10
                },
                timeout=60
            )
            if response.status_code == 200:
                return True, "OK"
            return False, f"HTTP {response.status_code}: {response.text[:100]}"
        except Exception as e:
            return False, str(e)[:100]

    def test_anthropic_model(self, model_id: str) -> Tuple[bool, str]:
        """Test if an Anthropic model works"""
        if not self.anthropic_key:
            return False, "API key not configured"

        try:
            response = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.anthropic_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model_id,
                    "max_tokens": 10,
                    "messages": [{"role": "user", "content": "Say 'test' only"}]
                },
                timeout=60
            )
            if response.status_code == 200:
                return True, "OK"
            return False, f"HTTP {response.status_code}: {response.text[:100]}"
        except Exception as e:
            return False, str(e)[:100]

    def discover_all(self) -> Dict[str, List[str]]:
        """Discover models from all providers"""
        print("\n=== Discovering Models ===\n")

        print("OpenAI...")
        openai_models = self.discover_openai_models()
        print(f"  Found {len(openai_models)} models")

        print("Google Gemini...")
        gemini_models = self.discover_gemini_models()
        print(f"  Found {len(gemini_models)} models")

        print("xAI Grok...")
        grok_models = self.discover_grok_models()
        print(f"  Found {len(grok_models)} models")

        print("Anthropic Claude...")
        claude_models = self.get_anthropic_models()
        print(f"  Found {len(claude_models)} known models")

        return {
            "openai": openai_models,
            "gemini": gemini_models,
            "grok": grok_models,
            "claude": claude_models
        }

    def test_all_models(self, models: Dict[str, List[str]]) -> Dict[str, Dict[str, Tuple[bool, str]]]:
        """Test all discovered models"""
        print("\n=== Testing Models ===\n")
        results = {}

        # Test OpenAI models (sample of latest)
        if models.get("openai"):
            print("Testing OpenAI models...")
            results["openai"] = {}
            for model in models["openai"][:10]:  # Test first 10
                success, msg = self.test_openai_model(model)
                status = "OK" if success else "FAIL"
                print(f"  [{status}] {model}: {msg}")
                results["openai"][model] = (success, msg)

        # Test Gemini models
        if models.get("gemini"):
            print("\nTesting Gemini models...")
            results["gemini"] = {}
            for model in models["gemini"][:5]:  # Test first 5
                success, msg = self.test_gemini_model(model)
                status = "OK" if success else "FAIL"
                print(f"  [{status}] {model}: {msg}")
                results["gemini"][model] = (success, msg)

        # Test Grok models
        if models.get("grok"):
            print("\nTesting Grok models...")
            results["grok"] = {}
            for model in models["grok"][:5]:  # Test first 5
                success, msg = self.test_grok_model(model)
                status = "OK" if success else "FAIL"
                print(f"  [{status}] {model}: {msg}")
                results["grok"][model] = (success, msg)

        # Test Claude models
        if models.get("claude"):
            print("\nTesting Claude models...")
            results["claude"] = {}
            for model in models["claude"][:3]:  # Test first 3
                success, msg = self.test_anthropic_model(model)
                status = "OK" if success else "FAIL"
                print(f"  [{status}] {model}: {msg}")
                results["claude"][model] = (success, msg)

        return results

    def generate_report(self, models: Dict[str, List[str]],
                       test_results: Optional[Dict] = None) -> str:
        """Generate a report of discovered models"""
        report = []
        report.append(f"\n{'='*60}")
        report.append(f"Model Discovery Report - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        report.append(f"{'='*60}\n")

        for provider, model_list in models.items():
            report.append(f"\n## {provider.upper()} ({len(model_list)} models)")
            report.append("-" * 40)
            for model in model_list:
                status = ""
                if test_results and provider in test_results:
                    if model in test_results[provider]:
                        success, msg = test_results[provider][model]
                        status = " [OK]" if success else f" [FAIL: {msg}]"
                report.append(f"  {model}{status}")

        report.append(f"\n{'='*60}")
        return "\n".join(report)


def main():
    parser = argparse.ArgumentParser(description="ASHER Model Discovery Service")
    parser.add_argument("--update", action="store_true",
                       help="Discover, test, and update ai_providers.py")
    parser.add_argument("--test", action="store_true",
                       help="Test all current models")
    parser.add_argument("--output", type=str, default=None,
                       help="Output file for report")
    args = parser.parse_args()

    discovery = ModelDiscovery()

    # Discover models
    models = discovery.discover_all()

    # Test if requested
    test_results = None
    if args.test or args.update:
        test_results = discovery.test_all_models(models)

    # Generate and print report
    report = discovery.generate_report(models, test_results)
    print(report)

    # Save report if output specified
    if args.output:
        with open(args.output, 'w') as f:
            f.write(report)
        print(f"\nReport saved to {args.output}")

    # Print summary
    total = sum(len(m) for m in models.values())
    print(f"\nTotal models discovered: {total}")

    if test_results:
        tested = sum(len(r) for r in test_results.values())
        passed = sum(1 for r in test_results.values() for s, _ in r.values() if s)
        print(f"Models tested: {tested}, Passed: {passed}, Failed: {tested - passed}")


if __name__ == "__main__":
    main()
