import type { Env } from '../types.ts'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const rankings = await context.env.DB.prepare(
      `SELECT id, nickname, score, accuracy, max_combo as maxCombo, rank_title as rankTitle, created_at as createdAt
       FROM scores
       ORDER BY score DESC
       LIMIT ? OFFSET ?`,
    )
      .bind(limit, offset)
      .all()

    const countResult = await context.env.DB.prepare('SELECT COUNT(*) as total FROM scores').first<{ total: number }>()

    return Response.json({
      rankings: rankings.results,
      total: countResult?.total ?? 0,
    })
  } catch {
    return Response.json({ error: 'Failed to fetch rankings' }, { status: 500 })
  }
}
