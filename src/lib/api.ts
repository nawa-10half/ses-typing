import type { Course } from '../types/game.ts'
import type { ScoreSubmission, ScoreResponse, RankingsResponse } from '../types/api.ts'
import { COURSES as FALLBACK_COURSES } from './constants.ts'

const BASE = '/api'

/**
 * Fetch courses from KV via API.
 * Falls back to hardcoded constants on failure (offline, dev, etc.)
 */
export async function fetchCourses(): Promise<Course[]> {
  try {
    const res = await fetch(`${BASE}/words`)
    if (!res.ok) throw new Error('API error')
    const data = await res.json() as { courses: Course[] | null }
    if (data.courses && data.courses.length > 0) {
      return data.courses
    }
  } catch {
    // Silently fall back
  }
  return FALLBACK_COURSES
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
