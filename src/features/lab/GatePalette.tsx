import { GATE_META, PALETTE_GROUPS } from '../../lib/quantum/types'
import type { GateType } from '../../lib/quantum/types'

export const DRAG_GATE = 'qubitlabs/gate-type'

export interface DragPayload {
  type: GateType
  params?: number[]
}

export function serializeGate(p: DragPayload): string {
  return JSON.stringify(p)
}

export function parseGate(raw: string): DragPayload | null {
  try {
    return JSON.parse(raw) as DragPayload
  } catch {
    return null
  }
}

/** Palette of draggable gates; also supports click-to-stamp. */
export default function GatePalette({
  stampType,
  onPick,
}: {
  stampType: GateType | null
  onPick: (t: GateType | null) => void
}) {
  return (
    <div className="space-y-4">
      {PALETTE_GROUPS.map((group) => (
        <div key={group.group}>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.group}</div>
          <div className="grid grid-cols-2 gap-2">
            {group.gates.map((g) => {
              const meta = GATE_META[g]
              const stamping = stampType === g
              return (
                <div
                  key={g}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_GATE, serializeGate({ type: g, params: meta.needsParam ? [Math.PI / 2] : undefined }))
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  onClick={() => onPick(stamping ? null : g)}
                  className={`gate-palette-item relative h-10 text-sm ${stamping ? 'dragging' : ''}`}
                  style={{ borderColor: meta.color + '55' }}
                  title={meta.description}
                >
                  <span style={{ color: meta.color }}>{meta.label}</span>
                  {meta.needsParam && <span className="absolute bottom-0.5 right-1 text-[8px] text-slate-400">θ</span>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <p className="rounded-lg border border-slate-700/40 bg-mid-900/50 p-2 text-[11px] leading-relaxed text-slate-400">
        Drag a gate onto a wire, or <b className="text-slate-200">click once</b> then click the canvas to stamp it.
        Click a placed gate to select and press <b className="text-slate-200">Delete</b> to remove.
      </p>
    </div>
  )
}