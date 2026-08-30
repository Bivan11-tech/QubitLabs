import { useCircuitStore } from '../../store/circuitStore'
import { Primary, Ghost } from '../../components/ui'

export default function CodeEditor() {
  const code = useCircuitStore((s) => s.code)
  const setCode = useCircuitStore((s) => s.setCode)
  const applyCode = useCircuitStore((s) => s.applyCode)
  const run = useCircuitStore((s) => s.run)
  const running = useCircuitStore((s) => s.running)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-white">Qiskit code</div>
          <div className="text-xs text-slate-400">Edits here round-trip back to the canvas via Apply.</div>
        </div>
        <div className="flex items-center gap-2">
          <Ghost onClick={applyCode} className="px-4 py-2 text-sm">Apply to canvas</Ghost>
          <Primary onClick={() => void run()} disabled={running} className="px-4 py-2 text-sm">
            {running ? 'Running…' : 'Run Circuit ▶'}
          </Primary>
        </div>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        className="h-[380px] w-full resize-none rounded-xl border border-slate-700/50 bg-[#0a0e1c] p-4 font-mono text-[13px] leading-relaxed text-slate-100 outline-none focus:border-accent-400/50"
      />
      <p className="text-[11px] text-slate-500">
        Supported subset: <code className="text-slate-400">qc = QuantumCircuit(n, n)</code>, h/x/y/z/s/t/sdg/tdg/rx/ry/rz/cx/cy/cz/swap, and qc.measure([...], [...]).
      </p>
    </div>
  )
}