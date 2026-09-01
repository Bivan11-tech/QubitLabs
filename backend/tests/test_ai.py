"""Gemini AI endpoint tests (stubbed service, no network / no real key)."""
from __future__ import annotations

from fastapi.testclient import TestClient

from backend.main import app
from backend.services.gemini import GeminiService, get_gemini_service
from backend.tests.helpers import bell_request

client = TestClient(app)

BELL_BODY = {
    "num_qubits": 2,
    "gates": [
        {"name": "h", "targets": [0], "controls": [], "params": []},
        {"name": "cx", "targets": [1], "controls": [0], "params": []},
    ],
    "shots": 1024,
}

class StubGemini(GeminiService):
    def __init__(self):
        super().__init__(api_key="stub")
        self.prompts = []

    def generate(self, prompt: str) -> str:
        self.prompts.append(prompt)
        return "The circuit makes a Bell state: (|00> + |11>)/√2."

def test_explain_circuit_with_gemini():
    stub = StubGemini()
    app.dependency_overrides[get_gemini_service] = lambda: stub
    try:
        r = client.post("/api/v1/explain-circuit", json=BELL_BODY)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ai_explanation"] == "The circuit makes a Bell state: (|00> + |11>)/√2."
        assert data["circuit_summary"]["num_qubits"] == 2
        assert data["circuit_summary"]["has_entanglement"] is True
        # the model must have received real circuit context
        joint = "\n".join(stub.prompts)
        assert "OPENQASM" in joint
        assert "cx" in joint.lower()
    finally:
        app.dependency_overrides.clear()

def test_chat_tutor_with_gemini():
    stub = StubGemini()
    app.dependency_overrides[get_gemini_service] = lambda: stub
    try:
        r = client.post(
            "/api/v1/chat-tutor",
            json={
                "num_qubits": 2,
                "gates": BELL_BODY["gates"],
                "user_question": "Why do I only get 00 and 11?",
                "chat_history": [
                    {"role": "user", "content": "what gates are in my circuit?"},
                    {"role": "model", "content": "H and CX."},
                ],
            },
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ai_response"].startswith("The circuit makes a Bell state")
        assert data["user_question"].startswith("Why")
        assert "Student: what gates" in "\n".join(stub.prompts)
    finally:
        app.dependency_overrides.clear()

def test_explain_circuit_without_key_returns_503():
    app.dependency_overrides[get_gemini_service] = lambda: GeminiService(api_key=None)
    try:
        r = client.post("/api/v1/explain-circuit", json=BELL_BODY)
        assert r.status_code == 503
        assert "GEMINI_API_KEY" in r.json()["detail"]
    finally:
        app.dependency_overrides.clear()

def test_explain_circuit_invalid_400():
    body = dict(BELL_BODY)
    body["gates"] = [{"name": "nope", "targets": [0], "controls": [], "params": []}]
    r = client.post("/api/v1/explain-circuit", json=body)
    assert r.status_code == 400

def test_chat_tutor_invalid_400():
    r = client.post(
        "/api/v1/chat-tutor",
        json={"num_qubits": 2, "gates": [{"name": "zzz", "targets": [0], "controls": [], "params": []}], "user_question": "hi"},
    )
    assert r.status_code == 400