import { layoutCircuit } from '../lib/quantum/layout'
import type { QuantumCircuit } from '../lib/quantum/types'
import { GATE_META } from '../lib/quantum/types'

/** Compact, non-interactive circuit preview used in lesson cards. */
export function MiniCircuitPreview({ circuit, height = 26 }: { circuit: QuantumCircuit; height?: number }) {
  const { moments, wires, cells } = layoutCircuit(circuit)

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/50 bg-[#0a0e1c] p-2">
      <div style={{ width: 60 + moments * 46, minWidth: '100%' }}>
        {Array.from({ length: wires }).map((_, w) => (
          <div key={w} className="relative flex" style={{ height }}>
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-600" />
            <div className="relative z-10 flex w-8 items-center font-mono text-[10px] text-slate-400">q{w}</div>
            {Array.from({ length: moments }).map((_, m) => {
              const cell = cells[m][w]
              if (cell?.kind === 'gate' || cell?.kind === 'measure') {
                const meta = cell.gate ? GATE_META[cell.gate.type] : undefined
                return (
                  <div key={m} className="relative z-10 flex flex-1 items-center justify-center">
                    <div
                      className="rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold"
                      style={{
                        color: meta?.color ?? '#67e8f9',
                        borderColor: meta ? meta.color + '55' : '#0ea5e955',
                        background: '#121a30',
                      }}
                    >
                      {meta?.label ?? cell.gate?.type}
                    </div>
                  </div>
                )
              }
              if (cell?.kind === 'control') {
                return (
                  <div key={m} className="relative z-10 flex flex-1 items-center justify-center">
                    <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-slate-200" />
                    {cell.tgtWire !== undefined && (
                      <span
                        className="absolute left-1/2 top-1/2 h-px w-px"
                        style={{
                          background: '#67e8f9',
                          boxShadow: `0 0 0 ${Math.abs(cell.tgtWire - w)}px`, // extended line placeholder
                        }}
                      />
                    )}
                  </div>
                )
              }
              if (cell?.kind === 'target') {
                return (
                  <div key={m} className="relative z-10 flex flex-1 items-center justify-center">
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded border border-accent-400/60 text-[10px] font-bold text-accent-300"
                      style={{ background: '#0c2b36' }}
                    >
                      {cell.gate?.type === 'SWAP' ? '×' : 'X'}
                    </div>
                  </div>
                )
              }
              return <div key={m} className="flex-1" />
            })}
          </div>
        ))}
      </div>
    </div>
  )
}