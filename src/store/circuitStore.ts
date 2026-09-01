import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { simulateWithSource } from '../lib/api'
import type { SimulationSource } from '../lib/backend'
import type { BackendId, QuantumCircuit, QuantumGate, SimulationResult } from '../lib/quantum/types'
import { circuitToQiskit, qiskitToCircuit } from '../lib/quantum/qiskit'

export type LabMode = 'visual' | 'code'

interface CircuitState {
  circuit: QuantumCircuit
  backend: BackendId
  shots: number
  mode: LabMode
  code: string
  result: SimulationResult | null
  running: boolean
  source: SimulationSource
  backendError: string | null
  selectedGateId: string | null
  saved: QuantumCircuit[]
  saveCount: number

  setQubits: (n: number) => void
  addGate: (type: QuantumGate['type'], wire: number) => void
  addGateAt: (gate: QuantumGate) => void
  removeGate: (id: string) => void
  updateGate: (id: string, patch: Partial<QuantumGate>) => void
  clear: () => void
  newCircuit: () => void
  setBackend: (b: BackendId) => void
  setShots: (n: number) => void
  select: (id: string | null) => void
  setMode: (m: LabMode) => void
  setCode: (c: string) => void
  applyCode: () => void
  run: () => Promise<void>
  saveCircuit: () => void
  loadCircuit: (c: QuantumCircuit) => void
  exportJson: () => string
}

const id = () => crypto.randomUUID()

export function makeCircuit(name = 'Untitled circuit'): QuantumCircuit {
  return { id: id(), name, qubits: 2, gates: [] }
}

export function defaultBellCircuit(): QuantumCircuit {
  return {
    id: id(),
    name: 'Bell State',
    qubits: 2,
    gates: [
      { id: id(), type: 'H', qubits: [0], moment: 0 },
      { id: id(), type: 'CX', qubits: [0, 1], moment: 1 },
      { id: id(), type: 'Measure', qubits: [0], moment: 2 },
      { id: id(), type: 'Measure', qubits: [1], moment: 2 },
    ],
  }
}

export const useCircuitStore = create<CircuitState>()(
  persist(
    (set, get) => ({
      circuit: defaultBellCircuit(),
      backend: 'qiskit-aer',
      shots: 1024,
      mode: 'visual',
      code: '',
      result: null,
      running: false,
      source: 'local',
      backendError: null,
      selectedGateId: null,
      saved: [],
      saveCount: 0,

      setQubits: (n) => {
        const c = get().circuit
        if (n < 1 || n > 7) return
        const next = { ...c, qubits: n, gates: c.gates.filter((g) => g.qubits.every((q) => q < n)) }
        set({ circuit: next, result: null })
      },

      addGate: (type, wire) => {
        const { circuit } = get()
        const gate: QuantumGate = { id: id(), type, qubits: [wire], moment: 0 }
        set({ circuit: { ...circuit, gates: [...circuit.gates, gate] }, selectedGateId: gate.id })
      },

      addGateAt: (gate) => {
        const { circuit } = get()
        set({
          circuit: { ...circuit, gates: [...circuit.gates, gate] },
          selectedGateId: gate.id,
        })
      },

      removeGate: (gateId) => {
        const { circuit } = get()
        set({
          circuit: { ...circuit, gates: circuit.gates.filter((g) => g.id !== gateId) },
          selectedGateId: get().selectedGateId === gateId ? null : get().selectedGateId,
        })
      },

      updateGate: (gateId, patch) => {
        const { circuit } = get()
        set({
          circuit: { ...circuit, gates: circuit.gates.map((g) => (g.id === gateId ? { ...g, ...patch } : g)) },
        })
      },

      clear: () => {
        const c = get().circuit
        set({ circuit: { ...c, gates: [] }, result: null, selectedGateId: null })
      },

      newCircuit: () => {
        const c = get().circuit
        set({ circuit: { ...makeCircuit(), id: c.id }, result: null, selectedGateId: null, mode: 'visual' })
      },

      setBackend: (b) => set({ backend: b, result: null, source: 'local', backendError: null }),
      setShots: (n) => set({ shots: Math.max(1, Math.min(100000, n)), result: null, source: 'local', backendError: null }),
      select: (gateGateId) => set({ selectedGateId: gateGateId }),

      setMode: (m) => {
        const { circuit } = get()
        set({
          mode: m,
          code: m === 'code' ? circuitToQiskit(circuit) : get().code,
        })
      },

      setCode: (c) => set({ code: c }),

      applyCode: () => {
        const parsed = qiskitToCircuit(get().code, get().circuit.name)
        set({ circuit: parsed, mode: 'visual', result: null })
      },

      run: async () => {
        if (get().running) return
        set({ running: true })
        const { result, source, backendError } = await simulateWithSource(get().circuit, get().backend, get().shots)
        set({ result, running: false, source, backendError: backendError ?? null })
      },

      saveCircuit: () => {
        const { circuit } = get()
        const saved = [circuit, ...get().saved.filter((c) => c.id !== circuit.id)].slice(0, 20)
        set({ saved, saveCount: get().saveCount + 1 })
      },

      loadCircuit: (c) => set({ circuit: c, result: null, mode: 'visual' }),

      exportJson: () => {
        return JSON.stringify(get().circuit, null, 2)
      },
    }),
    {
      name: 'qpl-circuit',
      partialize: (s) => ({
        circuit: s.circuit,
        backend: s.backend,
        shots: s.shots,
        saved: s.saved,
      }),
    },
  ),
)