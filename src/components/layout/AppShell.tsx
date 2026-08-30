import { Link, Outlet, useLocation } from 'react-router-dom'
import { FlaskConical, GitBranch, Home, Trophy, UserRound, Sparkles, BarChart3, GraduationCap } from 'lucide-react'
import { Logo } from '../Logo'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/learn', label: 'Learn', icon: GraduationCap },
  { to: '/lab', label: 'Quantum Lab', icon: FlaskConical },
  { to: '/challenges', label: 'Challenges', icon: Trophy },
  { to: '/tutor', label: 'AI Tutor', icon: Sparkles },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/instructor', label: 'Instructor', icon: GitBranch },
]

export default function AppShell() {
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex h-full">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-slate-800/80 bg-mid-900/70 backdrop-blur">
        <div className="px-5 py-5">
          <Link to="/dashboard"><Logo /></Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(`${to}/`)
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-500/15 text-white shadow-[inset_0_0_0_1px_rgba(129,140,248,0.25)]'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <Icon size={17} className={active ? 'text-brand-300' : ''} />
                {label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-400" />}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-slate-800/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{user?.name ?? 'Guest'}</div>
              <div className="truncate text-[11px] capitalize text-slate-400">{user?.skillLevel ?? 'beginner'} · qubit explorer</div>
            </div>
            <button onClick={logout} className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-rose-300" title="Sign out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </button>
          </div>
        </div>
      </aside>
      <main className="ml-60 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}