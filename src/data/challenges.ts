import type { QuantumCircuit, SimulationResult } from '../lib/quantum/types'
import type { QuantumGate } from '../lib/quantum/types'

export interface ChallengeRequirement {
  id: string
  label: string
  check: (circuit: QuantumCircuit, result: SimulationResult | null) => boolean
}

export interface Challenge {
  id: string
  title: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  xp: number
  tag: string
  description: string
  goal: string
  hints: string[]
  starter: { qubits: number; gates: { type: QuantumGate['type']; qubit: number; moment: number }[] }
  requirements: ChallengeRequirement[]
  badgeId?: string
}

const DEFAULT_RESULT: SimulationResult = { counts: {}, probabilities: {}, statevector: [], entangled: false, executionTime: 0, backend: 'qiskit-aer', shots: 1024 }

const has = (circuit: QuantumCircuit, type: string): boolean => circuit.gates.some((g) => g.type === type)

export const CHALLENGES: Challenge[] = [
  {
    id: 'bell-state',
    title: 'Build a Bell State',
    difficulty: 'Beginner',
    xp: 100,
    tag: 'Entanglement',
    description: 'Create a circuit that produces the maximally entangled Bell state (|00⟩ + |11⟩)/√2.',
    goal: 'Program the H + CNOT recipe, measure both qubits, and confirm only 00 and 11 ever appear.',
    hints: [
      'Apply a Hadamard to q0 to create a superposition.',
      'Use a CNOT on q1 controlled by q0 to couple the qubits.',
      'Finish with measurement on both wires.',
      'A perfect Bell state shows exactly two histogram bars: 00 and 11.',
    ],
    starter: { qubits: 2, gates: [] },
    requirements: [
      { id: 'n-qubits', label: 'Use exactly 2 qubits', check: (c) => c.qubits === 2 },
      { id: 'hadamard', label: 'Use an H gate', check: (c) => has(c, 'H') },
      { id: 'cnot', label: 'Use a CNOT (CX)', check: (c) => has(c, 'CX') },
      { id: 'measure', label: 'Measure both qubits', check: (c) => c.gates.filter((g) => g.type === 'Measure').length >= 2 },
      {
        id: 'balanced',
        label: 'Only |00⟩ and |11⟩ outcomes (50/50 ± 15%)',
        check: (_c, res) => {
          const r = res ?? DEFAULT_RESULT
          const keys = Object.keys(r.probabilities).filter((k) => (r.probabilities[k] ?? 0) > 0.01)
          const p00 = r.probabilities['00'] ?? 0
          const p11 = r.probabilities['11'] ?? 0
          return keys.every((k) => k === '00' || k === '11') && Math.abs(p00 - 0.5) < 0.05 && Math.abs(p11 - 0.5) < 0.05
        },
      },
    ],
    badgeId: 'bell-builder',
  },
  {
    id: 'superposition-led',
    title: 'One-Qubit Superposition',
    difficulty: 'Beginner',
    xp: 50,
    tag: 'Fundamentals',
    description: 'Turn a |0⟩ qubit into an equal superposition of |0⟩ and |1⟩.',
    goal: 'Use a single gate so that measuring yields ~50% |0⟩ and ~50% |1⟩.',
    hints: ['The Hadamard gate is the standard way.', 'You only need one qubit.'],
    starter: { qubits: 1, gates: [] },
    requirements: [
      { id: 'single-h', label: 'One H gate', check: (c) => has(c, 'H') },
      {
        id: 'fifty',
        label: 'Measurements split ~50/50',
        check: (_c, res) => {
          const r = res ?? DEFAULT_RESULT
          return Math.abs((r.probabilities['0'] ?? 0) - 0.5) < 0.05
        },
      },
    ],
  },
  {
    id: 'grover-2q',
    title: 'Two-Qubit Grover Skeleton',
    difficulty: 'Intermediate',
    xp: 300,
    tag: 'Algorithms',
    description: 'Implement the amplitude-amplification skeleton of Grover’s search on 2 qubits.',
    goal: 'All-Hadamard diffuser scaffold with oracle-style phase kicks between H layers.',
    hints: [
      'Start from a uniform superposition: H on both qubits.',
      'Oracle: X, H, and a CNOT create a phase kick for a chosen target.',
      'Diffuser: H, X, CNOT(0→1), X, H inverts about the mean.',
    ],
    starter: {
      qubits: 2,
      gates: [
        { type: 'H', qubit: 0, moment: 0 },
        { type: 'H', qubit: 1, moment: 0 },
        { type: 'X', qubit: 0, moment: 1 },
        { type: 'H', qubit: 1, moment: 1 },
        { type: 'CX', qubit: 0, moment: 2 },
      ],
    },
    requirements: [
      { id: 'has-h', label: 'Hadamards on both qubits', check: (c) => c.gates.filter((g) => g.type === 'H').length >= 2 },
      { id: 'has-cx', label: 'At least one CNOT', check: (c) => has(c, 'CX') },
      {
        id: 'uneven',
        label: 'Output distribution is not uniform (amplification happened)',
        check: (_c, res) => {
          const r = res ?? DEFAULT_RESULT
          const vals = Object.values(r.probabilities)
          const spread = Math.max(...vals) - Math.min(...vals)
          return spread > 0.1
        },
      },
      { id: 'no-input', label: 'Starts from 2 qubits', check: (c) => c.qubits === 2 },
    ],
  },
  {
    id: 'teleport',
    title: 'Teleport a Qubit',
    difficulty: 'Intermediate',
    xp: 250,
    tag: 'Quantum Communication',
    description: 'Prototype the Bell-measurement teleportation protocol.',
    goal: 'Wire a Bell pair, entangle the input wire with it, and route the recovery gates (CZ, CX).',
    hints: [
      'Share a Bell pair between the middle and bottom wires: H then CNOT.',
      'Entangle the top (input) wire with the shared pair: CX, H.',
      'Recovery: CZ(middle→bottom) then CX(top→bottom).',
    ],
    starter: {
      qubits: 3,
      gates: [
        { type: 'H', qubit: 1, moment: 0 },
        { type: 'CX', qubit: 1, moment: 1 },
        { type: 'CX', qubit: 0, moment: 2 },
        { type: 'H', qubit: 0, moment: 3 },
        { type: 'CZ', qubit: 1, moment: 4 },
        { type: 'CX', qubit: 0, moment: 5 },
      ],
    },
    requirements: [
      { id: 'three-q', label: 'Exactly 3 qubits', check: (c) => c.qubits === 3 },
      { id: 'bell-pair', label: 'Bell pair between q1 and q2', check: (c) => has(c, 'CX') && has(c, 'H') },
    ],
  },
  {
    id: 'qft-2q',
    title: '2-Qubit Quantum Fourier Transform',
    difficulty: 'Advanced',
    xp: 400,
    tag: 'Algorithms',
    description: 'Compose the smallest QFT: H, controlled-Z (phase), and SWAP.',
    goal: 'Assemble H → CZ → H → SWAP and observe the phase-encoded output on the state vector.',
    hints: [
      'H on q0 is always the first move.',
      'A controlled phase (e.g. CZ) between q0 and q1 encodes the phase.',
      'Close with H on q1, then SWAP the register.',
    ],
    starter: {
      qubits: 2,
      gates: [],
    },
    requirements: [
      { id: 'two-h', label: 'Hadamard on both qubits', check: (c) => c.gates.filter((g) => g.type === 'H').length >= 2 },
      { id: 'controlled', label: 'A controlled two-qubit coupling', check: (c) => has(c, 'CZ') || has(c, 'CX') || has(c, 'CY') },
      { id: 'interferes', label: 'Interference appears (some amplitudes are complex)', check: (_c, res) => {
        const r = res ?? DEFAULT_RESULT
        return r.statevector.some((a) => Math.abs(a.im) > 1e-3)
      } },
    ],
  },
]

export function findChallenge(id: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id)
}