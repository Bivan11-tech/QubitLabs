import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Primary } from '../../components/ui'
import { useAuthStore } from '../../store/authStore'

const LEVELS = [
  { id: 'beginner' as const, label: 'Beginner', text: 'New to quantum computing, comfortable with math basics.' },
  { id: 'intermediate' as const, label: 'Intermediate', text: 'Know qubits and gates, want circuits and algorithms.' },
  { id: 'advanced' as const, label: 'Advanced', text: 'Looking for algorithms, noise and research depth.' },
]

const INTERESTS = ['Fundamentals', 'Quantum Gates', 'Circuit Design', 'Entanglement', 'Grover', 'Shor', 'Python & Qiskit', 'Quantum ML']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { update } = useAuthStore()
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [interests, setInterests] = useState<string[]>([])

  const toggle = (i: string) => {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))
  }

  const finish = () => {
    update({ skillLevel: level, interests })
    navigate('/dashboard')
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-accent-400">Step 1 of 1 · Personalize</div>
      <h1 className="text-3xl font-bold text-white">Tailor your Quantum journey</h1>
      <p className="mt-2 text-slate-400">This tunes lesson pacing, challenge difficulty and the AI tutor's explanations.</p>

      <div className="mt-8">
        <div className="mb-3 text-sm font-semibold text-slate-200">How would you describe your level?</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={`rounded-xl border p-4 text-left transition ${
                level === l.id ? 'border-accent-400/70 bg-accent-400/10' : 'border-slate-700/50 bg-mid-800/50 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-white">
                {l.label}
                {level === l.id && <Check size={16} className="text-accent-400" />}
              </div>
              <p className="mt-1 text-xs text-slate-400">{l.text}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 text-sm font-semibold text-slate-200">Pick topics you care about</div>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                interests.includes(i) ? 'border-brand-400 bg-brand-500/20 text-white' : 'border-slate-600/50 bg-slate-800/40 text-slate-300 hover:text-white'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <Primary onClick={finish} className="px-7 py-2.5">
          Finish setup <ArrowRight size={17} />
        </Primary>
      </div>
    </div>
  )
}