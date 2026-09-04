"""Backend-sourced challenge validation.

Challenges are verified server-side against the submitted circuit AND its real
simulation results (shot tolerance included). The frontend never grades itself.
"""
from __future__ import annotations
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException

from ..models.circuit import CircuitRequest
from ..models.challenge import ChallengeCheck, ChallengeResult, ChallengeSubmitRequest
from ..quantum.simulator import run_simulation
from ..quantum.validation import CircuitValidationError

router = APIRouter(prefix="/api/v1", tags=["challenges"])

CHALLENGES: Dict[str, dict] = {
    "bell": {"title": "Build a Bell State", "xp": 100},
    "bell-state": {"title": "Build a Bell State", "xp": 100},
    "superposition-led": {"title": "One-Qubit Superposition", "xp": 50},
    "grover-2q": {"title": "Two-Qubit Grover Skeleton", "xp": 300},
    "teleport": {"title": "Teleport a Qubit", "xp": 250},
    "qft-2q": {"title": "2-Qubit Quantum Fourier Transform", "xp": 400},
}

def _simulate(req: ChallengeSubmitRequest) -> dict:
    try:
        return run_simulation(
            CircuitRequest(num_qubits=req.num_qubits, gates=req.gates, shots=req.shots)
        )
    except CircuitValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

def _has_gate(req, name: str, targets=None, controls=None) -> bool:
    for g in req.gates:
        if g.name.lower() != name:
            continue
        if targets is not None and list(g.targets) != targets:
            continue
        if controls is not None and list(g.controls) != controls:
            continue
        return True
    return False

def _count_gates(req, name: str) -> int:
    return sum(1 for g in req.gates if g.name.lower() == name)

def _check(req: ChallengeSubmitRequest, sim: dict, checks_fn, feedback_pass: str = "") -> ChallengeResult:
    checks: List[ChallengeCheck] = []
    passed = True

    def add(ok: bool, label: str) -> None:
        nonlocal passed
        checks.append(ChallengeCheck(id=f"check-{len(checks)}", label=label, passed=ok))
        if not ok:
            passed = False

    checks_fn(req, sim, add)

    cid = req._challenge_id if hasattr(req, '_challenge_id') else "unknown"
    score = round(100.0 * sum(1 for c in checks if c.passed) / max(len(checks), 1))
    info = CHALLENGES.get(cid, {})

    if passed:
        feedback = feedback_pass or f"Correct solution for {info.get('title', cid)}!"
    else:
        missing = [c.label for c in checks if not c.passed]
        feedback = "Not quite. Missing/incorrect: " + "; ".join(missing) + "."

    return ChallengeResult(
        challenge_id=cid,
        passed=passed,
        score=score,
        xp=info.get("xp", 0) if passed else 0,
        feedback=feedback,
        checks=checks,
    )

def _check_bell_state(req, sim, add):
    add(req.num_qubits == 2, "Use exactly 2 qubits")
    add(_has_gate(req, "h", targets=[0]), "Apply H to qubit q0")
    add(_has_gate(req, "cx", targets=[1], controls=[0]), "Apply CX controlled by q0 → q1")
    add(_has_gate(req, "h"), "Circuit contains a Hadamard gate")
    p = sim["probabilities"]
    p00 = p.get("00", 0.0)
    p11 = p.get("11", 0.0)
    others = sum(v for k, v in p.items() if k not in ("00", "11") and v > 0.01)
    balanced = others == 0.0 and abs(p00 - 0.5) < 0.15 and abs(p11 - 0.5) < 0.15
    add(balanced, "Distribution is balanced between |00> and |11> (±15%)")

def _check_superposition(req, sim, add):
    add(req.num_qubits >= 1, "Use at least 1 qubit")
    add(_count_gates(req, "h") >= 1, "Circuit contains at least one Hadamard gate")
    p = sim["probabilities"]
    p0 = p.get("0", 0.0)
    p1 = p.get("1", 0.0)
    if req.num_qubits == 1:
        add(abs(p0 - 0.5) < 0.1, "Measurement split is ~50/50 (±10%)")

def _check_grover_2q(req, sim, add):
    add(req.num_qubits == 2, "Use exactly 2 qubits")
    add(_count_gates(req, "h") >= 2, "At least 2 Hadamard gates (both qubits)")
    add(_has_gate(req, "cx") or _has_gate(req, "cz"), "At least one two-qubit gate (CX or CZ)")
    p = sim["probabilities"]
    vals = list(p.values())
    if len(vals) >= 2:
        spread = max(vals) - min(vals)
        add(spread > 0.1, "Output distribution is not uniform (amplification happened)")

def _check_teleport(req, sim, add):
    add(req.num_qubits == 3, "Use exactly 3 qubits")
    add(_has_gate(req, "h"), "Circuit contains a Hadamard gate")
    add(_count_gates(req, "cx") >= 2, "At least 2 CNOT gates")

def _check_qft_2q(req, sim, add):
    add(req.num_qubits == 2, "Use exactly 2 qubits")
    add(_count_gates(req, "h") >= 2, "Hadamard on both qubits")
    add(_has_gate(req, "cx") or _has_gate(req, "cz"), "A controlled two-qubit coupling (CX or CZ)")

_VALIDATORS = {
    "bell": _check_bell_state,
    "bell-state": _check_bell_state,
    "superposition-led": _check_superposition,
    "grover-2q": _check_grover_2q,
    "teleport": _check_teleport,
    "qft-2q": _check_qft_2q,
}

@router.post("/challenges/{challenge_id}/submit")
def submit_challenge(challenge_id: str, req: ChallengeSubmitRequest) -> ChallengeResult:
    key = challenge_id.lower()
    if key not in CHALLENGES:
        raise HTTPException(
            status_code=404, detail=f"Unknown challenge '{challenge_id}'. Available: {sorted(CHALLENGES)}"
        )
    req._challenge_id = key  # type: ignore[attr-defined]
    sim = _simulate(req)
    validator = _VALIDATORS.get(key)
    if validator is None:
        raise HTTPException(status_code=500, detail="Challenge validator missing.")
    feedback_pass = "Correct Bell state: H then CX on q0→q1 produces (|00> + |11>)/√2." if key in ("bell", "bell-state") else ""
    return _check(req, sim, validator, feedback_pass=feedback_pass)
