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
    "bell": {
        "title": "Build a Bell State",
        "xp": 100,
    },
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

def _check_bell(req: ChallengeSubmitRequest, sim: dict) -> ChallengeResult:
    checks: List[ChallengeCheck] = []
    passed = True

    def add(ok: bool, label: str) -> None:
        nonlocal passed
        checks.append(ChallengeCheck(id=f"check-{len(checks)}", label=label, passed=ok))
        if not ok:
            passed = False

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

    score = round(100.0 * sum(1 for c in checks if c.passed) / len(checks))
    if passed:
        feedback = "Correct Bell state: H then CX on q0→q1 produces (|00> + |11>)/√2."
    else:
        missing = [c.label for c in checks if not c.passed]
        feedback = "Not a valid Bell state. Missing/incorrect: " + "; ".join(missing) + "."

    return ChallengeResult(
        challenge_id="bell",
        passed=passed,
        score=score,
        xp=CHALLENGES["bell"]["xp"] if passed else 0,
        feedback=feedback,
        checks=checks,
    )

@router.post("/challenges/{challenge_id}/submit")
def submit_challenge(challenge_id: str, req: ChallengeSubmitRequest) -> ChallengeResult:
    key = challenge_id.lower()
    if key not in CHALLENGES:
        raise HTTPException(
            status_code=404, detail=f"Unknown challenge '{challenge_id}'. Available: {sorted(CHALLENGES)}"
        )

    sim = _simulate(req)
    if key == "bell":
        return _check_bell(req, sim)
    raise HTTPException(status_code=500, detail="Challenge validator missing.")