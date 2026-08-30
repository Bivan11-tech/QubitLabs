import type { GateType, QuantumCircuit, QuantumGate } from './types'

const METHOD: Record<GateType, string> = {
  H: 'h', X: 'x', Y: 'y', Z: 'z', S: 's', T: 't', Sdg: 'sdg', Tdg: 'tdg',
  RX: 'rx', RY: 'ry', RZ: 'rz',
  CX: 'cx', CY: 'cy', CZ: 'cz', SWAP: 'swap',
  Measure: 'measure',
}

/** Generate Qiskit source code from a circuit data structure. */
export function circuitToQiskit(circuit: QuantumCircuit): string {
  const n = circuit.qubits
  const lines: string[] = []
  lines.push('from qiskit import QuantumCircuit')
  lines.push('')
  lines.push(`qc = QuantumCircuit(${n}, ${n})`)
  lines.push('')

  const gates = [...circuit.gates].filter((g) => g.type !== 'Measure').sort((a, b) => a.moment - b.moment)
  for (const g of gates) {
    const m = METHOD[g.type]
    const args = g.params && g.params.length ? [fmt31(g.params[0]), ...g.qubits] : g.qubits
    lines.push(`qc.${m}(${args.join(', ')})`)
  }

  const measures = circuit.gates.filter((g) => g.type === 'Measure')
  if (measures.length) {
    const wires = measures.map((g) => g.qubits[0])
    lines.push('')
    lines.push(`qc.measure([${wires.join(', ')}], [${wires.join(', ')}])`)
  }

  lines.push('')
  lines.push('# Simulate on Qiskit Aer')
  lines.push('from qiskit import transpile')
  lines.push('from qiskit_aer import AerSimulator')
  lines.push('')
  lines.push('simulator = AerSimulator()')
  lines.push('compiled = transpile(qc, simulator)')
  lines.push('result = simulator.run(compiled, shots=1024).result()')
  lines.push('print(result.get_counts(qc))')
  return lines.join('\n')
}

function fmt31(x: number): string {
  const r = Math.round(x * 1e4) / 1e4
  return r === 0 ? '0' : r === 1 ? '1' : String(r)
}

type ParsedGate = Omit<QuantumGate, 'id' | 'moment'>

const parseGate: Record<string, (a: string[]) => ParsedGate | null> = {
  h: (a) => ({ type: 'H', qubits: [pick(a, 0)] }),
  x: (a) => ({ type: 'X', qubits: [pick(a, 0)] }),
  y: (a) => ({ type: 'Y', qubits: [pick(a, 0)] }),
  z: (a) => ({ type: 'Z', qubits: [pick(a, 0)] }),
  s: (a) => ({ type: 'S', qubits: [pick(a, 0)] }),
  t: (a) => ({ type: 'T', qubits: [pick(a, 0)] }),
  sdg: (a) => ({ type: 'Sdg', qubits: [pick(a, 0)] }),
  tdg: (a) => ({ type: 'Tdg', qubits: [pick(a, 0)] }),
  cx: (a) => ({ type: 'CX', qubits: [pick(a, 0), pick(a, 1)] }),
  cy: (a) => ({ type: 'CY', qubits: [pick(a, 0), pick(a, 1)] }),
  cz: (a) => ({ type: 'CZ', qubits: [pick(a, 0), pick(a, 1)] }),
  swap: (a) => ({ type: 'SWAP', qubits: [pick(a, 0), pick(a, 1)] }),
  rx: (a) => ({ type: 'RX', qubits: [pickNum(a, 1)], params: [parseFloat(a[0] ?? '0')] }),
  ry: (a) => ({ type: 'RY', qubits: [pickNum(a, 1)], params: [parseFloat(a[0] ?? '0')] }),
  rz: (a) => ({ type: 'RZ', qubits: [pickNum(a, 1)], params: [parseFloat(a[0] ?? '0')] }),
  measure: (a) => {
    const wires = flattenInts(a[0] ?? '')
    if (wires.length === 0) return null
    return { type: 'Measure', qubits: [wires[0]] }
  },
}

function pick(args: string[], idx: number): number {
  const raw = args[idx] ?? '0'
  const isQreg = /^q\[(\d+)\]$/.exec(raw)
  if (isQreg) return parseInt(isQreg[1], 10)
  return parseInt(raw, 10)
}

function pickNum(args: string[], idx: number): number {
  return pick(args, idx)
}

function flattenInts(expr: string): number[] {
  return Array.from(expr.matchAll(/\d+/g)).map((m) => parseInt(m[0], 10))
}

/**
 * Parse a small subset of Qiskit Python into a QuantumCircuit data structure.
 * Handles the code that circuitToQiskit emits plus common hand-written lines.
 */
export function qiskitToCircuit(code: string, name = 'From Code'): QuantumCircuit {
  const gates: QuantumGate[] = []
  let qubits = 2

  for (const rawLine of code.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const qcDecl = /qc\s*=\s*QuantumCircuit\(\s*(\d+)(?:\s*,\s*\d+)?\s*\)/.exec(line)
    if (qcDecl) {
      qubits = parseInt(qcDecl[1], 10)
      continue
    }
    const m = /^\s*qc\.(\w+)\s*\(\s*(.*?)\s*\)\s*$/.exec(line)
    if (!m) continue
    const fn = parseGate[m[1]]
    if (!fn) continue
    const parsed = fn(splitArgs(m[2]))
    if (!parsed) continue
    if (parsed.qubits.some((q) => q >= qubits)) qubits = Math.max(...parsed.qubits) + 1
    gates.push({ ...parsed, id: crypto.randomUUID(), moment: nextMoment(gates, parsed.qubits) })
  }

  return { id: crypto.randomUUID(), name, qubits, gates }
}

function nextMoment(gates: QuantumGate[], qubits: number[]): number {
  const used = new Set<number>()
  for (const q of qubits) {
    const last = gates.filter((g) => g.qubits.includes(q)).reduce((acc, g) => Math.max(acc, g.moment), -1)
    if (last >= 0) used.add(last)
  }
  let m = 0
  while (used.has(m)) m++
  return m
}

function splitArgs(input: string): string[] {
  const args: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of input) {
    if (ch === '[' || ch === '(') depth++
    else if (ch === ']' || ch === ')') depth--
    if (ch === ',' && depth === 0) {
      args.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) args.push(cur.trim())
  return args
}