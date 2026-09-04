import { useEffect, useRef, useState } from 'react'
import { Bot, Send, Sparkles, UserRound, Wand2, Bug, CloudOff } from 'lucide-react'
import { MiniMarkdown, Spinner } from '../../components/ui'
import { answerQuestion, quickPrompts } from '../../lib/quantum/ai'
import { chatTutor, type ChatMessage } from '../../lib/backend'
import { useAuthStore } from '../../store/authStore'
import { useCircuitStore } from '../../store/circuitStore'

interface Message {
  role: 'ai' | 'user'
  text: string
}

export default function AITutorPanel() {
  const circuit = useCircuitStore((s) => s.circuit)
  const result = useCircuitStore((s) => s.result)
  const skillLevel = useAuthStore((s) => s.user?.skillLevel)

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: 'Hi! I\'m reading your live circuit as you build it. Ask me to explain what it does, debug a weird result, or generate Qiskit code.',
    },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(() => quickPrompts())
  const [aiSource, setAiSource] = useState<'backend' | 'local'>('backend')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const ask = async (question: string) => {
    if (!question.trim() || thinking) return
    setMessages((m) => [...m, { role: 'user', text: question }])
    setInput('')
    setThinking(true)

    const history: ChatMessage[] = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      content: m.text,
    }))

    try {
      const res = await chatTutor(circuit, question, history)
      setMessages((m) => [...m, { role: 'ai', text: res.ai_response }])
      setAiSource('backend')
      setSuggestions(quickPrompts())
    } catch {
      const reply = answerQuestion({ question, circuit, result: result ?? undefined, skillLevel })
      setMessages((m) => [...m, { role: 'ai', text: reply.text }])
      setSuggestions(reply.suggestions ?? [])
      setAiSource('local')
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="lab-panel flex h-full min-h-[420px] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-700/50 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white">
          <Bot size={16} />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Quantum Tutor</div>
          <div className="text-[10px] text-slate-400">context: live circuit + results</div>
        </div>
        <span className={`ml-auto flex items-center gap-1 text-[10px] ${aiSource === 'backend' ? 'text-emerald-400' : 'text-amber-400'}`}>
          {aiSource === 'backend' ? (
            <><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> online</>
          ) : (
            <><CloudOff size={10} /> local</>
          )}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`msg-in flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${m.role === 'user' ? 'bg-slate-700' : 'bg-brand-500/20 text-brand-300'}`}>
              {m.role === 'user' ? <UserRound size={13} /> : <Bot size={13} />}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-tr-sm bg-brand-500/25 text-slate-100'
                  : 'rounded-tl-sm bg-mid-700/60 text-slate-200'
              }`}
            >
              <span className="[&_b]:text-white"><MiniMarkdown text={m.text} /></span>
            </div>
          </div>
        ))}
        {thinking && (
          <div className="msg-in flex gap-2">
            <Bot size={16} className="mt-1 text-brand-300" />
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-mid-700/60 px-3 py-2.5 text-accent-300">
              <Spinner className="h-3.5 w-3.5" /> reasoning about your circuit…
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-700/50 p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.slice(0, 2).map((s) => (
            <button key={s} onClick={() => void ask(s)} className="chip text-[11px] transition hover:border-accent-400/60 hover:text-accent-200">
              {s}
            </button>
          ))}
          <button onClick={() => void ask('Debug my circuit')} className="chip text-[11px] text-rose-300 transition hover:border-rose-400/60"><Bug size={11} /> Debug</button>
          <button onClick={() => void ask('Explain my circuit')} className="chip text-[11px] text-accent-300 transition hover:border-accent-400/60"><Wand2 size={11} /> Explain</button>
          <button onClick={() => void ask('Generate Bell state code')} className="chip text-[11px] text-emerald-300 transition hover:border-emerald-400/60"><Sparkles size={11} /> Qiskit</button>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void ask(input)
            }}
            placeholder="Ask anything about quantum computing…"
          />
          <button className="btn-primary h-10 w-10 shrink-0 p-0" onClick={() => void ask(input)} aria-label="Send">
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
