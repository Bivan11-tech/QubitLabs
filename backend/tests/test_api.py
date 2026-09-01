"""API endpoint tests (FastAPI TestClient)."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.tests.helpers import bell_request, g

client = TestClient(app)

BELL_BODY = {
    "num_qubits": 2,
    "gates": [
        {"name": "h", "targets": [0], "controls": [], "params": []},
        {"name": "cx", "targets": [1], "controls": [0], "params": []},
    ],
    "shots": 1024,
}

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "service": "quantum-engine", "version": "1.0.0"}

def test_simulate_bell():
    r = client.post("/api/v1/simulate", json=BELL_BODY)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["num_qubits"] == 2
    assert abs(data["probabilities"]["00"] - 0.5) < 0.05
    assert abs(data["probabilities"]["11"] - 0.5) < 0.05
    assert abs(data["probabilities"].get("01", 0)) < 0.05
    assert abs(data["probabilities"].get("10", 0)) < 0.05
    assert len(data["statevector"]) == 4
    assert len(data["bloch_vectors"]) == 2
    assert data["circuit_depth"] == 2
    assert data["total_gates"] == 2
    assert data["gate_breakdown"] == {"h": 1, "cx": 1}
    assert data["shots"] == 1024
    assert set(data["measurement_counts"].keys()) <= {"00", "11"}

def test_simulate_invalid_gate_400():
    body = dict(BELL_BODY)
    body["gates"] = [{"name": "sprocket", "targets": [0], "controls": [], "params": []}]
    r = client.post("/api/v1/simulate", json=body)
    assert r.status_code == 400
    assert "Unsupported gate" in r.json()["detail"]

def test_simulate_invalid_qubit_400():
    body = dict(BELL_BODY)
    body["gates"] = [{"name": "h", "targets": [99], "controls": [], "params": []}]
    r = client.post("/api/v1/simulate", json=body)
    assert r.status_code == 400
    assert "out of range" in r.json()["detail"]

def test_simulate_invalid_param_400():
    body = dict(BELL_BODY)
    body["gates"] = [{"name": "rz", "targets": [0], "controls": [], "params": []}]
    r = client.post("/api/v1/simulate", json=body)
    assert r.status_code == 400

def test_simulate_qasm_ok():
    r = client.post(
        "/api/v1/simulate-qasm",
        json={"qasm_code": "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[2];\nh q[0];\ncx q[0],q[1];", "shots": 1024},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["num_qubits"] == 2
    assert abs(data["probabilities"]["00"] - 0.5) < 0.05
    assert abs(data["probabilities"]["11"] - 0.5) < 0.05

def test_simulate_qasm_malformed_400():
    r = client.post(
        "/api/v1/simulate-qasm",
        json={"qasm_code": "OPENQASM 2.0;\nnot real qasm (((", "shots": 1024},
    )
    assert r.status_code == 400
    assert "parsing" in r.json()["detail"].lower()

def test_analyze_circuit():
    r = client.post("/api/v1/analyze-circuit", json=BELL_BODY)
    assert r.status_code == 200, r.text
    data = r.json()
    for field in [
        "num_qubits",
        "circuit_depth",
        "total_gates",
        "gate_breakdown",
        "has_entanglement",
        "active_basis_states_count",
        "probabilities",
        "qasm",
        "analysis_context",
    ]:
        assert field in data
    assert data["has_entanglement"] is True
    assert data["active_basis_states_count"] == 2
    assert data["circuit_depth"] == 2

def test_analyze_circuit_without_entangling_gate():
    body = {
        "num_qubits": 2,
        "gates": [{"name": "h", "targets": [0], "controls": [], "params": []}],
        "shots": 1024,
    }
    r = client.post("/api/v1/analyze-circuit", json=body)
    assert r.status_code == 200
    data = r.json()
    assert data["has_entanglement"] is False
    assert data["entangle_gate_present"] is False

def test_templates_list_and_bell():
    r = client.get("/api/v1/templates")
    assert r.status_code == 200
    assert "bell" in r.json()["templates"]

    r = client.get("/api/v1/templates/bell")
    assert r.status_code == 200
    data = r.json()
    assert data["template"]["num_qubits"] == 2
    assert abs(data["probabilities"]["00"] - 0.5) < 0.05

def test_templates_unknown_404():
    r = client.get("/api/v1/templates/does-not-exist")
    assert r.status_code == 404