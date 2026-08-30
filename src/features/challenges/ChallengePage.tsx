import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Clock, FlaskConical, Lightbulb, RotateCcw, X, Zap } from 'lucide-react'
import { Badge, Card, Ghost, Primary, Spinner } from '../../components/ui'
import { findChallenge } from '../../data/challenges'
import { simulate } from '../../lib/api'
import type { QuantumCircuit, QuantumGate, SimulationResult } from '../../lib/quantum/types'
import { useCircuitStore } from '../../store/circuitStore'
import { useProgressStore } from '../../store/progressStore'

function starterCircuit(name: string, qubits: number, gates: { type: QuantumGate['type']; qubit: number; moment: number }[]): QuantumCircuit {
  return {
    id: crypto.randomUUID(),
    name,
    qubits,
    gates: gates.map((g) => ({ id: crypto.randomUUID(), type: g.type, qubits: [g.qubit], moment: g.moment })),
  }
}

interface Check {
  id: string
  label: string
  pass: boolean
}

export default function ChallengePage() {
  const { challengeId = '' } = useParams()
  const navigate = useNavigate()
  const challenge = findChallenge(challengeId)

  const circuit = useCircuitStore((s) => s.circuit)
  const loadCircuit = useCircuitStore((s) => s.loadCircuit)
  const completedChallenges = useProgressStore((s) => s.completedChallenges)
  const completeChallenge = useProgressStore((s) => s.completeChallenge)

  const [showHints, setShowHints] = useState(false)
  const [checks, setChecks] = useState<Check[] | null>(null)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)

  if (!challenge) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="text-xl font-semibold text-white">Challenge not found</div>
        <Link to="/challenges" className="btn-primary mt-4 px-5 py-2.5">Back to challenges</Link>
      </div>
    )
  }

  const done = completedChallenges.includes(challenge.id)

  const openLab = () => {
    loadCircuit(starterCircuit(challenge.title, challenge.starter.qubits, challenge.starter.gates))
    navigate('/lab')
  }

  const evaluate = async () => {
    setRunning(true)
    setChecks(null)
    const res = await simulate(circuit, 'qiskit-aer', 4096)
    const next = challenge.requirements.map((r) => ({ id: r.id, label: r.label, pass: r.check(circuit, res) }))
    setResult(res)
    setChecks(next)
    setRunning(false)
    if (next.every((n) => n.pass) && !done) {
      completeChallenge(challenge.id, challenge.xp, challenge.badgeId)
    }
  }

  const allPass = checks?.every((c) => c.pass) ?? false
  const passCount = checks?.filter((c) => c.pass).length ?? 0

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link to="/challenges" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"><ArrowLeft size={15} /> All challenges</Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Badge tone={challenge.difficulty === 'Beginner' ? 'emerald' : challenge.difficulty === 'Intermediate' ? 'amber' : 'rose'}>
          {challenge.difficulty}
        </Badge>
        <Badge tone="cyan">{challenge.tag}</Badge>
        <Badge tone="emerald"><Zap size={11} /> {challenge.xp} XP</Badge>
        {done && <Badge tone="emerald">✓ Completed</Badge>}
      </div>
      <h1 className="mt-2 text-3xl font-bold text-white">{challenge.title}</h1>
      <p className="mt-2 text-slate-300">{challenge.description}</p>
      <p className="mt-1 text-sm text-slate-400">Goal: {challenge.goal}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Card>
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Requirements</div>
            <ul className="space-y-2.5">
              {challenge.requirements.map((r) => {
                const c = checks?.find((x) => x.id === r.id)
                return (
                  <li key={r.id} className="flex items-center gap-3 text-sm text-slate-200">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        c === undefined ? 'border-slate-600 text-slate-500' : c.pass ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300' : 'border-rose-400 bg-rose-400/20 text-rose-300'
                      }`}
                    >
                      {c === undefined ? <span className="h-1 w-1 rounded-full bg-slate-500" /> : c.pass ? <Check size={12} /> : <X size={12} />}
                    </span>
                    {r.label}
                  </li>
                )
              })}
            </ul>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Primary onClick={openLab} className="px-5 py-2.5"><FlaskConical size={16} /> Open Lab (starter loaded)</Primary>
            <Primary onClick={() => void evaluate()} disabled={running} className="px-5 py-2.5">
              {running ? <><Spinner className="h-4 w-4" /> Evaluating…</> : <>Run & Evaluate</>}
            </Primary>
            <Ghost onClick={() => setShowHints((v) => !v)} className="px-4 py-2.5"><Lightbulb size={15} /> Hints</Ghost>
          </div>

          {running && (
            <Card className="flex items-center gap-2 text-sm text-accent-300">
              <Spinner className="h-4 w-4" /> Simulating your current Lab circuit with 4096 shots…
            </Card>
          )}

          {checks && (
            <Card className={`border ${allPass ? 'border-emerald-400/50' : 'border-rose-400/40'}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold">
                  {allPass ? <span className="text-emerald-300">🎉 Submission passed! +{challenge.xp} XP</span> : <span className="text-rose-300">Not quite — {passCount}/{challenge.requirements.length} criteria met</span>}
                </div>
                {result && <span className="text-xs text-slate-400">{result.shots} shots · {result.executionTime}s</span>}
              </div>
              {allPass && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to="/progress" className="btn-primary px-4 py-2 text-sm">View progress</Link>
                  <Link to="/challenges" className="btn-ghost px-4 py-2 text-sm">More challenges</Link>
                </div>
              )}
              {!allPass && (
                <p className="mt-3 text-xs text-slate-400">
                  Head back to the Lab, tweak your circuit, then return here to re-evaluate. The AI tutor can explain what's missing.
                </p>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400"><Clock size={13} /> Hints</div>
            {showHints ? (
              <ul className="space-y-1.5 text-sm text-slate-300">
                {challenge.hints.map((h, i) => <li key={i} className="flex gap-2"><span className="text-accent-400">{i + 1}.</span>{h}</li>)}
              </ul>
            ) : (
              <button onClick={() => setShowHints(true)} className="text-sm text-accent-300 hover:underline">I'm stuck — show hints</button>
            )}
          </Card>
          <Card>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Submission</div>
            <p className="text-sm text-slate-300">
              Starter: <b className="text-white">{challenge.starter.qubits} qubits</b>, {challenge.starter.gates.length} gates. You can start from scratch too.
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <RotateCcw size={12} /> Build in the Lab, then return and hit <b>Run & Evaluate</b>.
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}