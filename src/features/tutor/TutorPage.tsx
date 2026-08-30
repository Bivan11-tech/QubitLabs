import { useEffect, useRef, useState } from 'react'
import { Bot, Send, Sparkles, UserRound, BookOpen, GraduationCap } from 'lucide-react'
import { Badge, MiniMarkdown, Spinner, Card } from '../../components/ui'
import { answerQuestion, quickPrompts } from '../../lib/quantum/ai'
import { useAuthStore } from '../../store/authStore'
import { useProgressStore } from '../../store/progressStore'
import { useCircuitStore } from '../../store/circuitStore'
import { COURSES, TOTAL_LESSONS } from '../../data/courses'

interface Msg { role: 'ai' | 'user'; text: string }

export default function TutorPage() {
  const user = useAuthStore((s) => s.user)
  const { xp, completed, streak } = useProgressStore()
  const circuit = useCircuitStore((s) => s.circuit)
  const result = useCircuitStore((s) => s.result)
  const mode = useCircuitStore((s) => s.mode)

  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: `Hi ${user?.name?.split(' ')[0] ?? 'there'}! I'm your Quantum Tutor. I keep track of your level (**${user?.skillLevel ?? 'beginner'}**), your **${Object.values(completed).flat().length} completed lessons**, and even the circuit currently in your Lab. What shall we dig into?` },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(quickPrompts())
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const ask = (question: string) => {
    if (!question.trim() || thinking) return
    setMessages((m) => [...m, { role: 'user', text: question }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      const reply = answerQuestion({ question, circuit, result: result ?? undefined, skillLevel: user?.skillLevel })
      setMessages((m) => [...m, { role: 'ai', text: reply.text }])
      setSuggestions(reply.suggestions ?? [])
      setThinking(false)
    }, 700)
  }

  const more = () => {
    if (suggestions.length === 0) return
    ask(suggestions[0])
  }

  return (
    <div className="mx-auto grid h-full max-w-[1500px] gap-4 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* context side panel */}
      <aside className="hidden space-y-4 lg:block">
        <Card>
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Tutor context</div>
          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex items-center gap-2"><GraduationCap size={15} className="text-brand-300" /> Level: <b className="capitalize text-white">{user?.skillLevel ?? 'beginner'}</b></div>
            <div className="flex items-center gap-2"><BookOpen size={15} className="text-accent-300" /> {Object.values(completed).flat().length}/{TOTAL_LESSONS} lessons done</div>
            <div className="flex items-center gap-2"><Sparkles size={15} className="text-amber-300" /> {xp.toLocaleString()} XP · {streak}-day streak</div>
          </div>
        </Card>
        <Card>
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Lab snapshot</div>
          <div className="text-sm text-slate-300">
            {mode === 'visual' ? `${circuit.gates.length} gates · ${circuit.qubits} qubits` : 'Code mode'}
            {result && <><br /><span className="text-accent-300">Last run: {result.shots} shots · {result.executionTime}s</span></>}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['Explain concept', 'Generate code', 'Debug circuit', 'Optimize', '7-day plan'].map((q) => (
              <button key={q} onClick={() => ask(q)} className="chip text-[11px] transition hover:border-accent-400/60 hover:text-accent-200">{q}</button>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Curriculum</div>
          <div className="space-y-1.5 text-xs">
            {COURSES.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                {c.title} <span className="ml-auto text-slate-600">{(completed[c.id] ?? []).length}/{c.lessons.length}</span>
              </div>
            ))}
          </div>
        </Card>
      </aside>

      {/* chat */}
      <div className="lab-panel flex min-h-[calc(100vh-120px)] flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-700/50 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white"><Bot size={18} /></div>
          <div>
            <div className="text-sm font-semibold text-white">Full-screen Quantum Tutor</div>
            <div className="text-[11px] text-slate-400">explain · generate · debug · optimize · learn</div>
          </div>
          <Badge tone="emerald" className="ml-auto">context-aware</Badge>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={`msg-in flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${m.role === 'user' ? 'bg-slate-700' : 'bg-brand-500/20 text-brand-300'}`}>
                {m.role === 'user' ? <UserRound size={14} /> : <Bot size={14} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'rounded-tr-sm bg-brand-500/25 text-slate-100' : 'rounded-tl-sm bg-mid-700/60 text-slate-200'}`}>
                <MiniMarkdown text={m.text} />
              </div>
            </div>
          ))}
          {thinking && (
            <div className="msg-in flex gap-2">
              <Bot size={18} className="mt-1 text-brand-300" />
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-mid-700/60 px-4 py-3 text-accent-300"><Spinner className="h-4 w-4" /> thinking…
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-700/50 p-4">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {suggestions.slice(0, 5).map((s) => (
              <button key={s} onClick={() => ask(s)} className="chip text-[11px] transition hover:border-accent-400/60 hover:text-accent-200">{s}</button>
            ))}
            {suggestions.length > 0 && <button onClick={more} className="chip text-[11px] text-slate-500">more ▾</button>}
          </div>
          <div className="flex items-center gap-2">
            <input
              className="input py-2.5"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') ask(input) }}
              placeholder="Ask anything — I already know what you're learning…"
            />
            <button className="btn-primary h-11 w-11 shrink-0 p-0" onClick={() => ask(input)} aria-label="Send"><Send size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}