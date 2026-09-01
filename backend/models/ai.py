"""Models for the Gemini AI tutor API."""
from __future__ import annotations
from typing import Dict, List, Optional


from pydantic import BaseModel, Field

from .circuit import GateInstruction

class ChatMessage(BaseModel):
    role: str  # 'user' or 'model'
    content: str

class AIChatRequest(BaseModel):
    """

Current circuit context plus a student question and prior conversation."""

    num_qubits: int = Field(..., ge=1, le=7)
    gates: List[GateInstruction] = Field(default_factory=list)
    user_question: str
    chat_history: List[ChatMessage] = Field(default_factory=list)