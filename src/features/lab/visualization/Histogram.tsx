import { useMemo } from 'react'

interface Props {
  probabilities: Record<string, number>
  counts: Record<string, number>
  shots: number
  qubits: number
}

export default function Histogram({ probabilities, counts, qubits }: Props) {
  const states = useMemo(() => {
    const keys = Object.keys(probabilities)
    if (qubits > 3) {
      return keys.filter((k) => (probabilities[k] ?? 0) > 0.005).slice(0, 32)
    }
    return keys
  }, [probabilities, qubits])

  const max = Math.max(1, ...states.map((k) => probabilities[k] ?? 0))

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: 200 }}>
        {states.map((k) => {
          const p = (probabilities[k] ?? 0) * 100
          return (
            <div key={k} className="group flex flex-1 flex-col items-center justify-end gap-1">
              <div className="text-[10px] font-semibold text-slate-400">{counts[k] ?? 0}</div>
              <div
                className="bar-fill w-full max-w-[46px] rounded-t gradientHeight"
                style={{
                  height: `${Math.max(2, (p / max) * 160)}px`,
                  background:
                    Math.abs(p - 50) < 0.01 && states.length === 2
                      ? 'linear-gradient(180deg,#818cf8,#22d3ee)'
                      : p > 0
                        ? 'linear-gradient(180deg,#34d399,#0ea5e9)'
                        : '#1e293b',
                }}
                title={`|${k}⟩ ${p.toFixed(1)}%`}
              />
              <div className="w-full text-center font-mono text-[10px] text-slate-300">|{k}⟩</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}