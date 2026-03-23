import { useEffect, useState } from 'react'
import { fetchRankings, type RankingEntry } from '../../lib/api.ts'

interface RankingBoardProps {
  courseId?: string
  highlightPlayerId?: string
}

export function RankingBoard({ courseId, highlightPlayerId }: RankingBoardProps) {
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchRankings(courseId, 10)
      .then(r => { setRankings(r.rankings); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [courseId])

  if (error || (!loading && rankings.length === 0)) return null

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/[0.06]">
      <p className="text-[10px] text-white/40 tracking-widest mb-3">GLOBAL RANKING</p>
      {loading ? (
        <p className="text-xs text-white/30">Loading...</p>
      ) : (
        <div className="space-y-1">
          {rankings.map((r, i) => {
            const isMe = r.id === highlightPlayerId
            return (
              <div
                key={r.id}
                className={`flex justify-between items-center py-1.5 text-xs ${
                  isMe ? 'text-emerald-400 font-bold' : 'text-white/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 text-right text-white/30">#{i + 1}</span>
                  <span>{r.nickname}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-white/30">{r.kps}打/秒</span>
                  <span className="min-w-[60px] text-right">{r.score}pts</span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
