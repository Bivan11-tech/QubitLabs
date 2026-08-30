import type { Amplitude } from '../../../lib/quantum/types'

export default function StateVectorTable({ statevector }: { statevector: Amplitude[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
            <th className="pb-2 pr-4">Basis</th>
            <th className="pb-2 pr-4">Amplitude</th>
            <th className="pb-2 pr-4">Probability</th>
            <th className="pb-2">Phase</th>
          </tr>
        </thead>
        <tbody>
          {statevector.map((a) => {
            const prob = a.re * a.re + a.im * a.im
            const active = prob > 1e-6
            const phase = Math.atan2(a.im, a.re)
            return (
              <tr key={a.basis} className={`border-t border-slate-800 ${active ? 'text-white' : 'text-slate-600'}`}>
                <td className="py-1.5 pr-4"><span className="font-mono">|{a.basis}⟩</span></td>
                <td className="py-1.5 pr-4">
                  <span className="font-mono">
                    {active ? `${fmt(a.re)} ${a.im >= 0 ? '+ ' : '− '}${fmt(Math.abs(a.im))}i` : '0 + 0i'}
                  </span>
                </td>
                <td className="py-1.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{(prob * 100).toFixed(1)}%</span>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400" style={{ width: `${prob * 100}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-1.5 font-mono">{active ? `${(phase * 180 / Math.PI).toFixed(0)}°` : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function fmt(x: number): string {
  const r = Math.round(x * 1e3) / 1e3
  return String(r)
}