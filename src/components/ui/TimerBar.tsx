interface TimerBarProps {
  pct: number
}

export function TimerBar({ pct }: TimerBarProps) {
  const color = pct > 0.5
    ? 'bg-white'
    : pct > 0.25
      ? 'bg-amber-400'
      : 'bg-red-400'

  return (
    <div className="h-1 bg-white/[0.06] rounded-full mb-6 overflow-hidden">
      <div
        className={`h-full rounded-full transition-colors duration-300 ${color}`}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  )
}
