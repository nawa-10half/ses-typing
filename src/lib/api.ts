const BASE = '/api'

export interface ScoreSubmission {
  playerId: string
  nickname: string
  score: number
  accuracy: number
  maxCombo: number
  totalTime: number
  rankTitle: string
  courseId: string
  kps: number
}

export interface ScoreResponse {
  id: string
  globalRank: number
}

export interface RankingEntry {
  id: string
  nickname: string
  score: number
  accuracy: number
  maxCombo: number
  kps: number
  rankTitle: string
  courseId: string
  createdAt: string
}

export interface RankingsResponse {
  rankings: RankingEntry[]
  total: number
}

export async function submitScore(data: ScoreSubmission): Promise<ScoreResponse> {
  const res = await fetch(`${BASE}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to submit score')
  return res.json()
}

export async function fetchRankings(courseId?: string, limit = 20, offset = 0): Promise<RankingsResponse> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (courseId) params.set('courseId', courseId)
  const res = await fetch(`${BASE}/rankings?${params}`)
  if (!res.ok) throw new Error('Failed to fetch rankings')
  return res.json()
}
