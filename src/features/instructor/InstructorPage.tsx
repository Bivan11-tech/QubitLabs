import { Activity, GraduationCap, Target, Users } from 'lucide-react'
import { Card, Progress, SectionTitle, Stat, Badge } from '../../components/ui'

const STUDENTS = [
  { name: 'Rahul Verma', progress: 82, score: 91, active: true },
  { name: 'Ananya Mehta', progress: 74, score: 84, active: true },
  { name: 'Arjun Nair', progress: 63, score: 72, active: true },
  { name: 'Sara Khan', progress: 91, score: 95, active: true },
  { name: 'Dev Patel', progress: 41, score: 58, active: false },
  { name: 'Maya Rao', progress: 68, score: 79, active: true },
]

const CONCEPTS = [
  { name: 'Superposition', pct: 88, tone: 'emerald' as const },
  { name: 'Quantum Gates', pct: 74, tone: 'emerald' as const },
  { name: 'Entanglement', pct: 52, tone: 'amber' as const },
  { name: 'Bell States', pct: 61, tone: 'amber' as const },
  { name: 'Grover', pct: 33, tone: 'rose' as const },
  { name: 'QFT', pct: 28, tone: 'rose' as const },
]

export default function InstructorPage() {
  const avgProgress = Math.round(STUDENTS.reduce((a, s) => a + s.progress, 0) / STUDENTS.length)
  const challengeRate = 64

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold text-white">Instructor dashboard</h1>
      <p className="mt-1 text-slate-400">Classroom analytics for the internal demo — completion rates, common mistakes and weak concepts.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Students" value={STUDENTS.length} icon={<Users size={20} />} hint={`${STUDENTS.filter((s) => s.active).length} active this week`} />
        <Stat label="Avg progress" value={`${avgProgress}%`} icon={<Target size={20} />} hint="across 4 learning paths" />
        <Stat label="Challenge success" value={`${challengeRate}%`} icon={<Activity size={20} />} hint="Bell state: 100%" />
        <Stat label="Avg score" value={`${Math.round(STUDENTS.reduce((a, s) => a + s.score, 0) / STUDENTS.length)}`} icon={<GraduationCap size={20} />} hint="knowledge checks" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionTitle title="Students" />
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-left text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3 w-1/3">Progress</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {STUDENTS.map((s, i) => (
                    <tr key={s.name} className="border-b border-slate-800/70 last:border-0">
                      <td className="px-4 py-3 font-medium text-white">{i === 0 && <span className="mr-1.5">🥇</span>}{s.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={s.progress} className="flex-1" color={s.progress > 70 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-amber-500'} />
                          <span className="font-mono text-xs text-slate-400">{s.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="font-mono text-slate-200">{s.score}</span></td>
                      <td className="px-4 py-3">{s.active ? <Badge tone="emerald">active</Badge> : <Badge tone="slate">idle</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <div>
            <SectionTitle title="Concept mastery" sub="across all students" />
            <Card className="space-y-3">
              {CONCEPTS.map((c) => (
                <div key={c.name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-300">{c.name}</span>
                    <span className="font-mono text-slate-400">{c.pct}%</span>
                  </div>
                  <Progress value={c.pct} color={c.tone === 'emerald' ? 'bg-emerald-400' : c.tone === 'amber' ? 'bg-amber-400' : 'bg-rose-400'} />
                </div>
              ))}
            </Card>
          </div>

          <Card className="border-brand-500/25">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-300">Common mistakes</div>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
              <li className="flex gap-2"><span>•</span> CNOT applied before any H gate — no entanglement.</li>
              <li className="flex gap-2"><span>•</span> Forgetting measurement gates → empty histograms.</li>
              <li className="flex gap-2"><span>•</span> Expecting Grover output before diffusion iterations.</li>
            </ul>
            <p className="mt-3 text-xs text-slate-500">The AI tutor detects these live and offers targeted hints.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}