import type { Amplitude, BackendId, QuantumCircuit, SimulationResult } from './types'

export interface Complex { re: number; im: number }

const INV_SQRT2 = 1 / Math.SQRT2

function eye(n: number): Complex[][] {
  const m: Complex[][] = []
  for (let i = 0; i < n; i++) {
    const row: Complex[] = []
    for (let j = 0; j < n; j++) row.push(i === j ? { re: 1, im: 0 } : { re: 0, im: 0 })
    m.push(row)
  }
  return m
}

/** build a complex matrix from rows of [re, im, re, im, ...] */
function u(...rows: number[][]): Complex[][] {
  return rows.map((r) => {
    const out: Complex[] = []
    for (let c = 0; c < r.length; c += 2) out.push({ re: r[c], im: r[c + 1] })
    return out
  })
}

function gateMatrix(type: string, params?: number[]): Complex[][] {
  const th = params && params.length > 0 ? params[0] : 0
  switch (type) {
    case 'H':
      return u([INV_SQRT2, 0, INV_SQRT2, 0], [INV_SQRT2, 0, -INV_SQRT2, 0])
    case 'X':
      return u([0, 0, 1, 0], [1, 0, 0, 0])
    case 'Y':
      return u([0, 0, 0, -1], [0, 1, 0, 0])
    case 'Z':
      return u([1, 0, 0, 0], [0, 0, -1, 0])
    case 'S':
      return u([1, 0, 0, 0], [0, 0, 0, 1])
    case 'Sdg':
      return u([1, 0, 0, 0], [0, 0, 0, -1])
    case 'T':
      return u([1, 0, 0, 0], [0, 0, Math.SQRT1_2, Math.SQRT1_2])
    case 'Tdg':
      return u([1, 0, 0, 0], [0, 0, Math.SQRT1_2, -Math.SQRT1_2])
    case 'RX': {
      const c = Math.cos(th / 2)
      const s = Math.sin(th / 2)
      return u([c, 0, 0, -s], [0, -s, c, 0])
    }
    case 'RY': {
      const c = Math.cos(th / 2)
      const s = Math.sin(th / 2)
      return u([c, 0, -s, 0], [s, 0, c, 0])
    }
    case 'RZ': {
      const c = Math.cos(th / 2)
      const s = Math.sin(th / 2)
      return u([c, -s, 0, 0], [0, 0, c, s])
    }
    case 'CX':
      return u(
        [1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0],
      )
    case 'CY':
      return u(
        [1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, -1],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0],
      )
    case 'CZ':
      return u(
        [1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, -1, 0],
      )
    case 'SWAP':
      return u(
        [1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
      )
    default:
      return eye(1)
  }
}

function basisString(i: number, n: number): string {
  let s = ''
  for (let b = 0; b < n; b++) s = ((i >> b) & 1).toString() + s
  return s
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Reduced density matrix over the subsystem formed by `keep` wires, tracing out
 * every other wire. `keep` wires are ordered, so keep[0] -> |0> row/col etc.
 */
function reducedDensity(state: Complex[], n: number, keep: number[]): Complex[][] {
  const k = keep.length
  const dimK = 1 << k
  const out = eye(dimK)
  const restWires: number[] = []
  for (let w = 0; w < n; w++) if (!keep.includes(w)) restWires.push(w)
  const restCount = 1 << restWires.length

  if (restCount === 0) {
    for (let a = 0; a < dimK; a++) out[a][a] = { re: state[a].re * state[a].re + state[a].im * state[a].im, im: 0 }
    return out
  }

  for (let a = 0; a < dimK; a++) {
    for (let b = 0; b < dimK; b++) {
      let re = 0
      let im = 0
      for (let r = 0; r < restCount; r++) {
        const i = buildIndex(r, a)
        const j = buildIndex(r, b)
        const x = state[i]
        const y = state[j]
        re += x.re * y.re + x.im * y.im
        im += x.im * y.re - x.re * y.im
      }
      out[a][b] = { re, im }
    }
  }
  return out

  function buildIndex(rest: number, sub: number): number {
    let idx = 0
    let keepPos = 0
    for (let w = 0; w < n; w++) {
      if (keep.includes(w)) {
        idx |= ((sub >> keepPos) & 1) << w
        keepPos++
      } else {
        idx |= ((rest >> (w - keepPos)) & 1) << w
      }
    }
    return idx
  }
}

function purity(rho: Complex[][]): number {
  const n = rho.length
  let re = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const a = rho[i][j]
      const b = rho[j][i]
      re += a.re * b.re - a.im * b.im
    }
  }
  return re
}

function isEntangled(state: Complex[], n: number): boolean {
  if (n < 2) return false
  const rho = reducedDensity(state, n, [0])
  return purity(rho) < 0.9999
}

function round(x: number): number {
  const r = Math.round(x * 1e4) / 1e4
  return Math.abs(r) < 1e-5 ? 0 : r
}

/** Run a quantum circuit on the built-in state-vector simulator. */
export function simulateCircuit(circuit: QuantumCircuit, backend: BackendId, shots: number): SimulationResult {
  const t0 = performance.now()
  const n = circuit.qubits
  const dim = 1 << n
  let state: Complex[] = Array.from({ length: dim }, (_, i) => (i === 0 ? { re: 1, im: 0 } : { re: 0, im: 0 }))

  const ordered = [...circuit.gates]
    .filter((g) => g.type !== 'Measure')
    .sort((a, b) => a.moment - b.moment || a.qubits[0] - b.qubits[0])

  for (const gate of ordered) {
    const U = fullUnitary(gate.type, gate.qubits, gate.params, n)
    const next: Complex[] = Array.from({ length: dim }, () => ({ re: 0, im: 0 }))
    for (let i = 0; i < dim; i++) {
      let re = 0
      let im = 0
      for (let j = 0; j < dim; j++) {
        const a = U[i][j]
        const s = state[j]
        re += a.re * s.re - a.im * s.im
        im += a.re * s.im + a.im * s.re
      }
      next[i] = { re, im }
    }
    state = next
  }

  const probabilities = state.map((c) => c.re * c.re + c.im * c.im)

  const counts: Record<string, number> = {}
  const rand = mulberry32(0xc0ffee)
  for (let s = 0; s < shots; s++) {
    const r = rand()
    let acc = 0
    let chosen = dim - 1
    for (let i = 0; i < dim; i++) {
      acc += probabilities[i]
      if (r < acc) {
        chosen = i
        break
      }
    }
    const key = basisString(chosen, n)
    counts[key] = (counts[key] ?? 0) + 1
  }

  const probabilitiesMap: Record<string, number> = {}
  for (let i = 0; i < dim; i++) probabilitiesMap[basisString(i, n)] = probabilities[i]

  const statevector: Amplitude[] = state.map((c, i) => ({
    basis: basisString(i, n),
    re: round(c.re),
    im: round(c.im),
  }))

  return {
    counts,
    probabilities: probabilitiesMap,
    statevector,
    entangled: isEntangled(state, n),
    executionTime: Math.max(0.01, Math.round((performance.now() - t0) * 1000) / 1000),
    backend,
    shots,
  }
}

/** look up the complex amplitude contributions for a wire string (helper for Bloch sphere) */
export function blochVector(state: Complex[], n: number, wire: number): { x: number; y: number; z: number } {
  // rho (reduced) for this single wire
  const rho = reducedDensity(state, n, [wire])
  const x = 2 * rho[0][1].re
  const y = -2 * rho[0][1].im
  const z = rho[0][0].re - rho[1][1].re
  return { x: round(x), y: round(y), z: round(z) }
}

/** unitary for a gate acting on the given wires of an n-qubit system */
export function fullUnitary(type: string, qubits: number[], params: number[] | undefined, n: number): Complex[][] {
  const dim = 1 << n
  const u = gateMatrix(type, params)
  const out: Complex[][] = Array.from({ length: dim }, () => Array.from({ length: dim }, () => ({ re: 0, im: 0 })))
  for (let row = 0; row < dim; row++) {
    const restR = restIndex(row, qubits)
    const subR = subIndex(row, qubits)
    for (let col = 0; col < dim; col++) {
      if (restIndex(col, qubits) !== restR) continue
      const subC = subIndex(col, qubits)
      const v = u[subR][subC]
      out[row][col] = v
    }
  }
  return out
}

/** extract the k-bit "sub index" made of bits at positions `qubits` */
export function subIndex(i: number, qubits: number[]): number {
  let s = 0
  qubits.forEach((b, p) => {
    s |= ((i >> b) & 1) << p
  })
  return s
}

/** index with the bits at positions `qubits` removed */
export function restIndex(i: number, qubits: number[]): number {
  const sorted = [...qubits].sort((a, b) => a - b)
  let r = 0
  let shift = 0
  for (let b = 0; b < 31; b++) {
    if (sorted.includes(b)) continue
    r |= ((i >> b) & 1) << shift
    shift++
  }
  return r
}