import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, FlaskConical, Sparkles, Trophy } from 'lucide-react'
import { Badge, Card, Primary } from '../../components/ui'
import { findLesson, findCourse } from '../../data/courses'
import { useProgressStore, lessonDone } from '../../store/progressStore'
import { useCircuitStore } from '../../store/circuitStore'
import type { QuantumCircuit, QuantumGate } from '../../lib/quantum/types'
import { MiniCircuitPreview } from '../../components/MinCircuitPreview'

function lessonCircuit(courseId: string, lessonId: string): QuantumCircuit | null {
  const lesson = findLesson(courseId, lessonId)
  if (!lesson?.example) return null
  const gates: QuantumGate[] = lesson.example.gates.map((g) => ({
    id: crypto.randomUUID(),
    type: g.type as QuantumGate['type'],
    qubits: [g.qubit],
    moment: g.moment,
  }))
  return { id: crypto.randomUUID(), name: lesson.title, qubits: lesson.example.qubits, gates }
}

export default function LessonPage() {
  const { courseId = '', lessonId = '' } = useParams()
  const navigate = useNavigate()
  const course = findCourse(courseId)
  const lesson = findLesson(courseId, lessonId)

  const completed = useProgressStore((s) => s.completed)
  const completeLesson = useProgressStore((s) => s.completeLesson)
  const loadCircuit = useCircuitStore((s) => s.loadCircuit)
  const setMode = useCircuitStore((s) => s.setMode)

  const [quiz, setQuiz] = useState<Record<number, number>>({})
  const [done, setDone] = useState(false)

  const baseCircuit = useMemo(() => lessonCircuit(courseId, lessonId), [courseId, lessonId])

  if (!course || !lesson) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="text-xl font-semibold text-white">Lesson not found</div>
        <Link to="/learn" className="btn-primary mt-4 px-5 py-2.5">Back to courses</Link>
      </div>
    )
  }

  const isDone = done || lessonDone(completed, courseId, lessonId)
  const idx = course.lessons.findIndex((l) => l.id === lessonId)
  const next = course.lessons[idx + 1] ?? course.lessons[0]

  const openInLab = () => {
    if (baseCircuit) {
      loadCircuit(baseCircuit)
      setMode('visual')
    }
    navigate('/lab')
  }

  const checkQuiz = () => {
    const total = lesson.quiz.reduce((acc, q, i) => acc + (quiz[i] === q.answer ? 1 : 0), 0)
    if (!isDone && total === lesson.quiz.length) {
      completeLesson(courseId, lessonId, 50)
      setDone(true)
    } else if (!isDone) {
      setDone(true)
      completeLesson(courseId, lessonId, 20)
    }
  }

  const allCorrect = lesson.quiz.every((q, i) => quiz[i] === q.answer)

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link to="/learn" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"><ArrowLeft size={15} /> {course.title}</Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge tone="cyan">Level {course.level}</Badge>
            <span className="text-sm text-slate-400">{lesson.minutes} min read + practice</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-white">{lesson.title}</h1>
        </div>
        {isDone && <Badge tone="emerald"><CheckCircle2 size={12} /> Completed</Badge>}
      </div>

      <Card className="mt-6">
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Overview</div>
        <ul className="space-y-2 text-slate-300">
          {lesson.summary.map((s, i) => (
            <li key={i} className="flex gap-2"><span className="text-accent-400">›</span>{s}</li>
          ))}
        </ul>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {lesson.concepts.map((c, i) => (
            <Card key={i}>
              <div className="mb-1 font-semibold" style={{ color: course.color }}>{i + 1}. {c.title}</div>
              <p className="text-sm leading-relaxed text-slate-300">{c.body}</p>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {baseCircuit && (
            <Card className="border-accent-400/25">
              <div className="text-xs font-bold uppercase tracking-wider text-accent-300">Try it yourself</div>
              <p className="mt-1 text-xs text-slate-400">{lesson.example?.text}</p>
              <div className="mt-3"><MiniCircuitPreview circuit={baseCircuit} /></div>
              <Primary onClick={openInLab} className="mt-3 w-full py-2 text-sm"><FlaskConical size={15} /> Open in Quantum Lab</Primary>
            </Card>
          )}
          <Card className="border-brand-500/25">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-300"><Sparkles size={13} /> Ask the tutor</div>
            <p className="mt-1 text-xs text-slate-400">Still fuzzy? The tutor knows you're in this lesson and explains at your level.</p>
            <Link to="/tutor" className="btn-ghost mt-3 w-full py-2 text-sm">Open AI Tutor</Link>
          </Card>
        </div>
      </div>

      <Card className="mt-8">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"><Trophy size={14} className="text-amber-300" /> Knowledge check</div>
        <div className="space-y-5">
          {lesson.quiz.map((q, qi) => (
            <div key={qi}>
              <div className="font-medium text-white">{qi + 1}. {q.q}</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {q.options.map((o, oi) => {
                  const selected = quiz[qi] === oi
                  const correct = isDone && oi === q.answer
                  const wrong = isDone && selected && oi !== q.answer
                  return (
                    <button
                      key={oi}
                      disabled={isDone}
                      onClick={() => setQuiz((prev) => ({ ...prev, [qi]: oi }))}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition disabled:cursor-default ${
                        correct ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-200'
                          : wrong ? 'border-rose-400/60 bg-rose-400/15 text-rose-200'
                          : selected ? 'border-brand-400/60 bg-brand-500/15 text-white'
                          : 'border-slate-700/50 bg-mid-800/40 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {o}
                    </button>
                  )
                })}
              </div>
              {isDone && <div className="mt-1.5 text-xs text-slate-400">💡 {q.explain}</div>}
            </div>
          ))}
        </div>
        {!isDone ? (
          <Primary onClick={checkQuiz} className="mt-5 px-6 py-2.5">Check answers & mark complete</Primary>
        ) : (
          <div className="mt-5 flex items-center gap-3">
            <Badge tone={allCorrect ? 'emerald' : 'amber'}>
              {allCorrect ? 'Perfect! +50 XP' : '+20 XP earned'}
            </Badge>
            <Link to={`/learn/${courseId}/${next.id}`} className="btn-primary ml-auto px-5 py-2.5 text-sm">
              Next: {next.title} <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </Card>

      <div className="mt-8 flex items-center justify-between text-sm text-slate-500">
        <Link to="/learn" className="hover:text-white">← All courses</Link>
        <Link to="/challenges" className="hover:text-white">Test yourself with challenges →</Link>
      </div>
    </div>
  )
}