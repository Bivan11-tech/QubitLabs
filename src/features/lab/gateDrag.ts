import type { GateType } from '../../lib/quantum/types'

/** Drag-and-drop wire format for circuit gates. */
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