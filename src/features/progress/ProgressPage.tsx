import { useMemo } from 'react'
import { Award, Flame, Sparkles, Target } from 'lucide-react'
import { Card, Progress, SectionTitle, Stat, Badge } from '../../components/ui'
import { COURSES, TOTAL_LESSONS } from '../../data/courses'
import { useProgressStore } from '../../store/progressStore'

const ACTIVITY = [4, 6, 3, 8, 5, 7, 6, 9, 5, 8, 7, 9, 6, 8, 10, 7, 9, 8, 6, 7, 8, 9, 7, 6, 8, 9, 10, 8]

export default function ProgressPage() {
  const { xp, streak, completed, badges, completedChallenges, quizScores } = useProgressStore()

  const doneCount = useMemo(() => Object.values(completed).reduce((a, l) => a + l.length, 0), [completed])
  const overall = Math.round((doneCount / TOTAL_LESSONS) * 100)

  const strong = COURSES.filter((c) => ((completed[c.id] ?? []).length / c.lessons.length) >= 0.5)
  const weak = COURSES.filter((c) => ((completed[c.id] ?? []).length / c.lessons.length) < 0.5 && (completed[c.id] ?? []).length > 0)
  const untouched = COURSES.filter((c) => ((completed[c.id] ?? []).length) === 0)

  const nextLevel = 2000
  const toNext = Math.max(0, nextLevel - xp)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold text-white">Your Quantum Journey</h1>
      <p className="mt-1 text-slate-400">Completion, XP, badges and pulse — all in one dashboard.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total XP" value={<span className="text-amber-300">{xp.toLocaleString()}</span>} icon={<Sparkles size={20} />} hint={`${toNext.toLocaleString()} XP to next tier`} />
        <Stat label="Day streak" value={<span className="text-orange-300">{streak} days</span>} icon={<Flame size={20} />} hint="keep it alive with one lesson a day" />
        <Stat label="Lessons" value={`${doneCount}/${TOTAL_LESSONS}`} icon={<Target size={20} />} hint={`${overall}% complete`} />
        <Stat label="Badges" value={`${badges.filter((b) => b.earned).length}/${badges.length}`} icon={<Award size={20} />} hint={`${completedChallenges.length} challenges done`} />
      </div>

      <Card className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-white">Overall completion</span>
          <span className="font-mono text-accent-300">{overall}%</span>
        </div>
        <Progress value={overall} color="bg-gradient-to-r from-brand-500 to-accent-500" />
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionTitle title="Course breakdown" />
          <div className="space-y-4">
            {COURSES.map((c) => {
              const done = (completed[c.id] ?? []).length
              const pct = Math.round((done / c.lessons.length) * 100)
              return (
                <Card key={c.id} className="py-4" style={{ borderLeft: `3px solid ${c.color}` }}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-white">{c.title} <span className="text-xs font-normal text-slate-400">· Level {c.level}</span></span>
                    <span className="text-xs text-slate-400">{done}/{c.lessons.length} lessons</span>
                  </div>
                  <Progress value={pct} style={{ background: c.color }} />
                </Card>
              )
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <SectionTitle title="Strengths & gaps" />
            <Card>
              {strong.length > 0 && (
                <div className="mb-3">
                  <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">Strongest</div>
                  <div className="flex flex-wrap gap-1.5">
                    {strong.map((c) => <Badge key={c.id} tone="emerald">{c.title} ✓</Badge>)}
                  </div>
                </div>
              )}
              {weak.length > 0 && (
                <div>
                  <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">Needs practice</div>
                  <div className="flex flex-wrap gap-1.5">
                    {weak.map((c) => <Badge key={c.id} tone="amber">{c.title} ⚠</Badge>)}
                  </div>
                </div>
              )}
              {untouched.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">Not started</div>
                  <div className="flex flex-wrap gap-1.5">
                    {untouched.map((c) => <Badge key={c.id} tone="slate">{c.title}</Badge>)}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div>
            <SectionTitle title="Weekly activity" sub={`${streak} consecutive days`} />
            <Card>
              <div className="flex items-end gap-1" style={{ height: 90 }}>
                {ACTIVITY.map((v, i) => (
                  <div key={i} className="bar-fill flex-1 rounded-t-sm" style={{ height: `${(v / 10) * 100}%`, background: i === ACTIVITY.length - 1 ? '#22d3ee' : '#4f46e5', opacity: 0.5 + (v / 10) * 0.5 }} />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                <span>3 weeks ago</span><span>today</span>
              </div>
            </Card>
          </div>

          <div>
            <SectionTitle title="Badges" />
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
              {badges.map((b) => (
                <div key={b.id} className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${b.earned ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-slate-700/50 bg-mid-800/40 opacity-40 grayscale'}`}>
                  <span className="text-2xl">{b.icon}</span>
                  <span className="text-[10px] font-medium text-slate-200">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {Object.keys(quizScores).length > 0 && (
        <Card className="mt-8">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Quiz scores</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(quizScores).map(([k, v]) => (
              <Badge key={k} tone="cyan">{k}: {v}%</Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}