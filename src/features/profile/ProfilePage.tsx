import { useState } from 'react'
import { LogOut, Save, UserRound } from 'lucide-react'
import { Card, Primary, Ghost, Badge } from '../../components/ui'
import { useAuthStore } from '../../store/authStore'
import { useProgressStore } from '../../store/progressStore'

const LEVELS = ['beginner', 'intermediate', 'advanced']
const INTERESTS = ['Fundamentals', 'Quantum Gates', 'Circuit Design', 'Entanglement', 'Grover', 'Shor', 'Python & Qiskit', 'Quantum ML']

export default function ProfilePage() {
  const { user, update, logout } = useAuthStore()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [level, setLevel] = useState(user?.skillLevel ?? 'beginner')
  const [interests, setInterests] = useState<string[]>(user?.interests ?? [])
  const [saved, setSaved] = useState(false)

  const { reset, xp, streak } = useProgressStore()

  const toggle = (i: string) => {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))
  }

  const save = () => {
    update({ name: name || 'Quantum Student', email, skillLevel: level, interests })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-3xl font-bold text-white">Profile</h1>
      <p className="mt-1 text-slate-400">Your identity, level and preferences — shared with the AI tutor for personalized help.</p>

      <Card className="mt-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-lg font-bold text-white">
            {(user?.name ?? 'U').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-bold text-white">{user?.name}</div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <UserRound size={13} /> {user?.email}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm font-bold text-amber-300">{xp.toLocaleString()} XP</div>
            <div className="text-xs text-slate-500">{streak}-day streak</div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-xs font-medium text-slate-400">Skill level</div>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l as typeof level)}
                className={`rounded-lg border px-4 py-2 text-sm capitalize transition ${
                  level === l ? 'border-brand-400/70 bg-brand-500/15 text-white' : 'border-slate-700/50 bg-mid-800/40 text-slate-300 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-xs font-medium text-slate-400">Interests</div>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  interests.includes(i) ? 'border-accent-400/70 bg-accent-400/10 text-accent-200' : 'border-slate-600/50 bg-slate-800/40 text-slate-300'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Primary onClick={save} className="px-6 py-2.5"><Save size={16} /> Save changes</Primary>
          {saved && <Badge tone="emerald">Saved ✓</Badge>}
          <Ghost onClick={logout} className="ml-auto px-4 py-2.5"><LogOut size={15} /> Log out</Ghost>
        </div>
      </Card>

      <Card className="mt-6 border-rose-400/20">
        <div className="text-sm font-semibold text-rose-300">Danger zone</div>
        <p className="mt-1 text-xs text-slate-400">Wipe lessons, XP, badges and challenge history. Your account stays.</p>
        <Ghost onClick={reset} className="mt-3 px-4 py-2 text-sm text-rose-300">Reset progress</Ghost>
      </Card>
    </div>
  )
}