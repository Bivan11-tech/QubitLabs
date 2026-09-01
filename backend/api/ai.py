"""Gemini-powered AI tutor endpoints.

The frontend only ever talks to FastAPI; the Gemini key never leaves the backend.
Both endpoints build real circuit context (gates, QASM, statevector, counts,
Bloch vectors, analysis) before calling Gemini so the model cannot hallucinate
circuit behaviour from a bare description.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from ..models.ai import AIChatRequest
from ..models.circuit import CircuitRequest
from ..quantum.analysis import analyze_request
from ..quantum.simulator import run_simulation
from ..quantum.validation import CircuitValidationError
from ..services.gemini import GeminiNotConfiguredError, GeminiService, get_gemini_service
router = APIRouter(prefix="/api/v1", tags=["ai"])


def _gemini_failure(exc: Exception) -> HTTPException:
    return HTTPException(status_code=503, detail=str(exc))
@router.post("/explain-circuit")
def explain_circuit(
    req: CircuitRequest,
    gemini: GeminiService = Depends(get_gemini_service),
) -> dict:
    try:
        sim = run_simulation(req)
        analysis = analyze_request(req)
    except CircuitValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    prompt = (
        "You are an interactive Quantum Computing AI Tutor. Explain the user's "
        "quantum circuit clearly in 3 short sections:\n"
        "1. **Circuit Goal**: What does this circuit construct?\n"
        "2. **Quantum Mechanics**: Explain what the gates are doing to the state vector.\n"
        "3. **Measurement Result**: Explain what the probabilities and counts mean.\n\n"
        "Be beginner-friendly but scientifically correct. Base everything on the "
        "actual circuit data below; do not invent gates or behaviour.\n\n"
        f"OpenQASM Code:\n{sim['qasm']}\n\n"
        f"State Probabilities: {sim['probabilities']}\n"
        f"Bloch Vectors: {sim['bloch_vectors']}\n"
        f"Measurement Counts: {sim['measurement_counts']}\n"
        f"Context Summary: {analysis['analysis_context']}"
    )

    try:
        explanation = gemini.generate(prompt)
    except GeminiNotConfiguredError as exc:
        raise _gemini_failure(exc)

    return {
        "circuit_summary": {
            "num_qubits": analysis["num_qubits"],
            "circuit_depth": analysis["circuit_depth"],
            "total_gates": analysis["total_gates"],
            "gate_breakdown": analysis["gate_breakdown"],
            "has_entanglement": analysis["has_entanglement"],
            "probabilities": analysis["probabilities"],
            "qasm": analysis["qasm"],
        },
        "ai_explanation": explanation,
    }

@router.post("/chat-tutor")
def chat_tutor(
    req: AIChatRequest,
    gemini: GeminiService = Depends(get_gemini_service),
) -> dict:
    circuit_req = CircuitRequest(num_qubits=req.num_qubits, gates=req.gates, shots=1024)
    try:
        sim = run_simulation(circuit_req)
        analysis = analyze_request(circuit_req)
    except CircuitValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    prompt = (
        "You are a knowledgeable Quantum Computing AI Assistant.\n\n"
        "The student is looking at THIS exact circuit, so answer using its real data:\n"
        f"- QASM: {sim['qasm']}\n"
        f"- Probabilities: {sim['probabilities']}\n"
        f"- Statevector: {sim['statevector']}\n"
        f"- Measurement counts: {sim['measurement_counts']}\n"
        f"- Bloch vectors: {sim['bloch_vectors']}\n"
        f"- Analysis: {analysis['analysis_context']}\n\n"
        f"Student Question: {req.user_question}\n\n"
        "Answer conversationally based on the circuit above. If the question is a "
        "general quantum concept, explain it clearly with this circuit as context. "
        "Do not fabricate results."
    )

    try:
        reply = gemini.chat(prompt, req.chat_history)
    except GeminiNotConfiguredError as exc:
        raise _gemini_failure(exc)

    return {"user_question": req.user_question, "ai_response": reply}