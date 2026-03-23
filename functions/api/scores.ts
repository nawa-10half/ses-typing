import type { Env } from '../types.ts'

interface ScoreBody {
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as ScoreBody

    const result = await context.env.DB.prepare(
      `INSERT INTO scores (player_id, nickname, score, accuracy, max_combo, total_time, rank_title, course_id, kps)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`
    ).bind(
      body.playerId,
      body.nickname,
      body.score,
      body.accuracy,
      body.maxCombo,
      Math.round(body.totalTime),
      body.rankTitle,
      body.courseId,
      body.kps,
    ).first<{ id: string }>()

    const rankResult = await context.env.DB.prepare(
      'SELECT COUNT(*) as rank FROM scores WHERE score > ?'
    ).bind(body.score).first<{ rank: number }>()

    return Response.json({
      id: result?.id,
      globalRank: (rankResult?.rank ?? 0) + 1,
    })
  } catch (e) {
    return Response.json({ error: 'Failed to submit score' }, { status: 500 })
  }
}
