import { useRef, useEffect } from 'react'
import type { LogEntry } from '../../types/game.ts'
import { ChartRenderer } from '../../lib/chartRenderer.ts'
import { useGameStore } from '../../stores/gameStore.ts'

interface SpeedChartProps {
  log: LogEntry[]
}

export function SpeedChart({ log }: SpeedChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const theme = useGameStore(s => s.theme)

  useEffect(() => {
    if (!canvasRef.current || log.length === 0) return
    const timer = setTimeout(() => {
      ChartRenderer.draw(canvasRef.current!, log, theme === 'dark')
    }, 400)
    return () => clearTimeout(timer)
  }, [log, theme])

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/[0.06]">
      <p className="text-[10px] text-white/40 tracking-widest mb-2">SPEED PER WORD (ms)</p>
      <canvas ref={canvasRef} className="w-full h-40" height={160} />
    </div>
  )
}
