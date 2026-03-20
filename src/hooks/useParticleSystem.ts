import { useRef, useEffect, useCallback } from 'react'
import { ParticleSystem } from '../lib/particleSystem.ts'
import { useGameStore } from '../stores/gameStore.ts'

export function useParticleSystem(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const systemRef = useRef<ParticleSystem | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const isDark = () => useGameStore.getState().theme === 'dark'
    systemRef.current = new ParticleSystem(canvasRef.current, isDark)
    return () => {
      systemRef.current?.destroy()
      systemRef.current = null
    }
  }, [canvasRef])

  // Ambient particles
  useEffect(() => {
    const interval = setInterval(() => {
      systemRef.current?.emitAmbient()
    }, 300)
    return () => clearInterval(interval)
  }, [])

  const emitCorrect = useCallback((x: number, y: number) => {
    systemRef.current?.emitCorrect(x, y)
  }, [])

  const emitWrong = useCallback((x: number, y: number) => {
    systemRef.current?.emitWrong(x, y)
  }, [])

  const emitCombo = useCallback((x: number, y: number, level: number) => {
    systemRef.current?.emitCombo(x, y, level)
  }, [])

  const confetti = useCallback((count?: number) => {
    systemRef.current?.confetti(count)
  }, [])

  const screenFlash = useCallback(() => {
    systemRef.current?.emitScreenFlash()
  }, [])

  return { emitCorrect, emitWrong, emitCombo, confetti, screenFlash }
}
