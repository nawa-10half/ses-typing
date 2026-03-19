import type { Env } from '../types.ts'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const data = await context.env.KV.get('stages', 'json')
    if (data) {
      return Response.json({ stages: data })
    }
    return Response.json({ stages: null }, { status: 404 })
  } catch {
    return Response.json({ error: 'Failed to fetch words' }, { status: 500 })
  }
}
