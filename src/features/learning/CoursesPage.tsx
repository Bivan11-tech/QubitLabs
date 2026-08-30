import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { Progress } from '../../components/ui'
import { COURSES } from '../../data/courses'
import { useProgressStore, coursePercent } from '../../store/progressStore'

export default function CoursesPage() {
  const completed = useProgressStore((s) => s.completed)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold text-white">Learning paths</h1>
      <p className="mt-1 text-slate-400">Four levels from first qubits to famous algorithms. Every lesson is interactive.</p>

      <div className="mt-8 space-y-8">
        {COURSES.map((course) => {
          const pct = coursePercent(completed, course.id, course.lessons.length)
          return (
            <section key={course.id}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-2xl font-bold" style={{ color: course.color }}>0{course.level}</span>
                    <div>
                      <div className="text-lg font-bold text-white">{course.title}</div>
                      <div className="text-xs text-slate-400">{course.tagline}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={pct} className="w-32" />
                  <span className="text-sm font-semibold text-white">{pct}%</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {course.lessons.map((lesson) => {
                  const done = (completed[course.id] ?? []).includes(lesson.id)
                  return (
                    <Link
                      key={lesson.id}
                      to={`/learn/${course.id}/${lesson.id}`}
                      className="group flex items-center gap-4 rounded-xl border border-slate-700/50 bg-mid-800/50 p-4 transition hover:border-brand-500/40 hover:bg-mid-700/40"
                    >
                      {done ? (
                        <CheckCircle2 size={22} className="shrink-0 text-emerald-400" />
                      ) : (
                        <Circle size={22} className="shrink-0 text-slate-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white group-hover:text-brand-300 transition">{lesson.title}</div>
                        <div className="text-xs text-slate-400">{lesson.minutes} min · {lesson.quiz.length} quiz questions</div>
                      </div>
                      <ArrowRight size={18} className="shrink-0 text-slate-500 transition group-hover:text-brand-300" />
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}