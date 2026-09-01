import { useState } from 'react'
import { AlertTriangle, BarChart3, CircleDot, CloudOff, Info, Zap } from 'lucide-react'
import { Badge, Tabs, Spinner } from '../../components/ui'
import { debugCircuit } from '../../lib/quantum/ai'
import { useCircuitStore } from '../../store/circuitStore'
import Histogram from './visualization/Histogram'
import StateVectorTable from './visualization/StateVectorTable'
import BlochSphere from './visualization/BlochSphere'

type Tab = 'histogram' | 'state' | 'bloch' | 'meta'

export default function ResultsPanel() {
  const result = useCircuitStore((s) => s.result)
  const circuit = useCircuitStore((s) => s.circuit)
  const source = useCircuitStore((s) => s.source)
  const backendError = useCircuitStore((s) => s.backendError)
  const [tab, setTab] = useState<Tab>('histogram')
  const [wire, setWire] = useState(0)

  if (!result) {
    return (
      <div className="lab-panel flex min-h-[120px] items-center justify-center gap-2 p-6 text-sm text-slate-400">
        <Zap size={15} className="text-accent-400" />
        Run your circuit to see measurement histogram, state vector and Bloch sphere.
      </div>
    )
  }

  const issues = debugCircuit(circuit)
  const warnings = issues.filter((i) => i.level !== 'info')
  const infos = issues.filter((i) => i.level === 'info')
  const gateCount = circuit.gates.filter((g) => g.type !== 'Measure').length

  return (
    <div className="lab-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Tabs<Tab>
            active={tab}
            onChange={setTab}
            tabs={[
              { id: 'histogram', label: 'Histogram', icon: <BarChart3 size={14} /> },
              { id: 'state', label: 'State Vector', icon: <CircleDot size={14} /> },
              { id: 'bloch', label: 'Bloch Sphere', icon: <BarChart3 size={14} style={{ transform: 'rotate(90deg)' }} /> },
              { id: 'meta', label: 'Run Info', icon: <Info size={14} /> },
            ]}
          />
          {result.entangled && <Badge tone="violet">🔗 Entangled</Badge>}
        </div>
        <div className="text-xs text-slate-400">
          {result.backend} · {result.shots} shots · <span className="text-slate-200">{result.executionTime}s</span>
        </div>
      </div>

      <div className="p-5">
        {tab === 'histogram' && (
          <Histogram probabilities={result.probabilities} counts={result.counts} shots={result.shots} qubits={circuit.qubits} />
        )}
        {tab === 'state' && <StateVectorTable statevector={result.statevector} />}
        {tab === 'bloch' && (
          <div className="flex justify-center">
            <BlochSphere statevector={result.statevector} qubits={circuit.qubits} wire={wire} onWire={setWire} />
          </div>
        )}
        {tab === 'meta' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Backend</span><span className="font-mono text-white">{result.backend}</span></div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Shots</span><span className="font-mono text-white">{result.shots.toLocaleString()}</span></div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Qubits</span><span className="font-mono text-white">{circuit.qubits}</span></div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Gates</span><span className="font-mono text-white">{gateCount}</span></div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Execution time</span><span className="font-mono text-white">{result.executionTime}s</span></div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Entanglement</span><span className="font-mono text-white">{result.entangled ? 'YES' : 'no'}</span></div>
            </div>
            <div className="space-y-2">
              {warnings.map((w, i) => (
                <div key={i} className="flex gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
                  <AlertTriangle size={14} className="shrink-0" /> {w.message}
                </div>
              ))}
              {infos.map((w, i) => (
                <div key={i} className="flex gap-2 rounded-lg border border-slate-700/50 bg-slate-800/40 p-3 text-xs text-slate-300">
                  <Info size={14} className="shrink-0 text-accent-300" /> {w.message}
                </div>
              ))}
              {warnings.length === 0 && infos.length === 0 && <Badge tone="emerald">All checks passed</Badge>}
            </div>
          </div>
        )}
      </div>

      {tab !== 'meta' && (
        <div className="border-t border-slate-700/50 px-5 py-3 text-xs text-slate-500">
          {warnings.length > 0 ? (
            <div className="flex items-center gap-1.5 text-amber-300"><AlertTriangle size={13} /> AI debugger flagged {warnings.length} issue{warnings.length > 1 ? 's' : ''} — ask the tutor to explain.</div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              {source === 'backend' ? (
                <><Spinner className="h-3 w-3" /> Simulated on the Qiskit backend ({result.backend})</>
              ) : (
                <><CloudOff size={13} /> Local fallback engine — API {backendError ? 'error' : 'offline'}</>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}