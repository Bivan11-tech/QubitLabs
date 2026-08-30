import type { ReactNode } from 'react'
import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from 'react'

export function Button({ children, ...props }: ComponentProps<'button'>) {
  return (
    <button {...props} className={`${props.className ?? ''}`}>
      {children}
    </button>
  )
}

export function Primary({ children, className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button {...props} className={`btn-primary ${className}`}>
      {children}
    </button>
  )
}

export function Ghost({ children, className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button {...props} className={`btn-ghost ${className}`}>
      {children}
    </button>
  )
}

export function Card({ children, className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div {...props} className={`rounded-xl border border-slate-700/50 bg-mid-800/60 p-5 ${className}`}>
      {children}
    </div>
  )
}

export function Badge({ children, tone = 'slate', className = '' }: { children: ReactNode; tone?: 'slate' | 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose'; className?: string }) {
  const tones: Record<string, string> = {
    slate: 'border-slate-600 bg-slate-800/60 text-slate-300',
    cyan: 'border-accent-400/40 bg-accent-400/10 text-accent-300',
    violet: 'border-brand-400/40 bg-brand-500/10 text-brand-300',
    emerald: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    amber: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
    rose: 'border-rose-400/40 bg-rose-400/10 text-rose-300',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}>{children}</span>
}

export function Progress({ value, color = 'bg-gradient-to-r from-brand-500 to-accent-500', className = '', style }: { value: number; color?: string; className?: string; style?: CSSProperties }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-700/40 ${className}`}>
      <div className={`bar-fill h-full rounded-full ${color}`} style={{ ...style, width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Stat({ label, value, icon, hint }: { label: string; value: ReactNode; icon?: ReactNode; hint?: string }) {
  return (
    <Card className="flex items-center gap-4">
      {icon && <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">{icon}</div>}
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
        <div className="mt-0.5 text-xl font-bold text-white">{value}</div>
        {hint && <div className="text-xs text-slate-400">{hint}</div>}
      </div>
    </Card>
  )
}

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {sub && <p className="text-sm text-slate-400">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Tabs<const T extends string>({ tabs, active, onChange }: { tabs: { id: T; label: string; icon?: ReactNode }[]; active: T; onChange: (t: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-700/50 bg-mid-800/60 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            active === t.id ? 'bg-brand-500/90 text-white shadow' : 'text-slate-300 hover:text-white'
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Empty({ icon, title, sub }: { icon?: ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {icon && <div className="mb-3 text-slate-500">{icon}</div>}
      <div className="font-medium text-slate-300">{title}</div>
      {sub && <div className="mt-1 max-w-sm text-sm text-slate-500">{sub}</div>}
    </div>
  )
}

/* ---------------- tiny markdown renderer for tutor replies ---------------- */

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={i} className="font-semibold text-white">{p.slice(2, -2)}</strong>
        }
        if (p.startsWith('`') && p.endsWith('`')) {
          return <code key={i} className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[0.85em] text-accent-300">{p.slice(1, -1)}</code>
        }
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

export function MiniMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let inCode = false
  let codeLines: string[] = []
  let key = 0

  const flushCode = () => {
    if (!inCode) return
    blocks.push(
      <pre key={`pre${key++}`} className="overflow-x-auto rounded-lg border border-slate-700/60 bg-[#0a0e1c] p-3 font-mono text-xs leading-relaxed text-accent-200">
        {codeLines.join('\n')}
      </pre>,
    )
    inCode = false
    codeLines = []
  }

  for (const line of lines) {
    if (line.startsWith('```')) {
      flushCode()
      inCode = !inCode
      continue
    }
    if (inCode) {
      codeLines.push(line)
      continue
    }
    if (!line.trim()) continue
    if (line.startsWith('- ')) {
      blocks.push(
        <li key={`l${key++}`} className="ml-4 list-disc marker:text-brand-300/70">
          <InlineMarkdown text={line.slice(2)} />
        </li>,
      )
    } else {
      blocks.push(
        <p key={`p${key++}`} className={key > 1 ? '' : ''}>
          <InlineMarkdown text={line} />
        </p>,
      )
    }
  }
  flushCode()

  return <div className="space-y-1.5">{blocks}</div>
}

/* ---------------- hook for focus management / click outside ---------------- */

export function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onOutside])
  return ref
}

export function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }
  return { copied, copy }
}