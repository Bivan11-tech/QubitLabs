"""Canonical circuit data models shared between the API and the quantum engine."""
from __future__ import annotations
from typing import Dict, List, Optional


from pydantic import BaseModel, Field

# The frontend visual editor caps circuits at 7 qubits; we mirror that limit
# for statevector simulation so the two sides are always consistent.
MAX_QUBITS = 7
MAX_SHOTS = 100_000

class GateInstruction(BaseModel):
    """

A single unitary gate in the canonical circuit format.

    Conventions:
      * ``name`` is lowercase: h, x, y, z, s, t, sdg, tdg,
        rx, ry, rz, cx, cy, cz, swap, ccx.
      * ``targets`` are the qubits the gate acts on.
      * ``controls`` are the controlling qubits (empty for uncontrolled gates).
      * ``params`` holds rotation angles in radians (exactly one for rx/ry/rz).
    """

    name: str
    targets: List[int] = Field(default_factory=list)
    controls: List[int] = Field(default_factory=list)
    params: List[float] = Field(default_factory=list)

class CircuitRequest(BaseModel):
    """Canonical circuit representation used by /simulate and friends."""

    num_qubits: int = Field(..., ge=1, le=MAX_QUBITS)
    gates: List[GateInstruction] = Field(default_factory=list)
    shots: int = Field(1024, ge=1, le=MAX_SHOTS)

class QasmRequest(BaseModel):
    """Body for /simulate-qasm."""

    qasm_code: str
    shots: int = Field(1024, ge=1, le=MAX_SHOTS)