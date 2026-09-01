"""Shared helpers for backend tests."""
from __future__ import annotations

from backend.models.circuit import CircuitRequest, GateInstruction

def g(name: str, targets=None, controls=None, params=None) -> GateInstruction:
    return GateInstruction(
        name=name,
        targets=targets or [],
        controls=controls or [],
        params=params or [],
    )

def bell_request(shots: int = 1024) -> CircuitRequest:
    return CircuitRequest(
        num_qubits=2,
        gates=[
            g("h", targets=[0]),
            g("cx", targets=[1], controls=[0]),
        ],
        shots=shots,
    )

def ghz_request(shots: int = 1024) -> CircuitRequest:
    return CircuitRequest(
        num_qubits=3,
        gates=[
            g("h", targets=[0]),
            g("cx", targets=[1], controls=[0]),
            g("cx", targets=[2], controls=[1]),
        ],
        shots=shots,
    )

def reduced_rho_of(circuit: QuantumCircuit, qubit: int):
    from qiskit.quantum_info import Statevector, DensityMatrix, partial_trace

    dm = DensityMatrix(Statevector(circuit))
    traced = [i for i in range(circuit.num_qubits) if i != qubit]
    return partial_trace(dm, traced).data