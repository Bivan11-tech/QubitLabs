"""Models for the challenge validation API."""
from __future__ import annotations
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from .circuit import MAX_QUBITS, MAX_SHOTS, GateInstruction

class ChallengeSubmitRequest(BaseModel):
    num_qubits: int = Field(..., ge=1, le=MAX_QUBITS)
    gates: List[GateInstruction] = Field(default_factory=list)
    shots: int = Field(4096, ge=1, le=MAX_SHOTS)

class ChallengeCheck(BaseModel):
    id: str
    label: str
    passed: bool

class ChallengeResult(BaseModel):
    challenge_id: str
    passed: bool
    score: int          # 0-100
    xp: int
    feedback: str
    checks: List[ChallengeCheck] = Field(default_factory=list)