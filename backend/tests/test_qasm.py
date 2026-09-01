"""QASM parsing + round-trip tests."""
from __future__ import annotations


from qiskit import QuantumCircuit
from qiskit.qasm2 import dumps as qasm2_dumps

from backend.models.circuit import QasmRequest
from backend.quantum.simulator import run_circuit
from backend.quantum.validation import CircuitValidationError
from backend.tests.helpers import bell_request

BELL_QASM = """

OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0], q[1];
measure q[0] -> c[0];
measure q[1] -> c[1];
"""

def test_qasm_loads_and_simulates():
    qc = _load(BELL_QASM)
    res = run_circuit(qc, 8192)
    assert res["num_qubits"] == 2
    counts = res["measurement_counts"]
    assert set(counts.keys()) <= {"00", "11"}
    assert abs((counts.get("00", 0) + counts.get("11", 0)) / 8192 - 1.0) < 1e-6
    assert abs(res["probabilities"]["00"] - 0.5) < 0.01
    assert abs(res["probabilities"]["11"] - 0.5) < 0.01

def test_qasm_with_measurement_still_returns_unitary_analysis():
    qc = _load(BELL_QASM)
    res = run_circuit(qc, 1024)
    # statevector defined on the unitary part only
    assert len(res["statevector"]) == 4
    assert res["gate_breakdown"].get("h") == 1
    assert res["gate_breakdown"].get("cx") == 1
    assert "measure" not in res["gate_breakdown"]

def test_visual_to_qasm_to_result_roundtrip():
    # Build a Bell from our canonical wish-list format, dump to QASM, reload,
    # and confirm the same physical predictions.
    req = bell_request(shots=4096)
    from backend.quantum.circuit_builder import build_circuit_from_gates

    qc = build_circuit_from_gates(req)
    qasm = qasm2_dumps(qc)
    assert "h q[0];" in qasm
    assert "cx q[0],q[1];" in qasm

    reloaded = _load(qasm)
    res = run_circuit(reloaded, 4096)
    assert abs(res["probabilities"]["00"] - 0.5) < 0.01
    assert abs(res["probabilities"]["11"] - 0.5) < 0.01

def test_malformed_qasm_raises():
    try:
        _load("OPENQASM 2.0; this is not valid qasm ((((")
    except Exception:
        return
    raise AssertionError("malformed QASM should have raised")

def test_empty_qasm_rejected_via_api():
    from fastapi.testclient import TestClient

    from backend.main import app

    r = TestClient(app).post(
        "/api/v1/simulate-qasm", json={"qasm_code": "", "shots": 1024}
    )
    assert r.status_code == 400

def _load(code: str) -> QuantumCircuit:
    from qiskit.qasm2 import loads

    QasmRequest(qasm_code=code, shots=1024)
    return loads(code)