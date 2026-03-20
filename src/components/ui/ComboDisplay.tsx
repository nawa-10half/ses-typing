import type { ComboLevel } from '../../types/game.ts'

interface ComboDisplayProps {
  combo: number
  level: ComboLevel
  multiplier: number
}

const levelColors: Record<string, string> = {
  '1': 'bg-amber-500 text-black',
  '2': 'bg-orange-500 text-black',
  '3': 'bg-red-500 text-white',
  max: 'bg-purple-500 text-white shadow-purple-500/50 shadow-lg',
}

export function ComboDisplay({ combo, level, multiplier }: ComboDisplayProps) {
  if (combo < 30) return <div className="min-h-9 mt-2" />

  return (
    <div className="min-h-9 mt-2 flex items-center justify-center gap-2">
      <span
        className={`
          inline-flex items-center gap-1 px-3 py-1 rounded-full
          text-[13px] font-bold tracking-wide
          animate-combo-glow transition-all duration-300
          ${levelColors[level] ?? ''}
        `}
      >
        {combo} COMBO
      </span>
      <span className="text-xs text-white/60 font-medium">
        x{multiplier.toFixed(1)}
      </span>
    </div>
  )
}
