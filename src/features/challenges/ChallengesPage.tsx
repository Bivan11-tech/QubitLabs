import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Trophy, Zap } from 'lucide-react'
import { Badge, Card } from '../../components/ui'
import { CHALLENGES } from '../../data/challenges'
import { useProgressStore } from '../../store/progressStore'

const TONE = { Beginner: 'emerald', Intermediate: 'amber', Advanced: 'rose' } as const

export default function ChallengesPage() {
  const completedChallenges = useProgressStore((s) => s.completedChallenges)
  const xp = useProgressStore((s) => s.xp)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Challenges</h1>
          <p className="mt-1 text-slate-400">Solve hands-on tasks, earn XP and unlock badges. Every challenge opens in the Quantum Lab.</p>
        </div>
        <Badge tone="emerald"><Zap size={12} /> {xp.toLocaleString()} XP total</Badge>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CHALLENGES.map((c) => {
          const done = completedChallenges.includes(c.id)
          return (
            <Card key={c.id} className={`flex flex-col transition hover:bg-mid-700/40 ${done ? 'border-emerald-400/30' : ''}`}>
              <div className="mb-3 flex items-center justify-between">
                <Badge tone={TONE[c.difficulty]}>{c.difficulty}</Badge>
                {done ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300"><CheckCircle2 size={13} /> Completed</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-300"><Trophy size={12} /> {c.xp} XP</span>
                )}
              </div>
              <div className="text-lg font-bold text-white">{c.title}</div>
              <p className="mt-1 flex-1 text-sm text-slate-400">{c.description}</p>
              <div className="mb-4 mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span className="chip">{c.tag}</span>
                <span className="chip">{c.requirements.length} criteria</span>
              </div>
              <Link
                to={`/challenges/${c.id}`}
                className={`inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                  done
                    ? 'border border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:brightness-110'
                    : 'btn-primary'
                }`}
              >
                {done ? 'Replay challenge' : 'Start Challenge'} <ArrowRight size={15} />
              </Link>
            </Card>
          )
        })}
      </div>
    </div>
  )
}