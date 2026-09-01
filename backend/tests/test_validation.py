"""Tests for circuit request validation (backend/quantum/validation.py)."""
from __future__ import annotations

import pytest

from backend.models.circuit import CircuitRequest, MAX_QUBITS
from backend.quantum.validation import CircuitValidationError, validate_circuit_request
from backend.tests.helpers import bell_request, g

def _req(num_qubits=2, gates=None, shots=1024) -> CircuitRequest:
    return CircuitRequest(num_qubits=num_qubits, gates=gates or [], shots=shots)


def _raw(num_qubits=2, gates=None, shots=1024) -> CircuitRequest:
    """Build a request without pydantic field constraints so the
    validate_circuit_request() layer can be exercised directly."""
    return CircuitRequest.model_construct(
        num_qubits=num_qubits, gates=gates or [], shots=shots
    )

def test_valid_bell_passes():
    validate_circuit_request(bell_request())

def test_all_supported_gates_validate():
    gates = [
        g("h", targets=[0]),
        g("x", targets=[0]),
        g("y", targets=[0]),
        g("z", targets=[0]),
        g("s", targets=[0]),
        g("t", targets=[0]),
        g("sdg", targets=[0]),
        g("tdg", targets=[0]),
        g("rx", targets=[0], params=[0.5]),
        g("ry", targets=[0], params=[0.5]),
        g("rz", targets=[0], params=[0.5]),
        g("cx", targets=[1], controls=[0]),
        g("cy", targets=[1], controls=[0]),
        g("cz", targets=[1], controls=[0]),
        g("swap", targets=[0, 1]),
        g("ccx", targets=[2], controls=[0, 1]),
    ]
    validate_circuit_request(_req(num_qubits=3, gates=gates))

@pytest.mark.parametrize("bad", ["h2", "CNOT", "p", "crz", ""])
def test_unknown_gate_rejected(bad):
    with pytest.raises(CircuitValidationError, match="Unsupported gate"):
        validate_circuit_request(_req(gates=[g(bad, targets=[0])]))

def test_wrong_target_arity_rejected():
    with pytest.raises(CircuitValidationError, match="target"):
        validate_circuit_request(_req(gates=[g("h", targets=[0, 1])]))

def test_wrong_control_arity_rejected():
    with pytest.raises(CircuitValidationError, match="control"):
        validate_circuit_request(_req(gates=[g("cx", targets=[1])]))

def test_missing_rotation_param_rejected():
    with pytest.raises(CircuitValidationError, match="parameter"):
        validate_circuit_request(_req(gates=[g("rx", targets=[1])]))

def test_nonfinite_rotation_param_rejected():
    with pytest.raises(CircuitValidationError, match="non-finite"):
        validate_circuit_request(_req(gates=[g("rx", targets=[0], params=[float("inf")])]))

def test_target_out_of_range_rejected():
    with pytest.raises(CircuitValidationError, match="out of range"):
        validate_circuit_request(_req(num_qubits=2, gates=[g("h", targets=[5])]))

def test_control_out_of_range_rejected():
    with pytest.raises(CircuitValidationError, match="out of range"):
        validate_circuit_request(_req(num_qubits=2, gates=[g("cx", targets=[1], controls=[9])]))

def test_cx_same_control_target_rejected():
    with pytest.raises(CircuitValidationError, match="cannot equal"):
        validate_circuit_request(_req(gates=[g("cx", targets=[0], controls=[0])]))

def test_swap_same_targets_rejected():
    with pytest.raises(CircuitValidationError, match="distinct"):
        validate_circuit_request(_req(gates=[g("swap", targets=[1, 1])]))
def test_zero_qubits_rejected():
    with pytest.raises(CircuitValidationError, match="num_qubits"):
        validate_circuit_request(_raw(num_qubits=0))


@pytest.mark.parametrize("n", [MAX_QUBITS + 1, 30, 100])
def test_qubit_cap_enforced(n):
    with pytest.raises(CircuitValidationError, match="num_qubits"):
        validate_circuit_request(_raw(num_qubits=n))


@pytest.mark.parametrize("shots", [0, -5])
def test_bad_shots_rejected(shots):
    with pytest.raises(CircuitValidationError, match="shots"):
        validate_circuit_request(_raw(shots=shots))
def test_empty_circuit_is_valid():
    validate_circuit_request(_req(num_qubits=1))
    validate_circuit_request(bell_request())