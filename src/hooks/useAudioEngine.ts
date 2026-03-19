import { useRef, useEffect, useCallback } from 'react'
import { AudioEngine } from '../lib/audioEngine.ts'
import { useGameStore } from '../stores/gameStore.ts'

export function useAudioEngine() {
  const ref = useRef<AudioEngine | null>(null)
  const soundEnabled = useGameStore(s => s.soundEnabled)

  if (!ref.current) {
    ref.current = new AudioEngine()
  }

  const engine = ref.current

  useEffect(() => {
    engine.enabled = soundEnabled
  }, [soundEnabled, engine])

  const initAndResume = useCallback(() => {
    engine.init()
    engine.resume()
  }, [engine])

  useEffect(() => {
    const handler = () => initAndResume()
    document.addEventListener('click', handler)
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('click', handler)
      document.removeEventListener('keydown', handler)
    }
  }, [initAndResume])

  return engine
}
