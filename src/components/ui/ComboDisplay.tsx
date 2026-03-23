import { useEffect, useRef } from 'react'
import type { ComboLevel } from '../../types/game.ts'

interface ComboDisplayProps {
  combo: number
  level: ComboLevel
}

const levelStyles: Record<string, string> = {
  '1': 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-amber-500/30 shadow-lg',
  '2': 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/30 shadow-lg',
  '3': 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-red-500/40 shadow-xl',
  max: 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-purple-500/50 shadow-xl',
}

export function ComboDisplay({ combo, level }: ComboDisplayProps) {
  const prevLevelRef = useRef(level)
  const bounceRef = useRef(false)

  useEffect(() => {
    if (level !== '0' && level !== prevLevelRef.current) {
      bounceRef.current = true
      setTimeout(() => { bounceRef.current = false }, 400)
    }
    prevLevelRef.current = level
  }, [level])

  if (combo < 15) return <div className="min-h-9 mt-2" />

  return (
    <div className="min-h-9 mt-2 flex items-center justify-center gap-3">
      <span
        className={`
          inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full
          text-[13px] font-extrabold tracking-wider
          animate-combo-glow transition-all duration-300
          ${bounceRef.current ? 'animate-combo-bounce' : ''}
          ${levelStyles[level] ?? ''}
        `}
      >
        {combo} COMBO
      </span>
    </div>
  )
}
