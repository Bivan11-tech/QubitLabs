"""Simulation, QASM and analysis endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from qiskit.qasm2 import loads as qasm2_loads

from ..models.circuit import MAX_QUBITS, CircuitRequest, QasmRequest
from ..quantum.analysis import analyze_request
from ..quantum.simulator import run_circuit, run_simulation
from ..quantum.validation import CircuitValidationError

router = APIRouter(prefix="/api/v1", tags=["simulation"])

def _validation_http(exc: Exception) -> HTTPException:
    return HTTPException(status_code=400, detail=str(exc))

@router.post("/simulate")
def simulate_circuit(req: CircuitRequest) -> dict:
    try:
        return run_simulation(req)
    except CircuitValidationError as exc:
        raise _validation_http(exc)

@router.post("/simulate-qasm")
def simulate_qasm(req: QasmRequest) -> dict:
    try:
        qc = qasm2_loads(req.qasm_code)
    except Exception as exc:  # malformed OpenQASM
        raise HTTPException(status_code=400, detail=f"OpenQASM parsing error: {exc}")

    if not (1 <= qc.num_qubits <= MAX_QUBITS):
        raise HTTPException(
            status_code=400,
            detail=f"num_qubits must be between 1 and {MAX_QUBITS}, got {qc.num_qubits}.",
        )

    try:
        return run_circuit(qc, req.shots)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Simulation of QASM failed: {exc}")

@router.post("/analyze-circuit")
def analyze_circuit(req: CircuitRequest) -> dict:
    try:
        return analyze_request(req)
    except CircuitValidationError as exc:
        raise _validation_http(exc)