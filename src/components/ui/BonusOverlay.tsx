import { useGameStore, useBonusPhase } from '../../stores/gameStore.ts'
import type { AudioEngine } from '../../lib/audioEngine.ts'
import { SuperBonusOverlay } from './SuperBonusOverlay.tsx'
import { BonusNormalOverlay } from './BonusNormalOverlay.tsx'
import { BonusIncidentOverlay } from './BonusIncidentOverlay.tsx'
import { BonusGachaOverlay } from './BonusGachaOverlay.tsx'

interface BonusOverlayProps {
  audio: AudioEngine
  onEnd: () => void
}

export function BonusOverlay({ audio, onEnd }: BonusOverlayProps) {
  const bonusPhase = useBonusPhase()
  const bonusMode = useGameStore(s => s.bonusMode)

  if (bonusPhase.startsWith('super-')) {
    return <SuperBonusOverlay audio={audio} onEnd={onEnd} />
  }

  switch (bonusMode) {
    case 'incident':
      return <BonusIncidentOverlay audio={audio} onEnd={onEnd} />
    case 'gacha':
      return <BonusGachaOverlay audio={audio} onEnd={onEnd} />
    default:
      return <BonusNormalOverlay audio={audio} onEnd={onEnd} />
  }
}
