import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { Logo } from '../../components/Logo'
import { Primary } from '../../components/ui'
import { useAuthStore } from '../../store/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    login({
      name: name || 'Quantum Student',
      email: email || 'student@qubitlabs.dev',
      skillLevel: 'beginner',
      interests: [],
      plan: 'free',
      joinedAt: new Date().toISOString(),
    })
    navigate('/onboarding')
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center"><Logo size={40} /></div>
      <div className="glass rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="mt-1 text-sm text-slate-400">Free forever. Your first Bell state takes 30 seconds.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Full name</label>
            <input className="input" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
            <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <Primary type="submit" className="w-full py-2.5"><UserPlus size={17} /> Create account</Primary>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-accent-300 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}