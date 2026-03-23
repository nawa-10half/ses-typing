import type { Env } from '../types.ts'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url)
    const courseId = url.searchParams.get('courseId')
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 100)
    const offset = Number(url.searchParams.get('offset') ?? 0)

    let query: string
    let bindings: unknown[]

    if (courseId) {
      query = 'SELECT * FROM scores WHERE course_id = ? ORDER BY score DESC LIMIT ? OFFSET ?'
      bindings = [courseId, limit, offset]
    } else {
      query = 'SELECT * FROM scores ORDER BY score DESC LIMIT ? OFFSET ?'
      bindings = [limit, offset]
    }

    const { results } = await context.env.DB.prepare(query).bind(...bindings).all()

    const countQuery = courseId
      ? 'SELECT COUNT(*) as total FROM scores WHERE course_id = ?'
      : 'SELECT COUNT(*) as total FROM scores'
    const countBindings = courseId ? [courseId] : []
    const countResult = await context.env.DB.prepare(countQuery).bind(...countBindings).first<{ total: number }>()

    return Response.json({
      rankings: results.map((r: Record<string, unknown>) => ({
        id: r.id,
        nickname: r.nickname,
        score: r.score,
        accuracy: r.accuracy,
        maxCombo: r.max_combo,
        kps: r.kps,
        rankTitle: r.rank_title,
        courseId: r.course_id,
        createdAt: r.created_at,
      })),
      total: countResult?.total ?? 0,
    })
  } catch {
    return Response.json({ error: 'Failed to fetch rankings' }, { status: 500 })
  }
}
