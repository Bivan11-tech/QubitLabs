"""Challenge validation tests (backend/api/challenges.py)."""
from __future__ import annotations

from fastapi.testclient import TestClient

from backend.main import app
from backend.tests.helpers import bell_request

client = TestClient(app)

BELL_BODY = {
    "num_qubits": 2,
    "gates": [
        {"name": "h", "targets": [0], "controls": [], "params": []},
        {"name": "cx", "targets": [1], "controls": [0], "params": []},
    ],
    "shots": 4096,
}

def test_bell_challenge_passes():
    r = client.post("/api/v1/challenges/bell/submit", json=BELL_BODY)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["passed"] is True
    assert data["score"] == 100
    assert data["xp"] == 100
    assert "Correct Bell state" in data["feedback"]
    assert len(data["checks"]) == 5

def test_bell_challenge_missing_cx_fails():
    body = dict(BELL_BODY)
    body["gates"] = [{"name": "h", "targets": [0], "controls": [], "params": []}]
    r = client.post("/api/v1/challenges/bell/submit", json=body)
    assert r.status_code == 200
    data = r.json()
    assert data["passed"] is False
    assert data["xp"] == 0
    assert "CX" in data["feedback"]

def test_bell_challenge_wrong_wire_fails():
    body = dict(BELL_BODY)
    body["gates"] = [
        {"name": "h", "targets": [1], "controls": [], "params": []},
        {"name": "cx", "targets": [0], "controls": [1], "params": []},
    ]
    r = client.post("/api/v1/challenges/bell/submit", json=body)
    assert r.status_code == 200
    data = r.json()
    assert data["passed"] is False
    assert data["score"] < 100

def test_bell_challenge_distribution_balanced():
    # H on both qubits gives uniform distribution => not a Bell state
    body = dict(BELL_BODY)
    body["gates"] = [
        {"name": "h", "targets": [0], "controls": [], "params": []},
        {"name": "h", "targets": [1], "controls": [], "params": []},
    ]
    r = client.post("/api/v1/challenges/bell/submit", json=body)
    data = r.json()
    assert data["passed"] is False

def test_bell_challenge_noise_tolerated():
    # Correct structure always passes even with modest shot counts
    body = dict(BELL_BODY)
    body["shots"] = 1024
    r = client.post("/api/v1/challenges/bell/submit", json=body)
    data = r.json()
    assert data["passed"] is True

def test_unknown_challenge_404():
    r = client.post("/api/v1/challenges/nope/submit", json=BELL_BODY)
    assert r.status_code == 404

def test_challenge_invalid_circuit_400():
    body = dict(BELL_BODY)
    body["gates"] = [{"name": "bogus", "targets": [0], "controls": [], "params": []}]
    r = client.post("/api/v1/challenges/bell/submit", json=body)
    assert r.status_code == 400