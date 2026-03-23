import { COURSES } from '../lib/constants.ts'

export function useCourses() {
  return { courses: COURSES, loading: false }
}
