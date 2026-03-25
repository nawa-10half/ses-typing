import type { LogEntry, RankInfo, GameResult, ComboLevel, CourseId } from '../types/game.ts'
import { RANKS, BONUS_TRIGGER_COMBO, BONUS_TRIGGER_CHANCE, BONUS_MULTIPLIER } from './constants.ts'

/** 2秒 = 1ヶ月 */
export const MS_PER_MONTH = 2000

/** タイプミス時のペナルティ (ms) */
export const MISS_PENALTY_MS = 100

export function getComboLevel(combo: number): ComboLevel {
  if (combo >= 80) return 'max'
  if (combo >= 50) return '3'
  if (combo >= 30) return '2'
  if (combo >= 15) return '1'
  return '0'
}

/** コンボマイルストーン達成時のボーナス (ms)。0 = マイルストーンではない */
export function getComboMilestoneBonus(combo: number, courseId: CourseId): number {
  const tables: Record<CourseId, { milestones: Record<number, number>; repeat: number }> = {
    beginner:     { milestones: { 15: 1000, 30: 2000, 50: 3000 }, repeat: 3000 },
    intermediate: { milestones: { 15: 1000, 30: 2000, 50: 4000 }, repeat: 4000 },
    advanced:     { milestones: { 15: 1000, 30: 3000, 50: 6000 }, repeat: 6000 },
  }
  const table = tables[courseId]
  if (table.milestones[combo]) return table.milestones[combo]
  if (combo >= 80 && (combo - 80) % 20 === 0) return table.repeat
  return 0
}

/** 単語別の制限時間を算出 */
export function calcWordTimer(romajiLength: number, multiplier: number): number {
  const base = Math.max(5000, romajiLength * 800)
  return Math.round(base * multiplier)
}

/** スコア算出（速度ベース） */
export function calcScore(romajiLength: number, elapsed: number): number {
  const speed = romajiLength / (elapsed / 1000)
  const speedBonus = Math.round(Math.min(speed * 10, 100))
  return 100 + speedBonus
}

/** 月数を「Xヶ月」or「X年Yヶ月」にフォーマット */
export function formatMonths(months: number): string {
  if (months < 12) return `${months}ヶ月`
  const years = Math.floor(months / 12)
  const remainder = months % 12
  if (remainder === 0) return `${years}年`
  return `${years}年${remainder}ヶ月`
}

/** msから月数へ変換 */
export function msToMonths(ms: number): number {
  return Math.floor(ms / MS_PER_MONTH)
}

export function shouldTriggerBonus(combo: number, alreadyTriggered: boolean): boolean {
  if (alreadyTriggered) return false
  if (combo < BONUS_TRIGGER_COMBO) return false
  return Math.random() < BONUS_TRIGGER_CHANCE
}

export function calcBonusScore(
  timerMax: number,
  elapsed: number,
): { pts: number; multiplier: number } {
  const timeBonus = Math.round(Math.max(0, (timerMax - elapsed) / timerMax) * 50)
  const pts = Math.round((100 + timeBonus) * BONUS_MULTIPLIER)
  return { pts, multiplier: BONUS_MULTIPLIER }
}

export function getRank(totalMonths: number): RankInfo {
  return RANKS.find(r => totalMonths >= r.min) ?? RANKS[RANKS.length - 1]
}

export function computeResults(
  log: LogEntry[],
  gameStartTime: number,
  courseId: CourseId,
  totalKeystrokes: number,
  missKeystrokes: number,
  totalMonths: number,
): GameResult {
  const totalTime = performance.now() - gameStartTime
  const typingTime = log.filter(l => l.ok).reduce((a, l) => a + l.time, 0)
  const correct = log.filter(l => l.ok).length
  const correctKeystrokes = totalKeystrokes - missKeystrokes
  const acc = totalKeystrokes > 0
    ? Math.round((correctKeystrokes / totalKeystrokes) * 100)
    : 0
  const maxCombo = Math.max(...log.map(l => l.combo), 0)
  const typingSeconds = typingTime / 1000
  const kps = typingSeconds > 0
    ? Math.round((correctKeystrokes / typingSeconds) * 10) / 10
    : 0
  const score = totalMonths
  const rank = getRank(totalMonths)

  return {
    score,
    totalMonths,
    accuracy: acc,
    maxCombo,
    correct,
    wordsAttempted: log.length,
    log,
    rank,
    kps,
    totalTime,
    courseId,
    totalKeystrokes,
    missKeystrokes,
  }
}
