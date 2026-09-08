"""Gemini AI tutor service using the Google GenAI SDK.

The API key lives ONLY here, loaded from the environment. It is never exposed
to the frontend and never included in API responses.
"""
from __future__ import annotations

import os
import re
from typing import List, Optional

from google import genai
from google.genai import types

from ..models.ai import ChatMessage

DEFAULT_MODEL = "gemini-2.0-flash"
REQUEST_TIMEOUT = 30

# Characters that could be used for prompt-injection delimiter spoofing.
_INJECTION_PATTERNS = [
    re.compile(r"(?i)ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?)"),
    re.compile(r"(?i)you\s+are\s+now\s+(a|an|the)\s+"),
    re.compile(r"(?i)system\s*:\s*"),
    re.compile(r"(?i)assistant\s*:\s*"),
    re.compile(r"(?i)###\s*(system|instruction|prompt)"),
]


class GeminiNotConfiguredError(RuntimeError):
    """Raised when Gemini is not configured or the request fails."""


def _sanitize_user_input(text: str) -> str:
    """Strip patterns that attempt to override the system prompt."""
    cleaned = text
    for pattern in _INJECTION_PATTERNS:
        cleaned = pattern.sub("[redacted]", cleaned)
    return cleaned


class GeminiService:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = (
            model
            or os.getenv("GEMINI_MODEL")
            or DEFAULT_MODEL
        )

        self._configured = bool(self.api_key)

        self.client = (
            genai.Client(api_key=self.api_key)
            if self._configured
            else None
        )

    @property
    def configured(self) -> bool:
        return self._configured

    def generate(self, prompt: str) -> str:
        if not self._configured or self.client is None:
            raise GeminiNotConfiguredError(
                "GEMINI_API_KEY is not configured. "
                "Please add GEMINI_API_KEY to backend/.env"
            )

        if not prompt or not prompt.strip():
            raise GeminiNotConfiguredError(
                "Gemini prompt cannot be empty."
            )

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    max_output_tokens=2048,
                ),
            )

            if not response or not response.text:
                raise GeminiNotConfiguredError(
                    "Gemini returned an empty response."
                )

            return response.text.strip()

        except GeminiNotConfiguredError:
            raise

        except Exception as exc:
            raise GeminiNotConfiguredError(
                f"Gemini request failed: {type(exc).__name__}"
            ) from exc

    def chat(
        self,
        prompt: str,
        history: List[ChatMessage],
    ) -> str:
        recent_history = history[-10:]

        conversation = []
        for message in recent_history:
            sanitized = _sanitize_user_input(message.content)
            role = (
                "Student"
                if message.role == "user"
                else "Tutor"
            )
            conversation.append(f"{role}: {sanitized}")

        history_text = "\n".join(conversation)

        sanitized_prompt = _sanitize_user_input(prompt)

        if history_text:
            full_prompt = (
                "You are QubitLabs AI Tutor, an expert tutor "
                "for quantum computing and quantum physics.\n\n"
                "Conversation history:\n"
                f"{history_text}\n\n"
                "Student's latest question:\n"
                f"{sanitized_prompt}\n\n"
                "Answer the student's question clearly and "
                "educationally. Explain concepts step-by-step "
                "when useful. Use equations where appropriate. "
                "Do not make up facts."
            )
        else:
            full_prompt = (
                "You are QubitLabs AI Tutor, an expert tutor "
                "for quantum computing and quantum physics.\n\n"
                "Student's question:\n"
                f"{sanitized_prompt}\n\n"
                "Answer clearly and educationally. "
                "Explain concepts step-by-step when useful. "
                "Use equations where appropriate. "
                "Do not make up facts."
            )

        return self.generate(full_prompt)


_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    global _service

    if _service is None:
        try:
            _service = GeminiService()
        except Exception:
            _service = GeminiService(api_key=None)

    return _service


def reset_gemini_service() -> None:
    """Reset the singleton. Useful for tests."""
    global _service
    _service = None
