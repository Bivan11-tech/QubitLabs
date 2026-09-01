"""Quantum correctness tests for the simulator (backend/quantum/simulator.py)."""
from __future__ import annotations

import numpy as np

from backend.models.circuit import CircuitRequest
from backend.quantum.simulator import run_simulation, compute_bloch_vectors
from backend.quantum.validation import validate_circuit_request
from backend.tests.helpers import bell_request, ghz_request, g

INV_SQRT2 = 1 / np.sqrt(2)

def _run(gates, num_qubits=1, shots=4096):
    req = CircuitRequest(num_qubits=num_qubits, gates=gates, shots=shots)
    validate_circuit_request(req)
    return run_simulation(req)

def _amp(res, basis):
    for a in res["statevector"]:
        if a["basis"] == basis:
            return complex(a["re"], a["im"])
    return None

def test_x_gate_flips_zero_to_one():
    res = _run([g("x", targets=[0])])
    amp = _amp(res, "1")
    assert abs(amp - 1.0) < 1e-6
    assert res["probabilities"] == {"0": 0.0, "1": 1.0}

def test_h_gate_creates_equal_superposition():
    res = _run([g("h", targets=[0])])
    assert abs(_amp(res, "0") - INV_SQRT2) < 1e-6
    assert abs(_amp(res, "1") - INV_SQRT2) < 1e-6
    assert abs(res["probabilities"]["0"] - 0.5) < 1e-6
    assert abs(res["probabilities"]["1"] - 0.5) < 1e-6

def test_y_and_z_gates_preserve_probability():
    res_y = _run([g("h", targets=[0]), g("y", targets=[0])])
    res_z = _run([g("h", targets=[0]), g("z", targets=[0])])
    for res in (res_y, res_z):
        assert abs(res["probabilities"]["0"] - 0.5) < 1e-6
        assert abs(res["probabilities"]["1"] - 0.5) < 1e-6

def test_rx_rotation_matches_analytic():
    theta = np.pi / 3
    res = _run([g("rx", targets=[0], params=[theta])])
    # R_X(theta)|0> = cos(theta/2)|0> - i sin(theta/2)|1>
    assert abs(_amp(res, "0") - complex(np.cos(theta / 2), 0)) < 1e-6
    assert abs(_amp(res, "1") - complex(0, -np.sin(theta / 2))) < 1e-6

def test_ry_pi_is_x():
    res = _run([g("ry", targets=[0], params=[np.pi])])
    assert abs(_amp(res, "1") - 1.0) < 1e-6

def test_rz_does_not_change_probability():
    theta = np.pi / 3
    res = _run([g("rz", targets=[0], params=[theta])])
    assert res["probabilities"]["0"] == 1.0
    assert res["probabilities"]["1"] == 0.0

def test_bell_state_probabilities():
    res = _run(bell_request(shots=8192).gates, num_qubits=2, shots=8192)
    assert abs(res["probabilities"]["00"] - 0.5) < 1e-3
    assert abs(res["probabilities"]["11"] - 0.5) < 1e-3
    assert res["probabilities"].get("01", 0.0) < 1e-6
    assert res["probabilities"].get("10", 0.0) < 1e-6

def test_bell_statevector_ordering():
    res = _run(bell_request().gates, num_qubits=2)
    labels = [a["basis"] for a in res["statevector"]]
    assert labels == ["00", "01", "10", "11"]
    assert abs(abs(_amp(res, "00")) - INV_SQRT2) < 1e-3
    assert abs(abs(_amp(res, "11")) - INV_SQRT2) < 1e-3

def test_bell_measurement_counts_from_aer():
    res = _run(bell_request(shots=8000).gates, num_qubits=2, shots=8000)
    counts = res["measurement_counts"]
    assert {"00", "11"} == set(counts.keys())
    assert abs(counts["00"] / 8000 - 0.5) < 0.08
    assert abs(counts["11"] / 8000 - 0.5) < 0.08

def test_ghz_state():
    res = _run(ghz_request().gates, num_qubits=3)
    assert abs(res["probabilities"]["000"] - 0.5) < 1e-3
    assert abs(res["probabilities"]["111"] - 0.5) < 1e-3

def test_swap_exchanges():
    res = _run([g("x", targets=[0]), g("swap", targets=[0, 1])], num_qubits=2)
    assert res["probabilities"]["10"] == 1.0

def test_s_gate_phase():
    res = _run([g("h", targets=[0]), g("s", targets=[0])])
    amp = _amp(res, "1")
    assert abs(amp - complex(0, INV_SQRT2)) < 1e-6  # S|+> = (|0> + i|1>)/sqrt(2)

def test_bloch_vectors_real_calculation():
    res = _run(bell_request().gates, num_qubits=2)
    bloch = res["bloch_vectors"]
    assert len(bloch) == 2
    for b in bloch:
        coord = b["coordinates"]
        assert abs(coord["z"]) < 1e-6          # maximally mixed reduced state
        assert abs((coord["x"] ** 2 + coord["y"] ** 2)) < 1e-6

def test_bloch_vector_for_plus_state():
    res = _run([g("h", targets=[0])])
    bloch = res["bloch_vectors"][0]["coordinates"]
    assert abs(bloch["x"] - 1.0) < 1e-6
    assert abs(bloch["y"]) < 1e-6
    assert abs(bloch["z"]) < 1e-6

def test_result_contract_fields():
    res = _run(bell_request(shots=1024).gates, num_qubits=2, shots=1024)
    for field in [
        "num_qubits",
        "qasm",
        "statevector",
        "probabilities",
        "bloch_vectors",
        "measurement_counts",
        "circuit_depth",
        "total_gates",
        "gate_breakdown",
        "entangled",
        "shots",
    ]:
        assert field in res
    assert res["num_qubits"] == 2
    assert res["circuit_depth"] == 2
    assert res["total_gates"] == 2
    assert res["gate_breakdown"] == {"h": 1, "cx": 1}
    assert res["qasm"].startswith("OPENQASM")
    assert res["entangled"] is True

def test_single_qubit_not_entangled():
    res = _run([g("h", targets=[0])], num_qubits=1, shots=100)
    assert res["entangled"] is False