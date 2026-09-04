import Editor from '@monaco-editor/react'
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
      <div className="overflow-hidden rounded-xl border border-slate-700/50">
        <Editor
          height="380px"
          defaultLanguage="python"
          value={code}
          onChange={(v) => setCode(v ?? '')}
          theme="qubitlabs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            wordWrap: 'on',
            tabSize: 2,
            renderLineHighlight: 'gutter',
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            automaticLayout: true,
          }}
          beforeMount={(monaco) => {
            monaco.editor.defineTheme('qubitlabs-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [
                { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
                { token: 'keyword', foreground: '818cf8' },
                { token: 'string', foreground: '34d399' },
                { token: 'number', foreground: 'fbbf24' },
                { token: 'type', foreground: '22d3ee' },
              ],
              colors: {
                'editor.background': '#0a0e1c',
                'editor.foreground': '#e2e8f0',
                'editor.lineHighlightBackground': '#1e293b20',
                'editor.selectionBackground': '#33415580',
                'editorCursor.foreground': '#22d3ee',
                'editorLineNumber.foreground': '#475569',
                'editorLineNumber.activeForeground': '#94a3b8',
                'editor.inactiveSelectionBackground': '#33415540',
              },
            })
          }}
        />
      </div>
      <p className="text-[11px] text-slate-500">
        Supported subset: <code className="text-slate-400">qc = QuantumCircuit(n, n)</code>, h/x/y/z/s/t/sdg/tdg/rx/ry/rz/cx/cy/cz/swap, and qc.measure([...], [...]).
      </p>
    </div>
  )
}
