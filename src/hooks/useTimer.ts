import { useRef, useCallback, useEffect } from 'react'

interface UseTimerOptions {
  onTick: (pct: number, remainingMs: number) => void
  onTimeout: () => void
}

export function useTimer({ onTick, onTimeout }: UseTimerOptions) {
  const rafRef = useRef(0)
  const endTimeRef = useRef(0)
  const maxRef = useRef(0)
  const runningRef = useRef(false)

  const tick = useCallback(() => {
    if (!runningRef.current) return
    const remaining = endTimeRef.current - performance.now()
    const pct = Math.max(0, remaining / maxRef.current)

    onTick(pct, Math.max(0, remaining))

    if (remaining <= 0) {
      runningRef.current = false
      onTimeout()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [onTick, onTimeout])

  const start = useCallback((duration: number) => {
    runningRef.current = true
    maxRef.current = duration
    endTimeRef.current = performance.now() + duration
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const stop = useCallback(() => {
    runningRef.current = false
    cancelAnimationFrame(rafRef.current)
  }, [])

  /** タイマーに時間を加算 */
  const addTime = useCallback((ms: number) => {
    endTimeRef.current += ms
    // max も更新して pct が 1.0 を超えないように
    const remaining = endTimeRef.current - performance.now()
    if (remaining > maxRef.current) {
      maxRef.current = remaining
    }
  }, [])

  /** タイマーから時間を減算 */
  const subtractTime = useCallback((ms: number) => {
    endTimeRef.current -= ms
  }, [])

  const getRemaining = useCallback(() => {
    return Math.max(0, endTimeRef.current - performance.now())
  }, [])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return { start, stop, addTime, subtractTime, getRemaining }
}
