import { useEffect, useState } from 'react'
import type { RankingEntry } from '../../types/api.ts'
import { fetchRankings } from '../../lib/api.ts'

export function RankingBoard() {
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchRankings(10)
      .then(r => { setRankings(r.rankings); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (error) return null
  if (loading) {
    return (
      <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/[0.06]">
        <p className="text-[10px] text-white/40 tracking-widest mb-2">GLOBAL RANKING</p>
        <p className="text-xs text-white/40">Loading...</p>
      </div>
    )
  }
  if (rankings.length === 0) return null

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/[0.06]">
      <p className="text-[10px] text-white/40 tracking-widest mb-2">GLOBAL RANKING</p>
      {rankings.map((r, i) => (
        <div
          key={r.id}
          className="flex justify-between py-1 text-xs text-white/60"
        >
          <span>#{i + 1} {r.nickname} — {r.score}pts</span>
          <span>{r.rankTitle}</span>
        </div>
      ))}
    </div>
  )
}
