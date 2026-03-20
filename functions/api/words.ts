import type { Env } from '../types.ts'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const data = await context.env.KV.get('courses', 'json')
    if (data) {
      return Response.json({ courses: data }, {
        headers: { 'Cache-Control': 'public, max-age=300' },
      })
    }
    return Response.json({ courses: null }, { status: 404 })
  } catch {
    return Response.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}
