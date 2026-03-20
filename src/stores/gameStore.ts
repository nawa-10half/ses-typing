import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Screen, Word, LogEntry, CorrectResult,
  HighScoreEntry, PlayerIdentity, CourseId,
} from '../types/game.ts'
import { COURSES } from '../lib/constants.ts'
import {
  calcTimerMax, calcScore, getMultiplier, getComboLevel,
  computeResults,
} from '../lib/gameLogic.ts'

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
  timerMultiplier: number

  wordIdx: number
  score: number
  combo: number
  maxCombo: number
  correct: number
  log: LogEntry[]
  gameStartTime: number
  wordStartTime: number
  timerMax: number
  pending: boolean

  // Actions
  startGame: (courseId: CourseId) => void
  startWordTimer: () => void
  completeWord: () => CorrectResult
  handleTimeout: () => void
  advance: () => boolean
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
      timerMultiplier: 1.0,

      wordIdx: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      correct: 0,
      log: [],
      gameStartTime: 0,
      wordStartTime: 0,
      timerMax: 0,
      pending: false,

      startGame: (courseId) => {
        const course = COURSES.find(c => c.id === courseId)!
        set(state => ({
          activeCourseId: courseId,
          activeWords: course.words,
          timerMultiplier: course.timerMultiplier,
          wordIdx: 0,
          score: 0,
          combo: 0,
          maxCombo: 0,
          correct: 0,
          log: [],
          gameStartTime: performance.now(),
          wordStartTime: 0,
          timerMax: 0,
          pending: false,
          screen: 'play' as Screen,
          playCount: state.playCount + 1,
        }))
      },

      startWordTimer: () => {
        const { wordIdx, activeWords, timerMultiplier } = get()
        const word = activeWords[wordIdx]
        const timerMax = calcTimerMax(word.romaji.length, timerMultiplier)
        set({
          timerMax,
          wordStartTime: performance.now(),
          pending: false,
        })
      },

      completeWord: () => {
        const state = get()
        const word = state.activeWords[state.wordIdx]
        const elapsed = performance.now() - state.wordStartTime
        const newCombo = state.combo + 1
        const { pts, multiplier } = calcScore(state.timerMax, elapsed, newCombo)
        const newMaxCombo = Math.max(state.maxCombo, newCombo)

        const entry: LogEntry = {
          word: word.word,
          ok: true,
          pts,
          combo: newCombo,
          time: Math.round(elapsed),
        }

        set({
          pending: true,
          combo: newCombo,
          maxCombo: newMaxCombo,
          score: state.score + pts,
          correct: state.correct + 1,
          log: [...state.log, entry],
        })

        return { pts, combo: newCombo, multiplier, elapsed, flavor: word.flavor }
      },

      handleTimeout: () => {
        const state = get()
        if (state.pending) return
        const word = state.activeWords[state.wordIdx]
        const entry: LogEntry = {
          word: word.word,
          ok: false,
          pts: 0,
          combo: 0,
          time: state.timerMax,
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
        if (nextIdx >= state.activeWords.length) return true
        set({ wordIdx: nextIdx })
        return false
      },

      getResults: () => {
        const state = get()
        return computeResults(
          state.log,
          state.gameStartTime,
          state.activeWords.length,
          state.activeCourseId!,
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
export const useMultiplier = () => useGameStore(s => getMultiplier(s.combo))
export const useCurrentWord = () => useGameStore(s => {
  if (s.wordIdx >= s.activeWords.length) return null
  return s.activeWords[s.wordIdx]
})
