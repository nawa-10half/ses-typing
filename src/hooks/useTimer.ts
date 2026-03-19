import { useRef, useCallback, useEffect } from 'react'

interface UseTimerOptions {
  onTick: (pct: number) => void
  onTimeout: () => void
}

export function useTimer({ onTick, onTimeout }: UseTimerOptions) {
  const rafRef = useRef(0)
  const startRef = useRef(0)
  const maxRef = useRef(0)
  const runningRef = useRef(false)

  const tick = useCallback(() => {
    if (!runningRef.current) return
    const elapsed = performance.now() - startRef.current
    const remaining = maxRef.current - elapsed
    const pct = Math.max(0, remaining / maxRef.current)

    onTick(pct)

    if (remaining <= 0) {
      runningRef.current = false
      onTimeout()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [onTick, onTimeout])

  const start = useCallback((duration: number) => {
    runningRef.current = true
    startRef.current = performance.now()
    maxRef.current = duration
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const stop = useCallback(() => {
    runningRef.current = false
    cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return { start, stop }
}
