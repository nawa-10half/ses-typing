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
  timeLimit: number        // 初期制限時間 (ms)
  baseTimeBonus: number    // 正解時の基本加算時間 (ms)
  monthsPerWord: number    // 1単語クリアごとの加算月数
  wordTimerMultiplier: number // 単語別タイマーの倍率
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
  totalMonths: number
  accuracy: number
  maxCombo: number
  correct: number
  wordsAttempted: number
  log: LogEntry[]
  rank: RankInfo
  kps: number
  totalTime: number
  courseId: CourseId
  totalKeystrokes: number
  missKeystrokes: number
}

export interface CorrectResult {
  pts: number
  combo: number
  timeBonus: number   // 加算時間 (ms)
  months: number      // 加算月数
  elapsed: number
  flavor: string
}

export type BonusMode = 'normal' | 'incident' | 'gacha'
export type GachaRarity = 'UR' | 'SSR' | 'SR' | 'R' | 'N'

export interface IncidentData {
  name: string
  description: string
  commands: Word[]
}

export type Screen = 'title' | 'play' | 'result' | 'privacy' | 'howto'

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
