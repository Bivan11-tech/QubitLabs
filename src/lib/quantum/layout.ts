import type { QuantumCircuit, QuantumGate } from './types'

export type CellKind = 'idle' | 'gate' | 'measure' | 'control' | 'target'

export interface Cell {
  wire: number
  moment: number
  kind: CellKind
  gate?: QuantumGate
  /** for a control cell: the target wire */
  tgtWire?: number
  /** for a target cell: the control wire */
  ctrlWire?: number
}

export interface CircuitLayout {
  moments: number
  wires: number
  cells: (Cell | null)[][] // [moment][wire]
}

/** Build a cell grid model for the circuit canvas. */
export function layoutCircuit(circuit: QuantumCircuit): CircuitLayout {
  const wires = circuit.qubits
  const moments = Math.max(0, ...circuit.gates.map((g) => g.moment)) + 1

  const cells: (Cell | null)[][] = Array.from({ length: moments }, () => Array.from({ length: wires }, () => null))

  for (const gate of circuit.gates) {
    if (gate.qubits.length === 1) {
      cells[gate.moment][gate.qubits[0]] = {
        wire: gate.qubits[0],
        moment: gate.moment,
        kind: gate.type === 'Measure' ? 'measure' : 'gate',
        gate,
      }
    } else if (gate.type === 'Measure') {
      for (const w of gate.qubits) {
        cells[gate.moment][w] = { wire: w, moment: gate.moment, kind: 'measure', gate }
      }
    } else {
      const [ctrl, tgt] = gate.qubits
      cells[gate.moment][ctrl] = { wire: ctrl, moment: gate.moment, kind: 'control', gate, tgtWire: tgt }
      cells[gate.moment][tgt] = { wire: tgt, moment: gate.moment, kind: 'target', gate, ctrlWire: ctrl }
    }
  }

  return { moments, wires, cells }
}

/** find the next moment slot where a gate touching `wires` can be placed */
export function nextFreeMoment(gates: QuantumGate[], wires: number[], maxShuffle = 1): number {
  const used = new Set<number>()
  for (const w of wires) {
    for (const g of gates) {
      if (g.qubits.includes(w)) used.add(g.moment)
    }
  }
  let m = 0
  while (used.has(m) && m <= maxShuffle * 6) m++
  return m
}

/** moment index snapped into the canvas grid */
export function momentFromX(x: number, colWidth: number, labelWidth: number): number {
  const t = Math.max(0, Math.floor((x - labelWidth) / colWidth))
  return t
}