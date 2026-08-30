export function Logo({ size = 30 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" stroke="url(#lg)" strokeWidth="3" />
        <ellipse cx="24" cy="24" rx="20" ry="8" stroke="url(#lg)" strokeWidth="1.6" transform="rotate(-30 24 24)" />
        <ellipse cx="24" cy="24" rx="20" ry="8" stroke="url(#lg)" strokeWidth="1.6" transform="rotate(30 24 24)" />
        <circle cx="24" cy="24" r="5" fill="#22d3ee" />
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="48" y2="48">
            <stop stopColor="#818cf8" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="leading-none">
        <div className="text-base font-extrabold tracking-tight text-white">
          Qubit<span className="text-gradient">Labs</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Quantum Learning</div>
      </div>
    </div>
  )
}