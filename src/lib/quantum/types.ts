export type GateType =
  | 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'Sdg' | 'Tdg'
  | 'RX' | 'RY' | 'RZ'
  | 'CX' | 'CY' | 'CZ' | 'SWAP'
  | 'Measure'

export interface QuantumGate {
  id: string
  type: GateType
  /** target qubit(s); for two-qubit gates the first entry is the control/top wire */
  qubits: number[]
  /** rotation angle(s) in radians for RX/RY/RZ */
  params?: number[]
  /** horizontal slot (column) in the circuit grid */
  moment: number
}

export interface QuantumCircuit {
  id: string
  name: string
  qubits: number
  gates: QuantumGate[]
}

export type BackendId = 'qiskit-aer' | 'pennylane' | 'cirq' | 'qbraid'

export interface SimRequest {
  circuit: QuantumCircuit
  backend: BackendId
  shots: number
}

export interface Amplitude {
  basis: string
  re: number
  im: number
}

export interface SimulationResult {
  counts: Record<string, number>
  probabilities: Record<string, number>
  statevector: Amplitude[]
  entangled: boolean
  executionTime: number
  backend: BackendId
  shots: number
}

export const BACKENDS: { id: BackendId; label: string; blurb: string }[] = [
  { id: 'qiskit-aer', label: 'Qiskit Aer', blurb: 'High-performance pure state simulator' },
  { id: 'pennylane', label: 'PennyLane', blurb: 'Differentiable quantum simulator' },
  { id: 'cirq', label: 'Cirq', blurb: 'Framework for noisy intermediate-scale quantum' },
  { id: 'qbraid', label: 'qBraid', blurb: 'Unified cloud runtime' },
]

export const GATE_META: Record<GateType, {
  label: string
  qubitCount: number
  standard: boolean
  needsParam?: boolean
  color: string
  description: string
}> = {
  H: { label: 'H', qubitCount: 1, standard: true, color: '#818cf8', description: 'Hadamard — creates superposition' },
  X: { label: 'X', qubitCount: 1, standard: true, color: '#f472b6', description: 'Pauli-X — quantum NOT bit-flip' },
  Y: { label: 'Y', qubitCount: 1, standard: true, color: '#fb7185', description: 'Pauli-Y — bit and phase flip' },
  Z: { label: 'Z', qubitCount: 1, standard: true, color: '#a78bfa', description: 'Pauli-Z — phase flip' },
  S: { label: 'S', qubitCount: 1, standard: true, color: '#38bdf8', description: 'S — phase (i) gate (√Z)' },
  T: { label: 'T', qubitCount: 1, standard: true, color: '#fbbf24', description: 'T — phase (π/4) gate (√S)' },
  Sdg: { label: 'S†', qubitCount: 1, standard: true, color: '#2dd4bf', description: 'S† — conjugate transpose of S' },
  Tdg: { label: 'T†', qubitCount: 1, standard: true, color: '#f97316', description: 'T† — conjugate of T' },
  RX: { label: 'RX', qubitCount: 1, standard: true, needsParam: true, color: '#34d399', description: 'Rotation about the X axis' },
  RY: { label: 'RY', qubitCount: 1, standard: true, needsParam: true, color: '#4ade80', description: 'Rotation about the Y axis' },
  RZ: { label: 'RZ', qubitCount: 1, standard: true, needsParam: true, color: '#64748b', description: 'Rotation about the Z axis' },
  CX: { label: 'CX', qubitCount: 2, standard: true, color: '#22d3ee', description: 'Controlled-X (CNOT) — entangles' },
  CY: { label: 'CY', qubitCount: 2, standard: true, color: '#e879f9', description: 'Controlled-Y' },
  CZ: { label: 'CZ', qubitCount: 2, standard: true, color: '#a3e635', description: 'Controlled-Z' },
  SWAP: { label: 'SWAP', qubitCount: 2, standard: true, color: '#f87171', description: 'Swaps two qubits' },
  Measure: { label: 'M', qubitCount: 1, standard: true, color: '#0ea5e9', description: 'Measure qubit into classical bit' },
}

export const PALETTE_GROUPS: { group: string; gates: GateType[] }[] = [
  { group: 'Single-Qubit', gates: ['H', 'X', 'Y', 'Z'] },
  { group: 'Phase', gates: ['S', 'T', 'Sdg', 'Tdg'] },
  { group: 'Rotations', gates: ['RX', 'RY', 'RZ'] },
  { group: 'Two-Qubit', gates: ['CX', 'CY', 'CZ', 'SWAP'] },
  { group: 'Measurement', gates: ['Measure'] },
]