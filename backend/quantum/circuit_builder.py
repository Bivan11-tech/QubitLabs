"""Turn a validated canonical CircuitRequest into a real Qiskit circuit."""
from __future__ import annotations


from qiskit import QuantumCircuit

from ..models.circuit import CircuitRequest
from .validation import CircuitValidationError

def build_circuit_from_gates(req: CircuitRequest) -> QuantumCircuit:
    """

Build a Qiskit QuantumCircuit from a canonical CircuitRequest.

    The request must already be validated (see quantum.validation). This method
    never silently drops a gate: anything unexpected raises.
    """
    qc = QuantumCircuit(req.num_qubits)

    for g in req.gates:
        name = g.name.lower()
        t = g.targets
        c = g.controls
        p = g.params

        if name == "h":
            qc.h(t[0])
        elif name == "x":
            qc.x(t[0])
        elif name == "y":
            qc.y(t[0])
        elif name == "z":
            qc.z(t[0])
        elif name == "s":
            qc.s(t[0])
        elif name == "t":
            qc.t(t[0])
        elif name == "sdg":
            qc.sdg(t[0])
        elif name == "tdg":
            qc.tdg(t[0])
        elif name == "rx":
            qc.rx(p[0], t[0])
        elif name == "ry":
            qc.ry(p[0], t[0])
        elif name == "rz":
            qc.rz(p[0], t[0])
        elif name == "cx":
            qc.cx(c[0], t[0])
        elif name == "cy":
            qc.cy(c[0], t[0])
        elif name == "cz":
            qc.cz(c[0], t[0])
        elif name == "swap":
            qc.swap(t[0], t[1])
        elif name == "ccx":
            qc.ccx(c[0], c[1], t[0])
        else:
            raise CircuitValidationError(f"Unsupported gate type: '{name}'")

    return qc