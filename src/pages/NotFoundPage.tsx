import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-mid-950 px-6 text-center">
      <div className="font-mono text-6xl font-black text-gradient">|404⟩</div>
      <p className="mt-4 text-slate-300">This state doesn't exist in our register.</p>
      <Link to="/" className="btn-primary mt-8 px-5 py-2.5">Back to home</Link>
    </div>
  )
}