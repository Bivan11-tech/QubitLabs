"""Gemini AI tutor service.

The Gemini key lives ONLY here, loaded from the environment. It is never
exposed to the frontend and never included in API responses.
"""
from __future__ import annotations
from typing import Dict, List, Optional

import os

from ..models.ai import ChatMessage

class GeminiNotConfiguredError(RuntimeError):
    """

Raised when GEMINI_API_KEY is not set."""

DEFAULT_MODEL = "gemini-1.5-flash"

class GeminiService:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key if api_key is not None else os.getenv("GEMINI_API_KEY")
        self.model = model or os.getenv("GEMINI_MODEL") or DEFAULT_MODEL
        self._configured = bool(self.api_key)

    @property
    def configured(self) -> bool:
        return self._configured

    def generate(self, prompt: str) -> str:
        """Send a single prompt to Gemini and return the text reply."""
        if not self._configured:
            raise GeminiNotConfiguredError(
                "GEMINI_API_KEY is not configured. Set it in backend/.env to use the AI tutor."
            )
        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            response = genai.GenerativeModel(self.model).generate_content(prompt)
        except GeminiNotConfiguredError:
            raise
        except Exception as exc:  # network/auth/model errors bubble to the API layer
            raise GeminiNotConfiguredError(f"Gemini request failed: {exc}") from exc

        text = getattr(response, "text", None)
        if not text:
            raise GeminiNotConfiguredError("Gemini returned an empty response.")
        return text

    def chat(self, prompt: str, history: List[ChatMessage]) -> str:
        """Chat with conversation history folded into a single prompt.

        The backend holds the circuit context, the student question, and prior
        turns so the model stays circuit-aware without a stateful session.
        """
        turns = "\n".join(
            f"{'Student' if m.role == 'user' else 'Tutor'}: {m.content}"
            for m in history[-10:]
        )
        full = turns + "\n" + prompt if turns else prompt
        return self.generate(full)

_service: GeminiService | None = None

def get_gemini_service() -> GeminiService:
    """Dependency singleton. Tests override this via app.dependency_overrides."""
    global _service
    if _service is None:
        _service = GeminiService()
    return _service