import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LogIn, Sparkles, UserPlus } from 'lucide-react'
import { Logo } from '../../components/Logo'
import { Primary } from '../../components/ui'
import { useAuthStore } from '../../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (user) return <Navigate to="/dashboard" replace />

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = email
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
    login({ name: name || 'Quantum Student', email: email || 'student@qubitlabs.dev', skillLevel: 'beginner', interests: [], plan: 'free', joinedAt: new Date().toISOString() })
    navigate('/dashboard')
  }

  const demo = () => {
    login({ name: 'Bivan Rao', email: 'bivan@qubitlabs.dev', skillLevel: 'intermediate', interests: ['Algorithms', 'Entanglement'], plan: 'free', joinedAt: '2026-08-01' })
    navigate('/dashboard')
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center"><Logo size={40} /></div>
      <div className="glass rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-400">Continue your quantum journey.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Primary type="submit" className="w-full py-2.5"><LogIn size={17} /> Log in</Primary>
        </form>
        <button onClick={demo} className="btn-ghost mt-3 w-full py-2.5 text-sm">
          <Sparkles size={15} className="text-accent-400" /> Continue with demo account
        </button>
        <p className="mt-6 text-center text-sm text-slate-400">
          New here?{' '}
          <Link to="/register" className="inline-flex items-center gap-1 font-semibold text-accent-300 hover:underline"><UserPlus size={14} /> Create account</Link>
        </p>
      </div>
    </div>
  )
}