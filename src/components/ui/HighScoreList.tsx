import { useGameStore } from '../../stores/gameStore.ts'

interface HighScoreListProps {
  currentScore: number
}

export function HighScoreList({ currentScore }: HighScoreListProps) {
  const highScores = useGameStore(s => s.highScores)

  if (highScores.length === 0) return null

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/[0.06]">
      <p className="text-[10px] text-white/40 tracking-widest mb-2">HIGH SCORES</p>
      {highScores.slice(0, 5).map((s, i) => {
        const isCurrent = s.score === currentScore
        return (
          <div
            key={i}
            className={`flex justify-between py-1 text-xs ${
              isCurrent ? 'text-emerald-400 font-bold' : 'text-white/60'
            }`}
          >
            <span>#{i + 1} {s.score}pts</span>
            <span>{s.accuracy}% {s.date}</span>
          </div>
        )
      })}
    </div>
  )
}
