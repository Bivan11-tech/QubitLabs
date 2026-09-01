"""Circuit request validation.

Every request is validated here *before* touching Qiskit so that we can return
useful HTTP 400 errors instead of silently ignoring bad instructions.
"""
from __future__ import annotations
from typing import Dict, List, Optional

from dataclasses import dataclass

from ..models.circuit import CircuitRequest, GateInstruction, MAX_QUBITS, MAX_SHOTS

class CircuitValidationError(ValueError):
    """

Raised when a circuit request is structurally invalid."""

@dataclass(frozen=True)
class GateSpec:
    targets: int
    controls: int
    params: int

SUPPORTED_GATES: Dict[str, GateSpec] = {
    "h": GateSpec(targets=1, controls=0, params=0),
    "x": GateSpec(targets=1, controls=0, params=0),
    "y": GateSpec(targets=1, controls=0, params=0),
    "z": GateSpec(targets=1, controls=0, params=0),
    "s": GateSpec(targets=1, controls=0, params=0),
    "t": GateSpec(targets=1, controls=0, params=0),
    "sdg": GateSpec(targets=1, controls=0, params=0),
    "tdg": GateSpec(targets=1, controls=0, params=0),
    "rx": GateSpec(targets=1, controls=0, params=1),
    "ry": GateSpec(targets=1, controls=0, params=1),
    "rz": GateSpec(targets=1, controls=0, params=1),
    "cx": GateSpec(targets=1, controls=1, params=0),
    "cy": GateSpec(targets=1, controls=1, params=0),
    "cz": GateSpec(targets=1, controls=1, params=0),
    "swap": GateSpec(targets=2, controls=0, params=0),
    "ccx": GateSpec(targets=1, controls=2, params=0),
}

GATE_NAMES = sorted(SUPPORTED_GATES)

def validate_circuit_request(req: CircuitRequest) -> None:
    """Validate the overall request, raising CircuitValidationError on failure."""
    if not (1 <= req.num_qubits <= MAX_QUBITS):
        raise CircuitValidationError(
            f"num_qubits must be between 1 and {MAX_QUBITS}, got {req.num_qubits}."
        )
    if not (1 <= req.shots <= MAX_SHOTS):
        raise CircuitValidationError(
            f"shots must be between 1 and {MAX_SHOTS}, got {req.shots}."
        )
    for gate in req.gates:
        validate_gate(gate, req.num_qubits)

def validate_gate(gate: GateInstruction, num_qubits: int) -> None:
    """Validate a single gate instruction, raising CircuitValidationError."""
    name = gate.name.lower()
    if name not in SUPPORTED_GATES:
        raise CircuitValidationError(
            f"Unsupported gate type: '{gate.name}'. Valid options: {GATE_NAMES}"
        )

    spec = SUPPORTED_GATES[name]

    if len(gate.targets) != spec.targets:
        raise CircuitValidationError(
            f"Gate '{name}' expects {spec.targets} target(s), got {gate.targets}."
        )
    if len(gate.controls) != spec.controls:
        raise CircuitValidationError(
            f"Gate '{name}' expects {spec.controls} control(s), got {gate.controls}."
        )
    if len(gate.params) != spec.params:
        raise CircuitValidationError(
            f"Gate '{name}' expects {spec.params} parameter(s) (angles in radians), "
            f"got {gate.params}."
        )
    if spec.params and not all(
        isinstance(p, (int, float)) and _finite(p) for p in gate.params
    ):
        raise CircuitValidationError(f"Gate '{name}' has a non-finite parameter.")

    for idx, label in ((q, "target") for q in gate.targets):
        _check_index(idx, num_qubits, name, label)
    for idx, label in ((q, "control") for q in gate.controls):
        _check_index(idx, num_qubits, name, label)

    if name in ("cx", "cy", "cz") and gate.controls[0] == gate.targets[0]:
        raise CircuitValidationError(
            f"Gate '{name}' control q{gate.controls[0]} cannot equal its target."
        )
    if name == "swap" and gate.targets[0] == gate.targets[1]:
        raise CircuitValidationError("Gate 'swap' targets must be distinct.")
    if name == "ccx":
        c0, c1 = gate.controls
        if c0 == c1:
            raise CircuitValidationError("Gate 'ccx' controls must be distinct.")

def _check_index(idx: int, num_qubits: int, name: str, label: str) -> None:
    if not isinstance(idx, int) or isinstance(idx, bool):
        raise CircuitValidationError(
            f"Gate '{name}' {label} index must be an int, got {idx!r}."
        )
    if idx < 0 or idx >= num_qubits:
        raise CircuitValidationError(
            f"Gate '{name}' {label} qubit index {idx} is out of range "
            f"for a {num_qubits}-qubit circuit."
        )

def _finite(x: float) -> bool:
    import math

    return math.isfinite(x)