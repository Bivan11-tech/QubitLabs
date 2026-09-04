from __future__ import annotations

import os
from typing import List, Optional

from google import genai

from ..models.ai import ChatMessage


# Use an environment variable so you can change the model
# without modifying the source code.
DEFAULT_MODEL = "gemini-3.5-flash-lite"


class GeminiNotConfiguredError(RuntimeError):
    """Raised when Gemini is not configured or the request fails."""


class GeminiService:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ):
        # Get API key from argument first, then environment
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")

        # Get model from argument, then environment, then default
        self.model = (
            model
            or os.getenv("GEMINI_MODEL")
            or DEFAULT_MODEL
        )

        self._configured = bool(self.api_key)

        # Create Gemini client only if API key exists
        self.client = (
            genai.Client(api_key=self.api_key)
            if self._configured
            else None
        )

    @property
    def configured(self) -> bool:
        """Return whether Gemini is properly configured."""
        return self._configured

    def generate(self, prompt: str) -> str:
        """
        Send a prompt to Gemini and return the generated text.
        """

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
            )

            # Gemini response may not contain usable text
            if not response or not response.text:
                raise GeminiNotConfiguredError(
                    "Gemini returned an empty response."
                )

            return response.text.strip()

        except GeminiNotConfiguredError:
            raise

        except Exception as exc:
            raise GeminiNotConfiguredError(
                f"Gemini request failed: {exc}"
            ) from exc

    def chat(
        self,
        prompt: str,
        history: List[ChatMessage],
    ) -> str:
        """
        Generate a tutor response using the conversation history.
        """

        # Keep only the latest 10 messages so the prompt
        # doesn't grow unnecessarily large.
        recent_history = history[-10:]

        conversation = []

        for message in recent_history:
            role = (
                "Student"
                if message.role == "user"
                else "Tutor"
            )

            conversation.append(
                f"{role}: {message.content}"
            )

        history_text = "\n".join(conversation)

        if history_text:
            full_prompt = (
                "You are QubitLabs AI Tutor, an expert tutor "
                "for quantum computing and quantum physics.\n\n"
                "Conversation history:\n"
                f"{history_text}\n\n"
                "Student's latest question:\n"
                f"{prompt}\n\n"
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
                f"{prompt}\n\n"
                "Answer clearly and educationally. "
                "Explain concepts step-by-step when useful. "
                "Use equations where appropriate. "
                "Do not make up facts."
            )

        return self.generate(full_prompt)


# Singleton service instance
_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """
    Return the shared GeminiService instance.
    """

    global _service

    if _service is None:
        _service = GeminiService()

    return _service
