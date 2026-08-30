import { Link } from 'react-router-dom'
import { ArrowRight, Flame, GraduationCap, Sparkles, Trophy } from 'lucide-react'
import { Card, Progress, SectionTitle, Badge } from '../../components/ui'
import { useAuthStore } from '../../store/authStore'
import { useProgressStore, coursePercent } from '../../store/progressStore'
import { COURSES, TOTAL_LESSONS } from '../../data/courses'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { xp, streak, completed, completedChallenges } = useProgressStore()

  const doneCount = Object.values(completed).reduce((acc, l) => acc + l.length, 0)
  const overall = Math.round((doneCount / TOTAL_LESSONS) * 100)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const current = {
    course: COURSES[0],
    lesson: COURSES[0].lessons[1],
  }

  const recommended = COURSES.slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xl font-bold text-white">
            {greeting}, {user?.name?.split(' ')[0] ?? 'there'} 👋
          </div>
          <p className="mt-1 text-sm text-slate-400">Continue your quantum journey — your next breakthrough is one gate away.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="amber"><Flame size={12} /> {streak}-day streak</Badge>
          <Badge tone="emerald"><Sparkles size={12} /> {xp.toLocaleString()} XP</Badge>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-brand-500/30">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brand-300">Current module</div>
              <div className="mt-2 text-lg font-bold text-white">{current.course.title}</div>
              <div className="text-sm text-slate-400">{current.lesson.title} · Lesson {current.course.lessons.indexOf(current.lesson) + 1} of {current.course.lessons.length}</div>
            </div>
            <div className="rounded-xl bg-brand-500/15 p-3 text-brand-300"><GraduationCap size={26} /></div>
          </div>
          <div className="mt-5 flex items-center justify-between gap-4">
            <Progress value={coursePercent(completed, current.course.id, current.course.lessons.length)} className="flex-1" />
            <span className="whitespace-nowrap text-sm font-semibold text-white">{coursePercent(completed, current.course.id, current.course.lessons.length)}%</span>
          </div>
          <Link
            to={`/learn/${current.course.id}/${current.lesson.id}`}
            className="btn-primary mt-5 w-full py-2.5"
          >
            Continue → {current.lesson.title}
          </Link>
        </Card>

        <Card className="border-accent-400/25">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-accent-300">Learning progress</div>
              <div className="mt-2 text-lg font-bold text-white">{doneCount} / {TOTAL_LESSONS} lessons</div>
              <div className="text-sm text-slate-400">{completedChallenges.length} challenge{completedChallenges.length !== 1 ? 's' : ''} completed</div>
            </div>
            <div className="rounded-xl bg-accent-400/10 p-3 text-accent-300"><Trophy size={26} /></div>
          </div>
          <div className="mt-5 flex items-center justify-between gap-4">
            <Progress value={overall} color="bg-gradient-to-r from-accent-500 to-emerald-400" className="flex-1" />
            <span className="whitespace-nowrap text-sm font-semibold text-white">{overall}%</span>
          </div>
          <Link to="/progress" className="btn-ghost mt-5 w-full py-2.5">See full analytics</Link>
        </Card>
      </div>

      <div className="mt-10">
        <SectionTitle title="Recommended for you" sub="Based on your level and interests" />
        <div className="grid gap-4 sm:grid-cols-3">
          {recommended.map((c) => (
            <Link
              key={c.id}
              to={`/learn/${c.id}/${c.lessons[0].id}`}
              className="glass group rounded-2xl p-5 transition hover:bg-mid-700/40"
              style={{ borderTop: `3px solid ${c.color}` }}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: c.color }}>Level {c.level}</div>
              <div className="mt-1 text-lg font-bold text-white group-hover:text-accent-300 transition">{c.title}</div>
              <div className="mt-1 text-xs text-slate-400">{c.tagline}</div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>{c.lessons.length} lessons</span>
                <span className="group-hover:text-accent-300 transition"><ArrowRight size={16} /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <SectionTitle title="Recent activity" sub="Your latest steps across the platform" />
        <Card className="space-y-3 text-sm text-slate-300">
          <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Completed <b className="text-white">Superposition</b> · Fundamentals level 1</div>
          <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Built a <b className="text-white">Bell State</b> in the Quantum Lab (+100 XP)</div>
          <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-accent-400" /> Asked the tutor <b className="text-white">"why is it entangled?"</b></div>
          <Link to="/lab" className="btn-primary mt-2 w-full py-2.5"><Sparkles size={16} /> Jump into the Lab</Link>
        </Card>
      </div>
    </div>
  )
}