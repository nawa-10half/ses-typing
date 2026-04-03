import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Screen, Word, Course, LogEntry, CorrectResult,
  HighScoreEntry, PlayerIdentity, CourseId,
  BonusMode, GachaRarity, IncidentData,
} from '../types/game.ts'
import {
  calcWordTimer, getComboLevel, getComboMilestoneBonus,
  computeResults, MS_PER_MONTH,
  selectBonusMode, rollGachaRarity, calcIncidentMultiplier,
} from '../lib/gameLogic.ts'
import { getDefaultRomaji } from '../lib/romajiEngine.ts'
import {
  BONUS_WORDS, BONUS_MULTIPLIER,
  INCIDENTS, GACHA_MULTIPLIERS, GACHA_PROJECTS,
} from '../lib/constants.ts'

export type BonusPhase =
  | 'inactive'
  // Normal bonus
  | 'bsod' | 'blackout' | 'intro' | 'active' | 'outro'
  // Incident bonus
  | 'incident-alert' | 'incident-blackout' | 'incident-intro' | 'incident-active' | 'incident-outro'
  | 'incident-crash'
  // Gacha bonus
  | 'gacha-blackout' | 'gacha-spin' | 'gacha-reveal' | 'gacha-active' | 'gacha-outro'
  | 'gacha-super'
  // Super bonus
  | 'super-rm-exec' | 'super-blackout' | 'super-reels'
  | 'super-type-system' | 'super-type-engineering' | 'super-type-service'
  | 'super-celebration'

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

  // Bonus mode
  bonusPhase: BonusPhase
  bonusMode: BonusMode
  bonusWords: Word[]
  bonusWordIdx: number
  bonusMultiplier: number
  incidentData: IncidentData | null
  gachaRarity: GachaRarity | null
  gachaProjectName: string

  // Actions
  startGame: (course: Course) => void
  startNextWord: () => void
  incrementCombo: () => { bonusMs: number; bonusMonths: number }
  resetCombo: () => void
  completeWord: () => CorrectResult
  handleWordTimeout: () => void
  advance: () => void
  getResults: () => ReturnType<typeof computeResults>

  // Bonus actions
  enterBonus: () => void
  setBonusPhase: (phase: BonusPhase) => void
  completeBonusWord: () => CorrectResult
  handleBonusTimeout: () => void
  advanceBonus: () => void

  // Super bonus actions
  enterSuperBonus: () => void
  applySuperBonusScore: () => number
  endSuperBonus: () => void

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

      bonusPhase: 'inactive' as BonusPhase,
      bonusMode: 'normal' as BonusMode,
      bonusWords: [],
      bonusWordIdx: 0,
      bonusMultiplier: BONUS_MULTIPLIER,
      incidentData: null,
      gachaRarity: null,
      gachaProjectName: '',

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
          bonusPhase: 'inactive' as BonusPhase,
          bonusMode: 'normal' as BonusMode,
          bonusWords: [],
          bonusWordIdx: 0,
          bonusMultiplier: BONUS_MULTIPLIER,
          incidentData: null,
          gachaRarity: null,
          gachaProjectName: '',
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

        const wordMonths = state.monthsPerWord
        const entry: LogEntry = {
          word: word.word,
          ok: true,
          pts: wordMonths,
          combo: state.combo,
          time: Math.round(elapsed),
        }

        set({
          pending: true,
          correct: state.correct + 1,
          totalMonths: state.totalMonths + wordMonths,
          score: state.score + wordMonths,
          log: [...state.log, entry],
        })

        return { pts: wordMonths, combo: state.combo, timeBonus: 0, months: wordMonths, elapsed, flavor: word.flavor }
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

      enterBonus: () => {
        const mode = selectBonusMode()

        if (mode === 'normal') {
          const shuffled = [...BONUS_WORDS].sort(() => Math.random() - 0.5)
          set({
            bonusPhase: 'bsod' as BonusPhase,
            bonusMode: 'normal',
            bonusWords: shuffled,
            bonusWordIdx: 0,
            bonusMultiplier: BONUS_MULTIPLIER,
            incidentData: null,
            gachaRarity: null,
            gachaProjectName: '',
            pending: true,
          })
        } else if (mode === 'incident') {
          const incident = INCIDENTS[Math.floor(Math.random() * INCIDENTS.length)]
          set({
            bonusPhase: 'incident-alert' as BonusPhase,
            bonusMode: 'incident',
            bonusWords: incident.commands,
            bonusWordIdx: 0,
            bonusMultiplier: 0, // 速度ベースで動的計算
            incidentData: incident,
            gachaRarity: null,
            gachaProjectName: '',
            pending: true,
          })
        } else {
          const rarity = rollGachaRarity()
          const projects = GACHA_PROJECTS[rarity]
          const project = projects[Math.floor(Math.random() * projects.length)]
          set({
            bonusPhase: 'gacha-blackout' as BonusPhase,
            bonusMode: 'gacha',
            bonusWords: project.words,
            bonusWordIdx: 0,
            bonusMultiplier: GACHA_MULTIPLIERS[rarity],
            incidentData: null,
            gachaRarity: rarity,
            gachaProjectName: project.name,
            pending: true,
          })
        }
      },

      setBonusPhase: (phase) => {
        // active系フェーズ開始時にwordStartTimeをセット
        if (phase === 'active' || phase === 'incident-active' || phase === 'gacha-active') {
          set({ bonusPhase: phase, wordStartTime: performance.now() })
        } else {
          set({ bonusPhase: phase })
        }
      },

      completeBonusWord: () => {
        const state = get()
        const word = state.bonusWords[state.bonusWordIdx]
        const elapsed = performance.now() - state.wordStartTime

        let multiplier = state.bonusMultiplier
        if (state.bonusMode === 'incident') {
          multiplier = calcIncidentMultiplier(elapsed, word.word.length)
        }

        const bonusMonths = Math.round(state.monthsPerWord * multiplier)

        const entry: LogEntry = {
          word: word.word,
          ok: true,
          pts: bonusMonths,
          combo: state.combo,
          time: Math.round(elapsed),
        }

        set({
          pending: true,
          totalMonths: state.totalMonths + bonusMonths,
          score: state.score + bonusMonths,
          correct: state.correct + 1,
          log: [...state.log, entry],
        })

        return { pts: bonusMonths, combo: state.combo, timeBonus: 0, months: bonusMonths, elapsed, flavor: word.flavor }
      },

      handleBonusTimeout: () => {
        const state = get()
        if (state.pending) return
        const word = state.bonusWords[state.bonusWordIdx]
        const entry: LogEntry = {
          word: word.word,
          ok: false,
          pts: 0,
          combo: 0,
          time: state.wordTimerMax,
        }
        set({
          pending: true,
          log: [...state.log, entry],
        })
      },

      advanceBonus: () => {
        const state = get()
        const nextIdx = state.bonusWordIdx + 1
        const now = performance.now()
        if (nextIdx >= state.bonusWords.length) {
          // 全モード共通: 再シャッフルしてループ
          const reshuffled = [...state.bonusWords].sort(() => Math.random() - 0.5)
          set({ bonusWords: reshuffled, bonusWordIdx: 0, wordStartTime: now })
        } else {
          set({ bonusWordIdx: nextIdx, wordStartTime: now })
        }
      },

      enterSuperBonus: () => set({ bonusPhase: 'super-rm-exec' as BonusPhase }),

      applySuperBonusScore: () => {
        const state = get()
        const added = state.score
        set({
          score: state.score * 2,
          totalMonths: state.totalMonths + added,
          log: [...state.log, { word: 'SES揃い', ok: true, pts: added, combo: 0, time: 0 }],
        })
        return added
      },

      endSuperBonus: () => set({ bonusPhase: 'inactive' as BonusPhase }),

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
export const useBonusPhase = () => useGameStore(s => s.bonusPhase)
export const useCurrentBonusWord = () => useGameStore(s => {
  if (s.bonusWordIdx >= s.bonusWords.length) return null
  return s.bonusWords[s.bonusWordIdx]
})
