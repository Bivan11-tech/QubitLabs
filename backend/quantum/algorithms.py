"""Working algorithm templates.

Each template returns a canonical CircuitRequest so any consumer (API, frontend,
tests) can simulate or analyze it uniformly. All circuits stay within the
supported gate set and are built to be correct, exactly as verified by the
tests in tests/test_algorithms.py.

  * Bell                |00> + |11>
  * GHZ                 (|000> + |111>)
  * Deutsch-Jozsa       balanced 1-bit oracle
  * Teleportation       unconditional quantum teleportation q0 -> q2
  * Grover              amplitude amplification marking |11>
  * QFT                 2-qubit QFT (cp decomposed onto supported gates)
"""
from __future__ import annotations
from typing import Dict, List, Optional

import math

from qiskit import QuantumCircuit, transpile
from qiskit.qasm2 import loads as qasm2_loads

from ..models.circuit import CircuitRequest, GateInstruction
from .validation import CircuitValidationError, SUPPORTED_GATES

def _gates_from_circuit(qc: QuantumCircuit) -> List[GateInstruction]:
    """

Convert a Qiskit circuit restricted to supported gates into the canonical
    GateInstruction list. Raises if an unsupported op sneaks through."""
    gates: List[GateInstruction] = []
    for instr, qargs, _cargs in qc.data:
        name = instr.name.lower()
        if name not in SUPPORTED_GATES:
            raise CircuitValidationError(
                f"Cannot build template: unsupported op '{instr.name}' produced by decomposition."
            )
        targets = [q.index for q in qargs]
        controls: List[int] = []
        if name in ("cx", "cy", "cz"):
            controls, targets = targets[:1], targets[1:]
        elif name == "ccx":
            controls, targets = targets[:2], targets[2:]
        params = list(getattr(instr, "params", []))
        if params:
            params = [float(p.as_float() if hasattr(p, "as_float") else p) for p in params]
        gates.append(
            GateInstruction(
                name=name,
                targets=targets,
                controls=controls,
                params=_round_params(params),
            )
        )
    return gates

def _round_params(params):
    return [round(float(p), 8) for p in params]

def _template(num_qubits: int, gates: List[GateInstruction]) -> CircuitRequest:
    return CircuitRequest(num_qubits=num_qubits, gates=gates, shots=1024)

def bell_template() -> CircuitRequest:
    return _template(
        2,
        [
            GateInstruction(name="h", targets=[0]),
            GateInstruction(name="cx", targets=[1], controls=[0]),
        ],
    )

def ghz_template() -> CircuitRequest:
    return _template(
        3,
        [
            GateInstruction(name="h", targets=[0]),
            GateInstruction(name="cx", targets=[1], controls=[0]),
            GateInstruction(name="cx", targets=[2], controls=[1]),
        ],
    )

def deutsch_jozsa_template() -> CircuitRequest:
    """Balanced oracle on 1 function qubit; measuring q0 returns |1>."""
    return _template(
        2,
        [
            GateInstruction(name="x", targets=[1]),
            GateInstruction(name="h", targets=[0]),
            GateInstruction(name="h", targets=[1]),
            GateInstruction(name="cx", targets=[1], controls=[0]),
            GateInstruction(name="h", targets=[0]),
        ],
    )

def teleportation_template() -> CircuitRequest:
    """Unconditional teleportation: unknown quantum state on q0 -> q2."""
    return _template(
        3,
        [
            GateInstruction(name="h", targets=[1]),
            GateInstruction(name="cx", targets=[2], controls=[1]),
            GateInstruction(name="cx", targets=[1], controls=[0]),
            GateInstruction(name="h", targets=[0]),
            GateInstruction(name="cx", targets=[2], controls=[1]),
            GateInstruction(name="cz", targets=[2], controls=[0]),
        ],
    )

def grover_template() -> CircuitRequest:
    """2-qubit Grover with oracle marking |11> (one iteration)."""
    return _template(
        2,
        [
            GateInstruction(name="h", targets=[0]),
            GateInstruction(name="h", targets=[1]),
            # oracle: flip phase of |11>
            GateInstruction(name="cz", targets=[1], controls=[0]),
            # diffuser
            GateInstruction(name="h", targets=[0]),
            GateInstruction(name="h", targets=[1]),
            GateInstruction(name="x", targets=[0]),
            GateInstruction(name="x", targets=[1]),
            GateInstruction(name="cz", targets=[1], controls=[0]),
            GateInstruction(name="x", targets=[0]),
            GateInstruction(name="x", targets=[1]),
            GateInstruction(name="h", targets=[0]),
            GateInstruction(name="h", targets=[1]),
        ],
    )

def qft_template() -> CircuitRequest:
    """2-qubit QFT. The controlled-phase is decomposed by Qiskit's transpiler
    onto the supported gate set (h, cx, rz), so correctness is preserved."""
    qft = QuantumCircuit(2)
    qft.h(0)
    qft.cp(math.pi / 2, 0, 1)
    qft.h(1)
    qft.swap(0, 1)
    decomposed = transpile(qft, basis_gates=["h", "cx", "rz", "x", "s", "t", "swap"])
    return _template(2, _gates_from_circuit(decomposed))

TEMPLATES: Dict[str, callable] = {
    "bell": bell_template,
    "ghz": ghz_template,
    "deutsch-jozsa": deutsch_jozsa_template,
    "teleportation": teleportation_template,
    "grover": grover_template,
    "qft": qft_template,
}

def get_template(name: str) -> CircuitRequest:
    key = name.lower().strip()
    if key not in TEMPLATES:
        raise CircuitValidationError(
            f"Template not found. Options: {sorted(TEMPLATES)}"
        )
    return TEMPLATES[key]()