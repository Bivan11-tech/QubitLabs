"""Quantum simulation engine.

The public entry point is :func:`run_simulation` which takes a validated
CircuitRequest and returns the full structured result consumed by the frontend.

A thin backend abstraction (:class:`QuantumBackend`) makes it possible to add
future adapters (PennyLane, Cirq, ...) without touching the API layer.
"""
from __future__ import annotations
from typing import Dict, List, Optional

from abc import ABC, abstractmethod

import numpy as np
from qiskit import QuantumCircuit
from qiskit.qasm2 import dumps as qasm2_dumps
from qiskit.quantum_info import Statevector, DensityMatrix, partial_trace
from qiskit_aer import AerSimulator

from ..models.circuit import CircuitRequest
from .circuit_builder import build_circuit_from_gates
from .validation import validate_circuit_request

class QuantumBackend(ABC):
    """

Abstract quantum simulation backend."""

    @abstractmethod
    def simulate(self, circuit: QuantumCircuit, shots: int):
        """Return a dict with measurement_counts and execution info."""
        raise NotImplementedError

class QiskitAerBackend(QuantumBackend):
    """Qiskit Aer pure-state simulator."""

    def simulate(self, circuit: QuantumCircuit, shots: int):
        if _has_measure(circuit):
            run = circuit
        else:
            run = circuit.copy()
            run.measure_all()
        result = AerSimulator().run(run, shots=shots).result()
        return {"measurement_counts": result.get_counts()}

def _has_measure(circuit: QuantumCircuit) -> bool:
    return any(cargs for _instr, _qargs, cargs in circuit.data)

def _unitary_circuit(qc: QuantumCircuit) -> QuantumCircuit:
    """Return a copy of the circuit without measurement instructions.

    Used for the statevector / Bloch vector / pure-depth analysis: those are
    defined for the unitary part of the circuit only.
    """
    out = QuantumCircuit(qc.num_qubits)
    for instr, qargs, cargs in qc.data:
        if len(qargs) == 0 or cargs:
            continue
        out.append(instr, [q.index for q in qargs])
    return out

def basis_strings(n: int) -> List[str]:
    """Little-endian basis labels: index i maps to zero-padded binary of i.

    For a 2-qubit circuit this yields ['00', '01', '10', '11'] where the
    rightmost character is qubit 0 (Qiskit convention).
    """
    return [format(i, f"0{n}b") for i in range(1 << n)]

def statevector_amplitudes(sv: Statevector, n: int) -> List[dict]:
    """Structured statevector: [{basis, re, im}, ...] ordered by basis index."""
    labels = basis_strings(n)
    data = sv.data
    return [
        {"basis": labels[i], "re": round(float(data[i].real), 6), "im": round(float(data[i].imag), 6)}
        for i in range(len(data))
    ]

def compute_bloch_vectors(qc: QuantumCircuit) -> List[dict]:
    """One real Bloch vector per qubit, computed from reduced density matrices.

    For a single-qubit reduced density matrix rho:
        x = Tr(rho X), y = Tr(rho Y), z = Tr(rho Z)
    These are real measured quantities, never fabricated.
    """
    sv = Statevector.from_instruction(qc)
    dm = DensityMatrix(sv)
    n = qc.num_qubits
    bloch = []
    for i in range(n):
        traced = [j for j in range(n) if j != i]
        rho = partial_trace(dm, traced).data
        x = 2.0 * np.real(rho[0, 1])
        y = 2.0 * np.imag(rho[1, 0])
        z = np.real(rho[0, 0] - rho[1, 1])
        bloch.append(
            {
                "qubit": i,
                "coordinates": {
                    "x": round(float(x), 6),
                    "y": round(float(y), 6),
                    "z": round(float(z), 6),
                },
            }
        )
    return bloch

def reduced_purity(qc: QuantumCircuit) -> float:
    """Smallest purity Tr(rho^2) over single-qubit reduced states.

    For a pure global state, any reduced qubit with purity < 1 is entangled
    with the rest of the system. Returns 1.0 for a single qubit.
    """
    sv = Statevector.from_instruction(qc)
    dm = DensityMatrix(sv)
    n = qc.num_qubits
    if n < 2:
        return 1.0
    purities = []
    for i in range(n):
        traced = [j for j in range(n) if j != i]
        rho = partial_trace(dm, traced).data
        purities.append(np.real(np.trace(rho @ rho)))
    return float(min(purities))

def run_simulation(req: CircuitRequest) -> dict:
    """Validate, then simulate a circuit request."""
    validate_circuit_request(req)
    qc = build_circuit_from_gates(req)
    return run_circuit(qc, req.shots)

def run_circuit(qc: QuantumCircuit, shots: int) -> dict:
    """Simulate an already-built Qiskit circuit (used by /simulate-qasm too).

    Measurement instructions are stripped for the statevector/Bloch analysis
    (defined on the unitary part) but kept for the Aer measurement counts.
    """
    num_qubits = qc.num_qubits
    unitary = _unitary_circuit(qc)

    sv = Statevector.from_instruction(unitary)
    qasm = qasm2_dumps(unitary)

    gate_breakdown = dict(unitary.count_ops())
    total_gates = sum(gate_breakdown.values())
    circuit_depth = unitary.depth()

    probabilities = {
        b: round(float(p), 6)
        for b, p in zip(basis_strings(num_qubits), sv.probabilities())
    }

    backend = QiskitAerBackend()
    sim = backend.simulate(qc, shots)
    counts = sim["measurement_counts"]

    bloch = compute_bloch_vectors(unitary)

    return {
        "num_qubits": num_qubits,
        "qasm": qasm,
        "statevector": statevector_amplitudes(sv, num_qubits),
        "probabilities": probabilities,
        "bloch_vectors": bloch,
        "measurement_counts": counts,
        "circuit_depth": circuit_depth,
        "total_gates": total_gates,
        "gate_breakdown": gate_breakdown,
        "shots": shots,
    }