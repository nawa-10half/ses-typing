import { useGameStore } from '../stores/gameStore.ts'

export function usePlayerIdentity() {
  const player = useGameStore(s => s.player)
  const setNickname = useGameStore(s => s.setNickname)
  return { player, setNickname }
}
