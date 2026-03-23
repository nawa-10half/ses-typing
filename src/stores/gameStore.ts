import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Screen, Word, Course, LogEntry, CorrectResult,
  HighScoreEntry, PlayerIdentity, CourseId,
} from '../types/game.ts'
import {
  calcWordTimer, calcScore, getComboLevel, getComboMilestoneBonus,
  computeResults, MS_PER_MONTH,
} from '../lib/gameLogic.ts'
import { getDefaultRomaji } from '../lib/romajiEngine.ts'

function generateId(): string {
  return crypto.randomUUID()
}

interface PersistedState {
  highScores: HighScoreEntry[]
  theme: 'dark' | 'light'
  soundEnabled: boolean
  playCount: number
  player: PlayerIdentity
}

interface GameState extends PersistedState {
  screen: Screen
  setScreen: (s: Screen) => void

  activeCourseId: CourseId | null
  activeWords: Word[]
  wordTimerMultiplier: number
  baseTimeBonus: number
  monthsPerWord: number
  timeLimit: number

  wordIdx: number
  score: number
  combo: number
  maxCombo: number
  correct: number
  totalKeystrokes: number
  missKeystrokes: number
  totalMonths: number
  log: LogEntry[]
  gameStartTime: number
  wordStartTime: number
  wordTimerMax: number
  pending: boolean

  // Actions
  startGame: (course: Course) => void
  startNextWord: () => void
  incrementCombo: () => { bonusMs: number; bonusMonths: number }
  resetCombo: () => void
  completeWord: () => CorrectResult
  handleWordTimeout: () => void
  advance: () => void
  getResults: () => ReturnType<typeof computeResults>

  saveScore: (entry: HighScoreEntry) => number
  toggleTheme: () => void
  toggleSound: () => boolean
  setNickname: (name: string) => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      highScores: [],
      theme: 'dark',
      soundEnabled: true,
      playCount: 0,
      player: { id: generateId(), nickname: '匿名' },

      screen: 'title' as Screen,
      setScreen: (s) => set({ screen: s }),

      activeCourseId: null,
      activeWords: [],
      wordTimerMultiplier: 1.0,
      baseTimeBonus: 3000,
      monthsPerWord: 1,
      timeLimit: 30000,

      wordIdx: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      correct: 0,
      totalKeystrokes: 0,
      missKeystrokes: 0,
      totalMonths: 0,
      log: [],
      gameStartTime: 0,
      wordStartTime: 0,
      wordTimerMax: 0,
      pending: false,

      startGame: (course) => {
        const shuffled = [...course.words].sort(() => Math.random() - 0.5)
        set(state => ({
          activeCourseId: course.id,
          activeWords: shuffled,
          wordTimerMultiplier: course.wordTimerMultiplier,
          baseTimeBonus: course.baseTimeBonus,
          monthsPerWord: course.monthsPerWord,
          timeLimit: course.timeLimit,
          wordIdx: 0,
          score: 0,
          combo: 0,
          maxCombo: 0,
          correct: 0,
          totalKeystrokes: 0,
          missKeystrokes: 0,
          totalMonths: 0,
          log: [],
          gameStartTime: performance.now(),
          wordStartTime: 0,
          wordTimerMax: 0,
          pending: false,
          screen: 'play' as Screen,
          playCount: state.playCount + 1,
        }))
      },

      startNextWord: () => {
        const { wordIdx, activeWords, wordTimerMultiplier } = get()
        const word = activeWords[wordIdx]
        const wordTimerMax = calcWordTimer(getDefaultRomaji(word.kana).length, wordTimerMultiplier)
        set({
          wordTimerMax,
          wordStartTime: performance.now(),
          pending: false,
        })
      },

      incrementCombo: () => {
        const state = get()
        const newCombo = state.combo + 1
        const bonusMs = getComboMilestoneBonus(newCombo, state.activeCourseId!)
        const bonusMonths = bonusMs > 0 ? Math.round(bonusMs / MS_PER_MONTH) : 0
        set({
          combo: newCombo,
          maxCombo: Math.max(state.maxCombo, newCombo),
          totalKeystrokes: state.totalKeystrokes + 1,
          totalMonths: state.totalMonths + bonusMonths,
          score: state.score + bonusMonths,
        })
        return { bonusMs, bonusMonths }
      },

      resetCombo: () => set(state => ({
        combo: 0,
        totalKeystrokes: state.totalKeystrokes + 1,
        missKeystrokes: state.missKeystrokes + 1,
      })),

      completeWord: () => {
        const state = get()
        const word = state.activeWords[state.wordIdx]
        const elapsed = performance.now() - state.wordStartTime
        const romajiLength = getDefaultRomaji(word.kana).length
        const pts = calcScore(romajiLength, elapsed)

        const entry: LogEntry = {
          word: word.word,
          ok: true,
          pts,
          combo: state.combo,
          time: Math.round(elapsed),
        }

        const wordMonths = state.monthsPerWord
        set({
          pending: true,
          correct: state.correct + 1,
          totalMonths: state.totalMonths + wordMonths,
          score: state.score + wordMonths,
          log: [...state.log, entry],
        })

        return { pts, combo: state.combo, timeBonus: 0, months: 0, elapsed, flavor: word.flavor }
      },

      handleWordTimeout: () => {
        const state = get()
        if (state.pending) return
        const word = state.activeWords[state.wordIdx]
        const entry: LogEntry = {
          word: word.word,
          ok: false,
          pts: 0,
          combo: 0,
          time: state.wordTimerMax,
        }
        set({
          pending: true,
          combo: 0,
          log: [...state.log, entry],
        })
      },

      advance: () => {
        const state = get()
        const nextIdx = state.wordIdx + 1
        if (nextIdx >= state.activeWords.length) {
          // プール使い切り: 再シャッフル
          const reshuffled = [...state.activeWords].sort(() => Math.random() - 0.5)
          set({ activeWords: reshuffled, wordIdx: 0 })
        } else {
          set({ wordIdx: nextIdx })
        }
      },

      getResults: () => {
        const state = get()
        return computeResults(
          state.log,
          state.gameStartTime,
          state.activeCourseId!,
          state.totalKeystrokes,
          state.missKeystrokes,
          state.totalMonths,
        )
      },

      saveScore: (entry) => {
        const state = get()
        const scores = [...state.highScores, entry]
        scores.sort((a, b) => b.score - a.score)
        const trimmed = scores.slice(0, 10)
        set({ highScores: trimmed })
        return trimmed.findIndex(s => s.score === entry.score && s.date === entry.date)
      },

      toggleTheme: () => set(state => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', newTheme)
        return { theme: newTheme as 'dark' | 'light' }
      }),

      toggleSound: () => {
        const state = get()
        const newVal = !state.soundEnabled
        set({ soundEnabled: newVal })
        return newVal
      },

      setNickname: (name) => set(state => ({
        player: { ...state.player, nickname: name },
      })),
    }),
    {
      name: 'ses-typing-storage',
      partialize: (state): PersistedState => ({
        highScores: state.highScores,
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        playCount: state.playCount,
        player: state.player,
      }),
    },
  ),
)

export const useScreen = () => useGameStore(s => s.screen)
export const useTheme = () => useGameStore(s => s.theme)
export const useComboLevel = () => useGameStore(s => getComboLevel(s.combo))
export const useCurrentWord = () => useGameStore(s => {
  if (s.wordIdx >= s.activeWords.length) return null
  return s.activeWords[s.wordIdx]
})
