import { useEffect, useState } from 'react'
import type { Course } from '../types/game.ts'
import { fetchCourses } from '../lib/api.ts'
import { COURSES as FALLBACK } from '../lib/constants.ts'

let cachedCourses: Course[] | null = null

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>(cachedCourses ?? FALLBACK)
  const [loading, setLoading] = useState(cachedCourses === null)

  useEffect(() => {
    if (cachedCourses) return
    let cancelled = false

    fetchCourses().then(data => {
      if (cancelled) return
      cachedCourses = data
      setCourses(data)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [])

  return { courses, loading }
}
