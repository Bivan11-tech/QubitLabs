import { Link, Outlet } from 'react-router-dom'
import { Logo } from '../Logo'

export default function GuestLayout() {
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 border-b border-slate-800/70 bg-mid-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/"><Logo /></Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 sm:flex">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#learn" className="hover:text-white transition">Curriculum</a>
            <a href="#workflow" className="hover:text-white transition">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost px-4 py-2 text-sm">Log in</Link>
            <Link to="/register" className="btn-primary px-4 py-2 text-sm">Get started</Link>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}