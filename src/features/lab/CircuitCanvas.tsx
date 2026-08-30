import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useCircuitStore } from '../../store/circuitStore'
import { layoutCircuit, nextFreeMoment } from '../../lib/quantum/layout'
import { GATE_META } from '../../lib/quantum/types'
import type { GateType, QuantumGate } from '../../lib/quantum/types'
import { DRAG_GATE, parseGate } from './GatePalette'

const CELL_H = 48
const LABEL_W = 58
const COL_W = 84

export default function CircuitCanvas({
  stampType,
  setStamp,
}: {
  stampType: GateType | null
  setStamp: (t: GateType | null) => void
}) {
  const circuit = useCircuitStore((s) => s.circuit)
  const selected = useCircuitStore((s) => s.selectedGateId)
  const select = useCircuitStore((s) => s.select)
  const addGateAt = useCircuitStore((s) => s.addGateAt)
  const removeGate = useCircuitStore((s) => s.removeGate)
  const setQubits = useCircuitStore((s) => s.setQubits)

  const layout = useMemo(() => layoutCircuit(circuit), [circuit])
  const [hover, setHover] = useState<{ m: number; w: number } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        e.preventDefault()
        removeGate(selected)
        select(null)
      }
      if (e.key === 'Escape') setStamp(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, removeGate, select, setStamp])

  const place = (type: GateType, wire: number, moment: number) => {
    const meta = GATE_META[type]
    const n = circuit.qubits
    const wires = meta.qubitCount === 2 ? [wire, wire + 1 < n ? wire + 1 : wire - 1] : [wire]
    const params = meta.needsParam ? [Math.PI / 2] : undefined
    const occupied = circuit.gates.some((g) => g.moment === moment && g.qubits.some((q) => wires.includes(q)))
    const m = occupied ? nextFreeMoment(circuit.gates, wires) : moment
    const gate: QuantumGate = { id: crypto.randomUUID(), type, qubits: wires, moment: m, params }
    addGateAt(gate)
  }

  const onDropCell = (wire: number, moment: number, e: React.DragEvent) => {
    e.preventDefault()
    setHover(null)
    const raw = e.dataTransfer.getData(DRAG_GATE)
    const payload = raw ? parseGate(raw) : null
    if (!payload) return
    place(payload.type, wire, moment)
  }

  const onCellClick = (wire: number, moment: number) => {
    if (stampType) {
      place(stampType, wire, moment)
      setStamp(null)
    }
  }

  const twoQubitAt = (moment: number): QuantumGate[] =>
    circuit.gates.filter((g) => g.moment === moment && g.qubits.length === 2)

  const width = LABEL_W + Math.max(1, layout.moments) * COL_W + 24

  const gateBox = (gate: QuantumGate, label: string, color: string, onSelect: () => void) => (
    <div
      className={`gate-node h-8 w-12 text-sm ${selected === gate.id ? 'selected' : ''}`}
      style={{ borderColor: color + '66', color }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        removeGate(gate.id)
      }}
    >
      {label}
      {selected === gate.id && (
        <span
          className="absolute -top-2 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white"
          onClick={(e) => {
            e.stopPropagation()
            removeGate(gate.id)
          }}
        >
          ×
        </span>
      )}
    </div>
  )

  /** vertical connector segment; 'down' = spans from cell middle to bottom edge */
  const verticalLine = (dir: 'down' | 'up' | 'full'): CSSProperties => {
    const base: CSSProperties = { position: 'absolute', left: '50%', marginLeft: -1, width: 2 }
    if (dir === 'down') return { ...base, top: CELL_H / 2, bottom: 0 }
    if (dir === 'up') return { ...base, top: 0, bottom: CELL_H / 2 }
    return { ...base, top: 0, bottom: 0 }
  }

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="font-mono text-slate-200">{circuit.gates.length}</span> gate{circuit.gates.length !== 1 ? 's' : ''} ·
          <span className="font-mono text-slate-200">{circuit.qubits}</span> qubit{circuit.qubits !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500">Qubits</span>
          <button className="btn-ghost h-7 w-7 p-0" onClick={() => setQubits(circuit.qubits + 1)} disabled={circuit.qubits >= 7}>+</button>
          <button className="btn-ghost h-7 w-7 p-0" onClick={() => setQubits(circuit.qubits - 1)} disabled={circuit.qubits <= 1}>−</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-[#0a0e1c] p-3">
        <div className="relative" style={{ width: `${width}px` }}>
          {Array.from({ length: circuit.qubits }).map((_, w) => (
            <div key={w} className="relative flex" style={{ height: CELL_H }}>
              <div className="relative z-10 flex w-[58px] shrink-0 items-center gap-1 font-mono text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full border-2 border-accent-400/60" />
                q{w}
              </div>
              {Array.from({ length: Math.max(1, layout.moments) }).map((_, m) => {
                const cell = layout.cells[m]?.[w]
                const gate = twoQubitAt(m).find((g) => g.qubits.includes(w))
                const isSpanMiddle = gate !== undefined && w > Math.min(...gate.qubits) && w < Math.max(...gate.qubits)
                const isHover = hover?.m === m && hover?.w === w

                let content: React.ReactNode = null

                if (cell?.kind === 'gate' && cell.gate) {
                  const g = cell.gate
                  const meta = GATE_META[g.type]
                  content = gateBox(g, meta.label, meta.color, () => select(selected === g.id ? null : g.id))
                } else if (cell?.kind === 'measure' && cell.gate) {
                  const g = cell.gate
                  content = (
                    <div
                      className={`gate-measure h-6 px-2 ${selected === g.id ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        select(selected === g.id ? null : g.id)
                      }}
                    >
                      M
                    </div>
                  )
                } else if (cell?.kind === 'control' && cell.gate && cell.tgtWire !== undefined) {
                  const isBelow = cell.tgtWire > w
                  content = (
                    <>
                      <span
                        className="ctrl-dot"
                        style={{
                          top: CELL_H / 2 - 6,
                          left: '50%',
                          marginLeft: -6,
                        }}
                      />
                      <span className="cnx-line" style={verticalLine(isBelow ? 'down' : 'up')} />
                    </>
                  )
                } else if (cell?.kind === 'target' && cell.gate && cell.ctrlWire !== undefined) {
                  const g = cell.gate
                  const above = cell.ctrlWire < w
                  content = (
                    <>
                      <span className="cnx-line" style={verticalLine(above ? 'down' : 'up')} />
                      {gateBox(g, g.type === 'SWAP' ? '×' : '⊕', g.type === 'SWAP' ? '#f87171' : '#38bdf8', () =>
                        select(selected === g.id ? null : g.id),
                      )}
                    </>
                  )
                } else if (isSpanMiddle) {
                  content = <span className="cnx-line" style={verticalLine('full')} />
                }

                return (
                  <div
                    key={m}
                    className={`moment-slot relative z-10 flex flex-1 items-center justify-center ${isHover ? 'drop-hover' : ''}`}
                    style={{ height: CELL_H, minWidth: COL_W }}
                    onClick={() => onCellClick(w, m)}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setHover({ m, w })
                    }}
                    onDragLeave={() => setHover((h) => (h?.m === m && h?.w === w ? null : h))}
                    onDrop={(e) => onDropCell(w, m, e)}
                  >
                    {content}
                  </div>
                )
              })}
              <div className="wire-line" style={{ zIndex: 0, top: CELL_H / 2 - 1 }} />
            </div>
          ))}

          <div className="relative flex" style={{ height: 22 }}>
            <div className="flex w-[58px] shrink-0 items-center font-mono text-[10px] text-slate-600">creg</div>
            <div className="border-t border-slate-700/70" style={{ width: width - LABEL_W }} />
          </div>
        </div>
      </div>
    </div>
  )
}