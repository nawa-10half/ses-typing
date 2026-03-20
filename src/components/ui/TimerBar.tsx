interface TimerBarProps {
  pct: number
}

export function TimerBar({ pct }: TimerBarProps) {
  const isLow = pct <= 0.25
  const isMid = pct <= 0.5

  const barColor = !isMid
    ? 'bg-gradient-to-r from-white/80 to-white'
    : !isLow
      ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
      : 'bg-gradient-to-r from-red-500 to-red-400'

  return (
    <div className="h-1.5 bg-white/[0.06] rounded-full mb-6 overflow-hidden relative">
      <div
        className={`
          h-full rounded-full transition-colors duration-300
          ${barColor}
          ${isLow ? 'animate-timer-pulse' : ''}
        `}
        style={{ width: `${pct * 100}%` }}
      />
      {/* Glow effect on the bar tip */}
      {pct > 0.02 && (
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full blur-sm"
          style={{
            left: `calc(${pct * 100}% - 6px)`,
            background: isLow ? '#f87171' : isMid ? '#fbbf24' : 'white',
            opacity: 0.6,
          }}
        />
      )}
    </div>
  )
}
