import type { BackendId, QuantumCircuit, SimulationResult } from './quantum/types'
import { simulateCircuit } from './quantum/simulator'
import { runBackendSimulation, toSimulationResult, type SimulationSource } from './backend'

/**
 * Unified simulation client.
 *
 * Simulates the circuit on the real FastAPI/Qiskit backend first; if the
 * backend is unreachable or rejects the request, it falls back to the built-in
 * state-vector engine so the Lab keeps working offline. Both engines return the
 * same SimulationResult shape, so the UI never changes based on the source.
 */

export interface SimulateOutcome {
  result: SimulationResult
  source: SimulationSource
  backendError?: string
}

export async function simulateWithSource(
  circuit: QuantumCircuit,
  backend: BackendId,
  shots: number,
): Promise<SimulateOutcome> {
  const started = performance.now()
  try {
    const raw = await runBackendSimulation(circuit, backend, shots)
    const elapsed = Math.max(0.001, Math.round((performance.now() - started) * 1000) / 1000)
    return { result: toSimulationResult(raw, backend, shots, elapsed), source: 'backend' }
  } catch (err) {
    const backendError = err instanceof Error ? err.message : String(err)
    const result = simulateCircuit(circuit, backend, shots)
    result.backend = 'local-engine'
    return { result, source: 'local', backendError }
  }
}