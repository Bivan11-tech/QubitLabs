import { Link } from 'react-router-dom'
import {
  ArrowRight, Atom, BrainCircuit, CirclePlay, FlaskConical, Gauge,
  GraduationCap, LineChart, MessageSquareText, Orbit, Sparkles, Trophy,
} from 'lucide-react'
import { COURSES } from '../data/courses'

function AnimatedCircuit() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-400 glow-line animate-pulse" />
          Bell State · live preview
        </div>
        <span className="chip"><Gauge size={11} /> qiskit-aer</span>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 520 170" className="w-full min-w-[480px]">
          {[26, 86].map((y) => (
            <g key={y}>
              <line x1="10" x2="510" y1={y} y2={y} stroke="#475569" strokeWidth="2" className="wire-glow" />
              <text x="0" y={y + 4} fontSize="11" fill="#94a3b8">q{(y - 26) / 60}</text>
            </g>
          ))}
          <rect x="130" y="14" width="44" height="24" rx="6" fill="#1b2745" stroke="#818cf8" />
          <text x="152" y="31" textAnchor="middle" fontSize="14" fill="#a5b4fc" fontWeight="700">H</text>
          <rect x="240" y="14" width="44" height="24" rx="6" fill="#1b2745" stroke="#22d3ee" />
          <text x="262" y="31" textAnchor="middle" fontSize="14" fill="#67e8f9" fontWeight="700">H</text>
          <circle cx="330" cy="26" r="6" fill="#e2e8f0" />
          <rect x="330" y="74" width="44" height="24" rx="6" fill="#1b2745" stroke="#22d3ee" className="hero-dot" />
          <text x="352" y="91" textAnchor="middle" fontSize="14" fill="#67e8f9" fontWeight="700">X</text>
          <line x1="330" y1="32" x2="330" y2="74" stroke="#67e8f9" strokeWidth="2" className="wire-glow" />
          <g>
            {[26, 86].map((y) => (
              <g key={y}>
                <line x1="430" y1={y} x2="510" y2={y} stroke="#0ea5e9" strokeWidth="2" />
                <path d={`M430 ${y} l6 -8 h28 a8 8 0 0 1 8 8 v0 a8 8 0 0 1 -8 8 h-28 z`} fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1.2" />
              </g>
            ))}
          </g>
          <g className="hero-dot">
            <rect x="340" y="130" width="120" height="14" rx="7" fill="rgba(34,211,238,0.2)" />
            <rect x="340" y="130" width="58" height="14" rx="7" fill="#22d3ee" />
            <rect x="340" y="150" width="120" height="14" rx="7" fill="rgba(34,211,238,0.2)" />
            <rect x="340" y="150" width="58" height="14" rx="7" fill="#818cf8" />
            <text x="408" y="145" textAnchor="end" fontSize="10" fill="#a5f3fc">00 50%</text>
          </g>
        </svg>
      </div>
    </div>
  )
}

const FLOW = [
  { icon: GraduationCap, title: 'Learn', text: 'Structured lessons on qubits, gates, circuits and algorithms.' },
  { icon: FlaskConical, title: 'Build', text: 'Drag gates onto a circuit canvas or write Qiskit code.' },
  { icon: CirclePlay, title: 'Run', text: 'Execute on Qiskit Aer, PennyLane, Cirq or qBraid.' },
  { icon: LineChart, title: 'Visualize', text: 'Histograms, state vectors and a 3D Bloch sphere.' },
  { icon: MessageSquareText, title: 'Ask AI', text: 'A tutor that reads your live circuit and explains it.' },
  { icon: Trophy, title: 'Practice & Track', text: 'Challenges, XP, badges and progress analytics.' },
]

const FEATURES = [
  { icon: Atom, title: 'State-vector engine in your browser', text: 'A real linear-algebra quantum simulator ships inside the frontend — every run computes actual amplitudes, no placeholders.' },
  { icon: Sparkles, title: 'Context-aware AI tutor', text: 'The tutor injects your current circuit, results and lesson into every answer — explain, debug, and generate Qiskit code.' },
  { icon: FlaskConical, title: 'Visual + code modes', text: 'Design with drag-and-drop, then flip to a Qiskit editor that round-trips back to the canvas.' },
  { icon: Orbit, title: 'Textbook visuals', text: 'Measurement histogram, complex state vector, and an interactive Bloch sphere for every wire.' },
]

export default function LandingPage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-grid">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-16 lg:grid-cols-2">
          <div>
            <span className="chip mb-5"><Sparkles size={12} className="text-accent-400" /> AI-powered · interactive · open</span>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Learn quantum computing by{' '}
              <span className="text-gradient">building and running</span> real circuits.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              QubitLabs combines interactive lessons, a quantum circuit lab, one-click simulation, and an AI tutor that understands exactly what you're building.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register" className="btn-primary px-6 py-3 text-base">
                Start learning free <ArrowRight size={18} />
              </Link>
              <Link to="/lab" className="btn-ghost px-6 py-3 text-base">
                <FlaskConical size={18} /> Try the Quantum Lab
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-400">
              <span>✅ No hardware needed</span>
              <span>✅ Free forever</span>
              <span>✅ 30-second demos</span>
            </div>
          </div>
          <AnimatedCircuit />
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white">One product loop</h2>
          <p className="mx-auto mt-2 max-w-2xl text-slate-400">Learn → Build → Run → Visualize → Ask AI → Practice → Track progress. Everything flows together.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {FLOW.map((f, i) => (
            <div key={f.title} className="glass rounded-2xl p-4 transition hover:bg-mid-700/40">
              <div className="mb-3 flex items-center justify-between">
                <f.icon size={20} className="text-accent-400" />
                <span className="text-[10px] font-bold text-slate-500">0{i + 1}</span>
              </div>
              <div className="font-semibold text-white">{f.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-y border-slate-800/70 bg-mid-900/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white">Built to actually teach</h2>
            <p className="mx-auto mt-2 max-w-2xl text-slate-400">Theory, interaction and AI feedback in a single cockpit.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6 flex gap-4">
                <div className="shrink-0 rounded-xl bg-brand-500/15 p-3 text-brand-300"><f.icon size={22} /></div>
                <div>
                  <div className="font-semibold text-white">{f.title}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <section id="learn" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Structured curriculum</h2>
            <p className="mt-2 text-slate-400">Four levels, from your first qubit to Shor's algorithm — every lesson opens the Lab.</p>
          </div>
          <Link to="/learn" className="btn-ghost px-4 py-2 text-sm">Browse all <ArrowRight size={15} /></Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {COURSES.map((c) => (
            <div key={c.id} className="glass rounded-2xl p-5" style={{ borderTop: `3px solid ${c.color}` }}>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: c.color }}>Level {c.level}</div>
              <div className="font-semibold text-white">{c.title}</div>
              <p className="mb-4 mt-1 text-xs text-slate-400">{c.tagline}</p>
              <div className="space-y-1">
                {c.lessons.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-slate-500" /> {l.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-gradient-to-br from-brand-600/20 via-mid-800 to-accent-500/10 p-10 text-center">
          <BrainCircuit size={54} className="mx-auto mb-4 text-accent-400" />
          <h2 className="text-3xl font-bold text-white">Stuck on a concept? Just ask.</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            The AI tutor reads your live circuit, your results and your lesson — and answers in plain language with Qiskit code when useful.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn-primary px-7 py-3 text-base">Create your account <ArrowRight size={18} /></Link>
            <Link to="/login" className="btn-ghost px-7 py-3 text-base">I already have one</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/70 py-8 text-center text-xs text-slate-500">
        QubitLabs · Smart India Hackathon demo build · Learn · Build · Run · Visualize · Ask AI · Practice · Track
      </footer>
    </div>
  )
}