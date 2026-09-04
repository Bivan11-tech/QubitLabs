"""Gemini/PaLM AI tutor service (legacy google-generativeai 0.1.0rc1).

IMPORTANT: this venv pins google-generativeai==0.1.0rc1, which is the PaLM-era
package. It exposes `generate_text`/`chat` — NOT the modern
`GenerativeModel`/`generate_content` API (that requires >= 0.4.x / Py3.9+).
This service talks to the legacy surface but keeps a thin single-prompt
`generate()` abstraction so callers and stubs stay simple.

The API key lives ONLY here, loaded from the environment. It is never exposed to
the frontend and never included in API responses.
"""
from __future__ import annotations
from typing import Dict, List, Optional

import os

from ..models.ai import ChatMessage

class GeminiNotConfiguredError(RuntimeError):
    """Raised when no usable GEMINI_API_KEY is set or a call fails."""

DEFAULT_MODEL = "models/gemini-1.5-flash"

# Sentinel so that GeminiService() (no args) falls back to the environment, while
# GeminiService(api_key=None) is treated as explicitly unconfigured (used by tests).
_NO_KEY = object()

class GeminiService:
    def __init__(self, api_key=_NO_KEY, model: Optional[str] = None):
        if api_key is _NO_KEY:
            api_key = os.getenv("GEMINI_API_KEY")
        self.api_key = api_key
        self.model = model or os.getenv("GEMINI_MODEL") or DEFAULT_MODEL
        self._configured = bool(self.api_key)

    @property
    def configured(self) -> bool:
        return self._configured

    @staticmethod
    def _unconfigured_err() -> GeminiNotConfiguredError:
        return GeminiNotConfiguredError(
            "GEMINI_API_KEY is not configured. Set it in backend/.env to use the AI tutor."
        )

    def generate(self, prompt: str) -> str:
        """Send a single prompt and return the model's text reply."""
        if not self._configured:
            raise self._unconfigured_err()
        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            if hasattr(genai, "GenerativeModel"):
                # Modern SDK path (safety net; not present on 0.1.0rc1)
                response = genai.GenerativeModel(self.model).generate_content(prompt)
                text = getattr(response, "text", None)
            else:
                # Legacy PaLM-era SDK: google.generativeai.generate_text(...)
                completion = genai.generate_text(model=self.model, prompt=prompt, max_output_tokens=2048)
                text = completion.result
        except GeminiNotConfiguredError:
            raise
        except Exception as exc:  # network/auth/model errors bubble to the API layer
            raise GeminiNotConfiguredError(f"Gemini request failed: {exc}") from exc

        if not text:
            raise GeminiNotConfiguredError("Gemini returned an empty response.")
        return str(text)

    def chat(self, prompt: str, history: List[ChatMessage]) -> str:
        """Multi-turn chat. Prior turns are folded into a single prompt and sent
        through generate(), so stubs that override generate() keep working and no
        stateful session is needed."""
        if not self._configured:
            raise self._unconfigured_err()
        turns = "\n".join(
            f"Student: {m.content}" if m.role == "user" else f"Tutor: {m.content}"
            for m in history[-10:]
        )
        full = (turns + "\n" + prompt) if turns else prompt
        return self.generate(full)

_service: Optional["GeminiService"] = None

def get_gemini_service() -> GeminiService:
    """Dependency singleton. Tests override this via app.dependency_overrides."""
    global _service
    if _service is None:
        _service = GeminiService()
    return _service
