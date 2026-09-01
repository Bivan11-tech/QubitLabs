import type { Amplitude, BackendId, QuantumCircuit, QuantumGate, SimulationResult } from './quantum/types'

/**
 * QubitLabs backend client + gate-format adapter.
 *
 * The frontend has always used its own `QuantumGate` shape (uppercase types,
 * `qubits` with control-first). The FastAPI backend uses a canonical
 * `GateInstruction` (lowercase `name`, separate `targets` / `controls`,
 * numeric `params`). This module translates between the two and ships the
 * request/response over HTTP — no UI code ever sees the wire format.
 */

export type SimulationSource = 'backend' | 'local'

export interface GateInstruction {
  name: string
  targets: number[]
  controls: number[]
  params: number[]
}

export interface BlochVector {
  qubit: number
  coordinates: { x: number; y: number; z: number }
}

/** The raw JSON returned by POST /api/v1/simulate. */
export interface BackendSimulationResult {
  num_qubits: number
  qasm: string
  statevector: Amplitude[]
  probabilities: Record<string, number>
  bloch_vectors: BlochVector[]
  measurement_counts: Record<string, number>
  circuit_depth: number
  total_gates: number
  gate_breakdown: Record<string, number>
  entangled: boolean
  shots: number
}

const GATE_NAMES: Partial<Record<QuantumGate['type'], string>> = {
  H: 'h', X: 'x', Y: 'y', Z: 'z', S: 's', T: 't', Sdg: 'sdg', Tdg: 'tdg',
  RX: 'rx', RY: 'ry', RZ: 'rz',
  CX: 'cx', CY: 'cy', CZ: 'cz', SWAP: 'swap',
}

const CONTROLLED: QuantumGate['type'][] = ['CX', 'CY', 'CZ']

/** Translate the visual-editor gate list into backend GateInstructions.
 *
 * Measurement gates are dropped: with no measurement instructions the backend
 * samples every wire (Qiskit `measure_all()`), which matches the local engine
 * that always sampled the full n-bit register.
 */
export function toGateInstructions(circuit: QuantumCircuit): GateInstruction[] {
  const out: GateInstruction[] = []
  for (const g of circuit.gates) {
    if (g.type === 'Measure') continue
    const name = GATE_NAMES[g.type]
    if (!name) continue
    const controlled = CONTROLLED.includes(g.type)
    out.push({
      name,
      targets: controlled ? [g.qubits[1]] : [...g.qubits],
      controls: controlled ? [g.qubits[0]] : [],
      params: g.params ?? [],
    })
  }
  return out
}

/** API root. Empty means "same origin" → Vite dev proxy serves /api and /health. */
export const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

interface RequestOptions {
  method?: string
  body?: unknown
}

async function requestJson<T>(path: string, opts: RequestOptions = {}, timeoutMs = 12_000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: ctrl.signal,
    })
    const raw = await res.text()
    let data: unknown = null
    if (raw) {
      try {
        data = JSON.parse(raw)
      } catch {
        data = raw
      }
    }
    if (!res.ok) {
      const detail = data && typeof data === 'object' && 'detail' in data ? (data as { detail?: unknown }).detail : raw
      throw new Error(`Backend request failed (${res.status}): ${String(detail) || res.statusText}`)
    }
    return data as T
  } finally {
    clearTimeout(timer)
  }
}

export async function runBackendSimulation(
  circuit: QuantumCircuit,
  _backend: BackendId,
  shots: number,
): Promise<BackendSimulationResult> {
  return requestJson<BackendSimulationResult>('/api/v1/simulate', {
    method: 'POST',
    body: { num_qubits: circuit.qubits, gates: toGateInstructions(circuit), shots },
  })
}

export function toSimulationResult(
  raw: BackendSimulationResult,
  backend: BackendId,
  shots: number,
  executionTime: number,
): SimulationResult {
  return {
    counts: raw.measurement_counts,
    probabilities: raw.probabilities,
    statevector: raw.statevector,
    entangled: raw.entangled,
    executionTime,
    backend,
    shots,
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await requestJson<{ status?: string }>('/health', {}, 3000)
    return res?.status === 'ok'
  } catch {
    return false
  }
}