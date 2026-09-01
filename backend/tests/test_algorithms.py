"""Tests for the built-in algorithm templates (backend/quantum/algorithms.py)."""
from __future__ import annotations

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

from backend.quantum.algorithms import (
    TEMPLATES,
    bell_template,
    deutsch_jozsa_template,
    get_template,
    ghz_template,
    grover_template,
    qft_template,
    teleportation_template,
)
from backend.quantum.circuit_builder import build_circuit_from_gates
from backend.quantum.simulator import run_simulation
from backend.quantum.validation import (
    CircuitValidationError,
    validate_circuit_request,
)
from backend.tests.helpers import reduced_rho_of

def _probs(template):
    validate_circuit_request(template)
    return run_simulation(template)["probabilities"]

def test_all_templates_registered():
    assert set(TEMPLATES) == {
        "bell",
        "ghz",
        "deutsch-jozsa",
        "teleportation",
        "grover",
        "qft",
    }

def test_unknown_template_rejected():
    try:
        get_template("not-a-thing")
    except CircuitValidationError:
        return
    raise AssertionError("unknown template should raise")

def test_bell_template():
    p = _probs(bell_template())
    assert abs(p["00"] - 0.5) < 1e-3
    assert abs(p["11"] - 0.5) < 1e-3
    assert p.get("01", 0) < 1e-6
    assert p.get("10", 0) < 1e-6

def test_ghz_template():
    p = _probs(ghz_template())
    assert abs(p["000"] - 0.5) < 1e-3
    assert abs(p["111"] - 0.5) < 1e-3

def test_deutsch_jozsa_template_balanced():
    p = _probs(deutsch_jozsa_template())
    # Balanced oracle => q0 measures |1> (outcomes 01 or 11)
    assert abs(p.get("01", 0) + p.get("11", 0) - 1.0) < 1e-3

def test_teleportation_template():
    state_x = QuantumCircuit(3)
    state_x.x(0)  # teleport |1>
    _append_template(state_x, teleportation_template())

    state_plus = QuantumCircuit(3)
    state_plus.h(0)  # teleport |+>
    _append_template(state_plus, teleportation_template())

    rho_x = reduced_rho_of(state_x, 2)
    rho_plus = reduced_rho_of(state_plus, 2)

    # After teleportation the state of q2 equals the prepared input
    assert np.allclose(rho_x, [[0, 0], [0, 1]], atol=1e-6)
    assert np.allclose(rho_plus, [[0.5, 0.5], [0.5, 0.5]], atol=1e-6)

def test_grover_template_marks_target():
    p = _probs(grover_template())
    assert p.get("11", 0) > 0.95  # single iteration marks |11> with near-certainty

def test_qft_template_matches_reference():
    qft = qft_template()
    validate_circuit_request(qft)
    circuit = build_circuit_from_gates(qft)

    reference = QuantumCircuit(2)
    reference.h(0)
    reference.cp(np.pi / 2, 0, 1)
    reference.h(1)
    reference.swap(0, 1)

    for label, qubits in [("00", [False, False]), ("10", [True, False])]:
        ours = _evolve_input(circuit, *qubits)
        ref = _evolve_input(reference, *qubits)
        # transpilation only differs by a global phase
        assert abs(np.vdot(ref, ours)) > 1 - 1e-8

def _append_template(qc: QuantumCircuit, template) -> None:
    templated = build_circuit_from_gates(template)
    qc.append(templated.to_gate(), list(range(template.num_qubits)))

def _evolve_input(circuit: QuantumCircuit, q0_one: bool, q1_one: bool):
    prep = QuantumCircuit(2)
    if q0_one:
        prep.x(0)
    if q1_one:
        prep.x(1)
    combined = prep.compose(circuit)
    return Statevector(combined).data