import type { LogEntry, RankInfo, GameResult, ComboLevel, CourseId } from '../types/game.ts'
import { RANKS } from './constants.ts'

export function getMultiplier(combo: number): number {
  if (combo < 3) return 1
  return 1 + Math.floor(combo / 3) * 0.5
}

export function getComboLevel(combo: number): ComboLevel {
  if (combo >= 12) return 'max'
  if (combo >= 9) return '3'
  if (combo >= 6) return '2'
  if (combo >= 3) return '1'
  return '0'
}

export function calcTimerMax(romajiLength: number, timerMultiplier: number): number {
  const base = Math.max(5000, romajiLength * 800)
  return Math.round(base * timerMultiplier)
}

export function calcScore(
  timerMax: number,
  elapsed: number,
  combo: number,
): { pts: number; multiplier: number } {
  const timeBonus = Math.round(Math.max(0, (timerMax - elapsed) / timerMax) * 50)
  const multiplier = getMultiplier(combo)
  const pts = Math.round((100 + timeBonus) * multiplier)
  return { pts, multiplier }
}

export function getRank(score: number, totalWords: number): RankInfo {
  const scale = totalWords / 10
  return RANKS.find(r => score >= r.min * scale) ?? RANKS[RANKS.length - 1]
}

export function computeResults(
  log: LogEntry[],
  gameStartTime: number,
  totalWords: number,
  courseId: CourseId,
): GameResult {
  const totalTime = performance.now() - gameStartTime
  const correct = log.filter(l => l.ok).length
  const acc = Math.round((correct / totalWords) * 100)
  const maxCombo = Math.max(...log.map(l => l.combo), 0)
  const avgWpm = correct > 0
    ? Math.round(log.filter(l => l.ok).reduce((a, l) => a + l.word.length, 0) / (totalTime / 60000))
    : 0
  const score = log.reduce((a, l) => a + l.pts, 0)
  const rank = getRank(score, totalWords)

  return { score, accuracy: acc, maxCombo, correct, total: totalWords, log, rank, avgWpm, totalTime, courseId }
}
