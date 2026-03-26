import { useGameStore } from '../../stores/gameStore.ts'
import type { AudioEngine } from '../../lib/audioEngine.ts'

interface ControlBarProps {
  audio: AudioEngine
}

export function ControlBar({ audio }: ControlBarProps) {
  const soundEnabled = useGameStore(s => s.soundEnabled)
  const toggleSound = useGameStore(s => s.toggleSound)

  const handleSound = () => {
    const enabled = toggleSound()
    audio.enabled = enabled
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <button
        onClick={handleSound}
        title="サウンド切替"
        className="
          backdrop-blur-xl bg-white/5 border border-white/10
          rounded-lg w-9 h-9 flex items-center justify-center
          cursor-pointer text-base text-white/60
          hover:bg-white/10 hover:border-white/20
          transition-all duration-200
        "
      >
        {soundEnabled ? '\u266A' : '\u00D7'}
      </button>
    </div>
  )
}
