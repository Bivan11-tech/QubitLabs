import type { BackendId, QuantumCircuit, SimulationResult } from './quantum/types'
import { simulateCircuit } from './quantum/simulator'

/**
 * Unified simulation client.
 *
 * Mirrors the documented backend contract:
 *   POST /api/simulate { framework, backend, circuit, shots } -> SimulationResult
 * The browser engine implements the exact same result shape, so hooking up a
 * real Qiskit Aer / PennyLane / Cirq / qBraid backend later requires zero
 * changes to the Lab UI.
 */
export const SIMULATION_API = '/api/simulate'

export async function simulate(
  circuit: QuantumCircuit,
  backend: BackendId,
  shots: number,
): Promise<SimulationResult> {
  const started = performance.now()
  // minimal artificial latency so the submission feels like a real round-trip
  await new Promise((r) => setTimeout(r, 300))
  const result = simulateCircuit(circuit, backend, shots)
  const elapsed = Math.max(result.executionTime, Math.round((performance.now() - started) * 1000) / 1000)
  return { ...result, executionTime: elapsed }
}