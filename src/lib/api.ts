import type { ScoreSubmission, ScoreResponse, RankingsResponse, WordsResponse } from '../types/api.ts'

const BASE = '/api'

export async function fetchWords(): Promise<WordsResponse> {
  const res = await fetch(`${BASE}/words`)
  if (!res.ok) throw new Error('Failed to fetch words')
  return res.json()
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

export async function fetchRankings(limit = 20, offset = 0): Promise<RankingsResponse> {
  const res = await fetch(`${BASE}/rankings?limit=${limit}&offset=${offset}`)
  if (!res.ok) throw new Error('Failed to fetch rankings')
  return res.json()
}
