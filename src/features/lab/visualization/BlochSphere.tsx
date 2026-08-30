import { useEffect, useMemo, useState } from 'react'
import type { Amplitude } from '../../../lib/quantum/types'
import { blochVector } from '../../../lib/quantum/simulator'

interface Props {
  statevector: Amplitude[]
  qubits: number
  wire: number
  onWire: (w: number) => void
}

export default function BlochSphere({ statevector, qubits, wire, onWire }: Props) {
  const state = useMemo(() => statevector.map((a) => ({ re: a.re, im: a.im })), [statevector])
  const v = useMemo(() => blochVector(state, qubits, wire), [state, qubits, wire])
  const [t, setT] = useState(0)

  useEffect(() => {
    let raf: number
    const loop = () => {
      setT((prev) => prev + 0.012)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const R = 74
  const cx = 100
  const cy = 100
  const cos = Math.cos(t)
  const sin = Math.sin(t)
  const xr = v.x * cos - v.y * sin
  const px = cx + xr * R
  const py = cy - v.z * R
  const theta = Math.acos(Math.max(-1, Math.min(1, v.z))) * (180 / Math.PI) || 0
  const phi = (Math.atan2(v.y, v.x) * (180 / Math.PI) || 0)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1.5">
        {Array.from({ length: qubits }).map((_, w) => (
          <button
            key={w}
            onClick={() => onWire(w)}
            className={`rounded-md border px-2.5 py-1 font-mono text-xs transition ${
              wire === w ? 'border-accent-400/70 bg-accent-400/15 text-accent-200' : 'border-slate-600/50 bg-mid-800 text-slate-300 hover:text-white'
            }`}
          >
            q{w}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 200 200" className="max-h-[320px] w-full max-w-[320px]">
        <defs>
          <radialGradient id="sphereFill" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#1e2a48" />
            <stop offset="100%" stopColor="#0a0f1e" />
          </radialGradient>
        </defs>

        {/* sphere body */}
        <circle cx={cx} cy={cy} r={R} fill="url(#sphereFill)" stroke="#334155" strokeWidth="1.5" />
        {/* equator + meridian hints */}
        <ellipse cx={cx} cy={cy} rx={R} ry={R * 0.34} fill="none" stroke="#3f4c6b" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="#334155" strokeWidth="1" />

        {/* axes */}
        <line x1={cx} y1={cy - R - 8} x2={cx} y2={cy + R + 8} stroke="#22d3ee" strokeWidth="1.4" />
        <text x={cx + 4} y={cy - R - 2} fontSize="8" fill="#67e8f9">|0⟩</text>
        <text x={cx + 4} y={cy + R + 11} fontSize="8" fill="#67e8f9">|1⟩</text>
        <line x1={cx - R - 8} y1={cy} x2={cx + R + 8} y2={cy} stroke="#818cf8" strokeWidth="1.2" />
        <text x={cx + R} y={cy + 11} fontSize="8" fill="#a5b4fc">x</text>

        {/* state arrow */}
        <line x1={cx} y1={cy} x2={px} y2={py} stroke="#f0abfc" strokeWidth="2" strokeLinecap="round" opacity={0.9} />
        <circle cx={px} cy={py} r={6} fill="#e879f9" style={{ filter: 'drop-shadow(0 0 8px rgba(232,121,249,0.8))' }} />
        <circle cx={px} cy={py} r={9} fill="none" stroke="#e879f9" strokeWidth="1" opacity={0.4} className="animate-ping" style={{ transformOrigin: `${px}px ${py}px` }} />
      </svg>

      <div className="grid w-full grid-cols-2 gap-1.5 text-xs">
        <div className="chip justify-center">θ {theta.toFixed(1)}°</div>
        <div className="chip justify-center">φ {phi.toFixed(1)}°</div>
        <div className="chip justify-center">x {fmt(v.x)}</div>
        <div className="chip justify-center">z {fmt(v.z)}</div>
      </div>
      <p className="text-center text-[11px] text-slate-500">y axis points into the screen · rotating for depth</p>
    </div>
  )
}

function fmt(x: number): string {
  return x.toFixed(2)
}