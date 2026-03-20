export interface Word {
  word: string
  kana: string
  flavor: string
}

export interface Course {
  id: CourseId
  name: string
  description: string
  words: Word[]
  timerMultiplier: number
  wordsPerGame: number
}

export type CourseId = 'beginner' | 'intermediate' | 'advanced'

export interface LogEntry {
  word: string
  ok: boolean
  pts: number
  combo: number
  time: number
}

export interface RankInfo {
  min: number
  rank: string
  comment: string
}

export interface GameResult {
  score: number
  accuracy: number
  maxCombo: number
  correct: number
  total: number
  log: LogEntry[]
  rank: RankInfo
  avgWpm: number
  totalTime: number
  courseId: CourseId
}

export interface CorrectResult {
  pts: number
  combo: number
  multiplier: number
  elapsed: number
  flavor: string
}

export type Screen = 'title' | 'play' | 'result'

export type ComboLevel = '0' | '1' | '2' | '3' | 'max'

export interface HighScoreEntry {
  score: number
  accuracy: number
  combo: number
  date: string
  nickname?: string
  courseId?: CourseId
}

export interface PlayerIdentity {
  id: string
  nickname: string
}
