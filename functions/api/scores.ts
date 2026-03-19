import type { Env } from '../types.ts'

interface ScoreBody {
  playerId: string
  nickname: string
  score: number
  accuracy: number
  maxCombo: number
  totalTime: number
  rankTitle: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json<ScoreBody>()
    const { playerId, nickname, score, accuracy, maxCombo, totalTime, rankTitle } = body

    if (!playerId || score == null) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await context.env.DB.prepare(
      `INSERT INTO scores (player_id, nickname, score, accuracy, max_combo, total_time, rank_title)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
    )
      .bind(playerId, nickname || '匿名', score, accuracy, maxCombo, Math.round(totalTime), rankTitle)
      .first<{ id: string }>()

    // Get global rank
    const rankResult = await context.env.DB.prepare(
      'SELECT COUNT(*) as rank FROM scores WHERE score > ?',
    )
      .bind(score)
      .first<{ rank: number }>()

    return Response.json({
      id: result?.id,
      globalRank: (rankResult?.rank ?? 0) + 1,
    })
  } catch {
    return Response.json({ error: 'Failed to save score' }, { status: 500 })
  }
}
