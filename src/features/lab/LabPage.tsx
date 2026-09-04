import { useEffect, useState } from 'react'
import {
  Aperture, FlaskConical, FolderOpen, Plus, Save, Send, Settings2, Check, CloudOff, BookOpen, Loader2,
} from 'lucide-react'
import { Tabs, Primary, Ghost } from '../../components/ui'
import { checkBackendHealth, fetchTemplate, type TemplateGate } from '../../lib/backend'
import { BACKENDS, GATE_META } from '../../lib/quantum/types'
import type { GateType, QuantumCircuit, QuantumGate } from '../../lib/quantum/types'
import { useCircuitStore } from '../../store/circuitStore'
import GatePalette from './GatePalette'
import CircuitCanvas from './CircuitCanvas'
import CodeEditor from './CodeEditor'
import AITutorPanel from './AITutorPanel'
import ResultsPanel from './ResultsPanel'

type Mode = 'visual' | 'code'

const TEMPLATE_OPTIONS = [
  { id: 'bell', label: 'Bell State' },
  { id: 'ghz', label: 'GHZ State' },
  { id: 'deutsch-jozsa', label: 'Deutsch–Jozsa' },
  { id: 'teleportation', label: 'Teleportation' },
  { id: 'grover', label: 'Grover Search' },
  { id: 'qft', label: 'Quantum Fourier Transform' },
]

const BACKEND_GATE_MAP: Partial<Record<string, GateType>> = {
  h: 'H', x: 'X', y: 'Y', z: 'Z', s: 'S', t: 'T', sdg: 'Sdg', tdg: 'Tdg',
  rx: 'RX', ry: 'RY', rz: 'RZ',
  cx: 'CX', cy: 'CY', cz: 'CZ', swap: 'SWAP',
}

function templateToCircuit(name: string, numQubits: number, gates: TemplateGate[]): QuantumCircuit {
  const out: QuantumGate[] = []
  const wireLast = new Map<number, number>()
  for (let i = 0; i < gates.length; i++) {
    const g = gates[i]
    const type = BACKEND_GATE_MAP[g.name]
    if (!type) continue
    const isControlled = g.controls.length > 0
    const qubits = isControlled ? [...g.controls, ...g.targets] : [...g.targets]
    let moment = 0
    for (const q of qubits) {
      const last = wireLast.get(q) ?? -1
      moment = Math.max(moment, last + 1)
    }
    for (const q of qubits) wireLast.set(q, moment)
    out.push({
      id: crypto.randomUUID(),
      type,
      qubits,
      params: g.params.length > 0 ? [...g.params] : undefined,
      moment,
    })
  }
  return { id: crypto.randomUUID(), name, qubits: numQubits, gates: out }
}

export default function LabPage() {
  const circuit = useCircuitStore((s) => s.circuit)
  const mode = useCircuitStore((s) => s.mode)
  const setMode = useCircuitStore((s) => s.setMode)
  const backend = useCircuitStore((s) => s.backend)
  const setBackend = useCircuitStore((s) => s.setBackend)
  const shots = useCircuitStore((s) => s.shots)
  const setShots = useCircuitStore((s) => s.setShots)
  const running = useCircuitStore((s) => s.running)
  const run = useCircuitStore((s) => s.run)
  const source = useCircuitStore((s) => s.source)
  const backendError = useCircuitStore((s) => s.backendError)
  const newCircuit = useCircuitStore((s) => s.newCircuit)
  const saveCircuit = useCircuitStore((s) => s.saveCircuit)
  const saveCount = useCircuitStore((s) => s.saveCount)
  const selectedGateId = useCircuitStore((s) => s.selectedGateId)
  const updateGate = useCircuitStore((s) => s.updateGate)
  const saved = useCircuitStore((s) => s.saved)

  const [stampType, setStampType] = useState<GateType | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  useEffect(() => {
    let alive = true
    const check = async () => {
      const ok = await checkBackendHealth()
      if (alive) setApiOnline(ok)
    }
    void check()
    return () => { alive = false }
  }, [])

  const backendReachable = source === 'backend' ? true : apiOnline

  const selectedGate = circuit.gates.find((g) => g.id === selectedGateId)

  const notify = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const loadTemplate = async (algoId: string) => {
    setLoadingTemplate(true)
    try {
      const res = await fetchTemplate(algoId)
      const t = templateToCircuit(algoId, res.template.num_qubits, res.template.gates)
      useCircuitStore.getState().loadCircuit(t)
      notify(`Loaded template: ${TEMPLATE_OPTIONS.find((o) => o.id === algoId)?.label ?? algoId}`)
    } catch {
      notify('Failed to load template — is the backend running?')
    } finally {
      setLoadingTemplate(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical size={22} className="text-accent-400" />
          <h1 className="text-xl font-bold text-white">Quantum Lab</h1>
        </div>
        <Tabs<Mode>
          active={mode}
          onChange={(m) => setMode(m)}
          tabs={[
            { id: 'visual', label: 'Visual' },
            { id: 'code', label: 'Code' },
          ]}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-mid-800/60 px-3 py-1.5">
            <BookOpen size={14} className="text-slate-400" />
            <select
              className="bg-transparent text-sm text-slate-200 outline-none"
              value=""
              onChange={(e) => { if (e.target.value) void loadTemplate(e.target.value) }}
            >
              <option value="" disabled>Templates…</option>
              {TEMPLATE_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            {loadingTemplate && <Loader2 size={13} className="animate-spin text-accent-400" />}
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-mid-800/60 px-3 py-1.5">
            <Settings2 size={14} className="text-slate-400" />
            <select
              className="bg-transparent text-sm text-slate-200 outline-none"
              value={backend}
              onChange={(e) => setBackend(e.target.value as typeof backend)}
            >
              {BACKENDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-mid-800/60 px-3 py-1.5">
            <span className="text-xs text-slate-400">Shots</span>
            <input
              className="w-16 bg-transparent text-sm text-slate-200 outline-none"
              type="number"
              value={shots}
              onChange={(e) => setShots(parseInt(e.target.value || '1', 10))}
            />
          </div>
          <span
            title={backendError ?? undefined}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              backendReachable === null
                ? 'border-slate-700/50 bg-mid-800/60 text-slate-400'
                : backendReachable
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                  : 'border-amber-400/40 bg-amber-400/10 text-amber-300'
            }`}
          >
            {backendReachable === null ? (
              'checking…'
            ) : backendReachable ? (
              <><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Qiskit API online</>
            ) : (
              <><CloudOff size={13} /> Local simulator</>
            )}
          </span>
          <Ghost onClick={() => { newCircuit(); notify('New circuit ready') }} className="px-3 py-2 text-sm"><Plus size={15} /> New</Ghost>
          <Ghost onClick={() => { saveCircuit(); notify('Circuit saved') }} className="px-3 py-2 text-sm">
            <Save size={15} /> Save{saveCount > 0 ? ` (${saveCount})` : ''}
          </Ghost>
          <Ghost onClick={() => setShowSaved((v) => !v)} className="px-3 py-2 text-sm"><FolderOpen size={15} /> Saved</Ghost>
          <Primary onClick={() => void run()} disabled={running} className="px-5 py-2 text-sm">
            {running ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Running…</> : <><Send size={15} /> Run Circuit ▶</>}
          </Primary>
        </div>
      </div>

      {showSaved && (
        <div className="mb-4 rounded-xl border border-slate-700/50 bg-mid-800/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Saved circuits</div>
            <span className="text-xs text-slate-400">{saved.length} saved</span>
          </div>
          {saved.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing saved yet — hit Save to store the current circuit.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {saved.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    useCircuitStore.getState().loadCircuit(c)
                    setShowSaved(false)
                  }}
                  className="rounded-lg border border-slate-600/40 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-200 transition hover:border-brand-400/50 hover:text-white"
                >
                  {c.name} <span className="text-xs text-slate-500">· {c.gates.length} gates</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* workspace */}
      <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)_330px]">
        <aside className="lab-panel p-4">
          <GatePalette stampType={stampType} onPick={(t) => setStampType(t)} />
        </aside>

        <main className="min-w-0">
          {mode === 'visual' ? (
            <>
              <CircuitCanvas stampType={stampType} setStamp={setStampType} />
              {selectedGate && selectedGate.params !== undefined && (
                <div className="lab-panel mt-3 flex flex-wrap items-center gap-3 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-200">
                    <Aperture size={15} className="text-accent-400" />
                    {GATE_META[selectedGate.type].label} angle
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2 * Math.PI}
                    step={0.05}
                    value={selectedGate.params?.[0] ?? 0}
                    onChange={(e) => updateGate(selectedGate.id, { params: [parseFloat(e.target.value)] })}
                    className="w-52 accent-cyan-400"
                  />
                  <span className="font-mono text-sm text-accent-300">{(selectedGate.params[0] / Math.PI).toFixed(2)}π</span>
                  <SparkleHint />
                </div>
              )}
            </>
          ) : (
            <CodeEditor />
          )}
        </main>

        <aside className="min-w-0">
          <AITutorPanel />
        </aside>
      </div>

      {/* results */}
      <div className="mt-4">
        <ResultsPanel />
      </div>

      {/* floating toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-mid-800 px-4 py-2.5 text-sm text-emerald-200 shadow-xl">
          <Check size={15} /> {toast}
        </div>
      )}
    </div>
  )
}

function SparkleHint() {
  return (
    <span className="text-xs text-slate-500">
      fine-tune the rotation while the results panel updates on your next run.
    </span>
  )
}
