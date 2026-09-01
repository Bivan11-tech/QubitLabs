"""Circuit analysis: statistics plus meaningful entanglement detection.

Entanglement is NOT declared simply because a CX is present. A controlled gate
only *has the potential* to entangle. We compute single-qubit reduced density
matrices and their purity instead:

    purity = Tr(rho^2)

For a pure global state, a reduced qubit with purity < 1 is genuinely mixed,
i.e. entangled with the rest of the system. We distinguish:

    * an entangling gate is present (structural fact)
    * the resulting state actually appears entangled (purity-based fact)
"""
from __future__ import annotations

from ..models.circuit import CircuitRequest
from ..quantum.circuit_builder import build_circuit_from_gates
from ..quantum.simulator import basis_strings, reduced_purity, run_simulation

ENTANGLING_GATE_NAMES = {"cx", "cy", "cz", "ccx"}

_PURITY_EPS = 1e-6

def entangling_gate_present(req: CircuitRequest) -> bool:
    return any(g.name.lower() in ENTANGLING_GATE_NAMES for g in req.gates)

def analyze_request(req: CircuitRequest) -> dict:
    """

Run full analysis for a circuit (used by /analyze-circuit and the AI)."""
    qc = build_circuit_from_gates(req)
    sim = run_simulation(req)

    gate_breakdown = dict(qc.count_ops())
    total_gates = sum(gate_breakdown.values())
    circuit_depth = qc.depth()

    active = sum(1 for a in sim["statevector"] if abs(a["re"]) > 1e-5 or abs(a["im"]) > 1e-5)

    purity = reduced_purity(qc)
    has_entanglement = bool(purity < 1.0 - _PURITY_EPS)

    probs = {
        b: round(float(p), 6)
        for b, p in zip(basis_strings(req.num_qubits), sim["probabilities"].values())
    }

    context = (
        f"Circuit with {req.num_qubits} qubits, depth {circuit_depth}, "
        f"and {total_gates} gate(s) ({gate_breakdown}). "
        f"Entangling gate present: {entangling_gate_present(req)}. "
        f"Resulting state appears entangled: {has_entanglement} "
        f"(min reduced purity {round(purity, 6)}). "
        f"{active} active basis state(s); "
        f"probabilities: {probs}."
    )

    return {
        "num_qubits": req.num_qubits,
        "circuit_depth": circuit_depth,
        "total_gates": total_gates,
        "gate_breakdown": gate_breakdown,
        "has_entanglement": has_entanglement,
        "entangle_gate_present": entangling_gate_present(req),
        "active_basis_states_count": active,
        "probabilities": probs,
        "qasm": sim["qasm"],
        "analysis_context": context,
    }