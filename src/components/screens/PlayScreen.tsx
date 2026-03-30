import { useRef, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TimerBar } from '../ui/TimerBar.tsx'
import { ComboDisplay } from '../ui/ComboDisplay.tsx'
import { FloatScoreContainer, useFloatScore } from '../ui/FloatScore.tsx'
import { useGameStore, useCurrentWord, useComboLevel, useBonusPhase } from '../../stores/gameStore.ts'
import { shouldTriggerBonus } from '../../lib/gameLogic.ts'
import { BonusOverlay } from '../ui/BonusOverlay.tsx'
import { useTimer } from '../../hooks/useTimer.ts'
import {
  createTypingState, processKey, getDisplayRomaji, getTypedLength,
  type TypingState,
} from '../../lib/romajiEngine.ts'
import { formatMonths, msToMonths, MS_PER_MONTH, MISS_PENALTY_MS } from '../../lib/gameLogic.ts'
import type { AudioEngine } from '../../lib/audioEngine.ts'
import { useParticles } from '../canvas/ParticleCanvas.tsx'

interface PlayScreenProps {
  audio: AudioEngine
}

export function PlayScreen({ audio }: PlayScreenProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wordTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const savedRemainingRef = useRef(0)

  const wordIdx = useGameStore(s => s.wordIdx)
  const score = useGameStore(s => s.score)
  const combo = useGameStore(s => s.combo)
  const pending = useGameStore(s => s.pending)
  const wordTimerMax = useGameStore(s => s.wordTimerMax)
  const timeLimit = useGameStore(s => s.timeLimit)
  const completeWord = useGameStore(s => s.completeWord)
  const incrementCombo = useGameStore(s => s.incrementCombo)
  const resetCombo = useGameStore(s => s.resetCombo)
  const handleWordTimeout = useGameStore(s => s.handleWordTimeout)
  const advance = useGameStore(s => s.advance)
  const setScreen = useGameStore(s => s.setScreen)
  const startNextWord = useGameStore(s => s.startNextWord)

  const enterBonus = useGameStore(s => s.enterBonus)
  const bonusPhase = useBonusPhase()

  const word = useCurrentWord()
  const comboLevel = useComboLevel()
  const particles = useParticles()
  const { items: floatItems, spawn: spawnFloat } = useFloatScore()

  const [globalPct, setGlobalPct] = useState(1)
  const [remainingMs, setRemainingMs] = useState(timeLimit)
  const [inputState, setInputState] = useState<'neutral' | 'correct' | 'wrong'>('neutral')
  const [flavorText, setFlavorText] = useState('')
  const [typingState, setTypingState] = useState<TypingState | null>(null)
  const [cardGlow, setCardGlow] = useState(false)
  const [scorePop, setScorePop] = useState(false)

  const displayRomaji = typingState ? getDisplayRomaji(typingState) : ''
  const typedLength = typingState ? getTypedLength(typingState) : 0

  // ── グローバルタイマー（契約期間） ──
  const onGlobalTimeout = useCallback(() => {
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current)
    setScreen('result')
  }, [setScreen])

  const onGlobalTick = useCallback((pct: number, remaining: number) => {
    setGlobalPct(pct)
    setRemainingMs(remaining)
  }, [])

  const { start: startGlobal, stop: stopGlobal, addTime, subtractTime, getRemaining } = useTimer({
    onTick: onGlobalTick,
    onTimeout: onGlobalTimeout,
  })

  // ── 次の単語へ ──
  const advanceToNext = useCallback(() => {
    advance()
    startNextWord()
    setInputState('neutral')
    setFlavorText('')
  }, [advance, startNextWord])

  // ── 単語タイムアウト（-1ヶ月） ──
  const onWordTimeout = useCallback(() => {
    if (pending) return
    handleWordTimeout()
    subtractTime(MS_PER_MONTH)
    audio.timeout()
    setInputState('wrong')
    if (word) {
      setFlavorText(`契約短縮 -1ヶ月… 正解：${getDisplayRomaji(createTypingState(word.kana))}`)
    }
    if (containerRef.current) {
      containerRef.current.style.animation = 'shakeMiss 0.4s ease-out'
      containerRef.current.addEventListener('animationend', () => {
        if (containerRef.current) containerRef.current.style.animation = ''
      }, { once: true })
    }
    if (cardRef.current && particles) {
      const rect = cardRef.current.getBoundingClientRect()
      particles.emitWrong(rect.left + rect.width / 2, rect.top + rect.height / 3)
    }
    // 残り時間がまだあれば次の単語へ
    if (getRemaining() > 0) {
      setTimeout(advanceToNext, 1000)
    }
  }, [handleWordTimeout, subtractTime, audio, word, particles, advanceToNext, pending, getRemaining])

  // ── 初期化: グローバルタイマー開始 ──
  useEffect(() => {
    startNextWord()
    startGlobal(timeLimit)
    return () => stopGlobal()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 単語タイマー（setTimeout）──
  useEffect(() => {
    if (wordTimerMax > 0 && !pending) {
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current)
      wordTimerRef.current = setTimeout(onWordTimeout, wordTimerMax)
    }
    return () => {
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current)
    }
  }, [wordIdx, wordTimerMax, pending]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 単語変更時にタイピング状態リセット ──
  useEffect(() => {
    if (word) {
      setTypingState(createTypingState(word.kana))
    }
  }, [word])

  // ── 単語完了 ──
  const handleWordComplete = useCallback(() => {
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current)
    const result = completeWord()
    audio.correct()
    if (result.combo >= 15) audio.combo(result.combo)

    setInputState('correct')
    setFlavorText(result.flavor)
    setCardGlow(true)
    setScorePop(true)
    setTimeout(() => setCardGlow(false), 600)
    setTimeout(() => setScorePop(false), 300)

    if (cardRef.current && particles) {
      const rect = cardRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 3
      particles.emitCorrect(cx, cy)
      if (result.combo >= 15) particles.emitCombo(cx, cy, result.combo)
    }

    setTimeout(advanceToNext, 1200)
  }, [completeWord, audio, addTime, particles, spawnFloat, advanceToNext])

  // ── デバッグ: Backquote(`) 5連打でボーナス発動 ──
  const cheatRef = useRef({ count: 0, timer: 0 })
  const handleCheatKey = useCallback((e: KeyboardEvent) => {
    if (e.key !== '`') return false
    const c = cheatRef.current
    c.count++
    clearTimeout(c.timer)
    c.timer = window.setTimeout(() => { c.count = 0 }, 1000)
    if (c.count >= 5 && bonusPhase === 'inactive') {
      c.count = 0
      savedRemainingRef.current = getRemaining()
      stopGlobal()
      enterBonus()
      return true
    }
    return false
  }, [bonusPhase, stopGlobal, enterBonus])

  // ── キー処理（共通） ──
  const processCharKey = useCallback((key: string) => {
    if (bonusPhase !== 'inactive') return
    if (pending || !typingState) return
    if (!/[a-z'\-]/.test(key)) return

    const { state: newState, result } = processKey(typingState, key)

    if (result === 'accept') {
      setTypingState(newState)
      const bonus = incrementCombo()
      if (bonus.bonusMs > 0) {
        addTime(bonus.bonusMs)
        spawnFloat(`契約延長 +${(bonus.bonusMs / 1000).toFixed(0)}秒`)
      }
      audio.keyPress()

      // Check bonus trigger (read fresh combo from store)
      const freshCombo = useGameStore.getState().combo
      if (shouldTriggerBonus(freshCombo)) {
        resetCombo()
        savedRemainingRef.current = getRemaining()
        stopGlobal()
        enterBonus()
        return
      }
    } else if (result === 'complete') {
      setTypingState(newState)
      const bonus = incrementCombo()
      if (bonus.bonusMs > 0) {
        addTime(bonus.bonusMs)
        spawnFloat(`契約延長 +${(bonus.bonusMs / 1000).toFixed(0)}秒`)
      }
      handleWordComplete()
    } else {
      resetCombo()
      subtractTime(MISS_PENALTY_MS)
      audio.wrongKey()
      setInputState('wrong')
      setTimeout(() => {
        if (!pending) setInputState('neutral')
      }, 200)
    }
  }, [typingState, pending, audio, handleWordComplete, bonusPhase, incrementCombo, addTime, spawnFloat, resetCombo, subtractTime, stopGlobal, enterBonus, getRemaining])

  // ── キーボード入力（PC） ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopGlobal()
        setScreen('title')
        return
      }

      // Debug cheat key
      if (handleCheatKey(e)) return

      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
      const key = e.key.toLowerCase()
      e.preventDefault()
      processCharKey(key)
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [processCharKey, handleCheatKey, stopGlobal, setScreen])


  // ── Resume normal game after bonus ──
  const handleBonusEnd = useCallback(() => {
    resetCombo()
    const remaining = savedRemainingRef.current
    if (remaining > 0) {
      startGlobal(remaining)
    }
    startNextWord()
  }, [startNextWord, startGlobal, resetCombo])

  if (!word) return null

  const remainingMonths = msToMonths(remainingMs)

  return (
    <>
    {bonusPhase !== 'inactive' && (
      <BonusOverlay audio={audio} onEnd={handleBonusEnd} />
    )}
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] text-white/40 tracking-[3px] uppercase">
          残り契約期間
        </span>
        <span className="text-[14px] font-bold text-white/80">
          {formatMonths(remainingMonths)}
        </span>
      </div>

      <TimerBar pct={globalPct} />

      {/* ── ターミナルウィンドウ ── */}
      <div
        ref={cardRef}
        className={`
          rounded-lg overflow-hidden border transition-all duration-200
          ${cardGlow ? 'animate-card-flash' : ''}
          ${inputState === 'correct'
            ? 'border-emerald-500/40'
            : inputState === 'wrong'
              ? 'border-red-500/40'
              : 'border-white/[0.12]'
          }
        `}
      >
        {/* タイトルバー */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0d0d1a]/95 border-b border-white/[0.04]">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[10px] text-white/20 font-mono flex-1 text-center">
            ses@客先常駐ビル:~/案件
          </span>
        </div>

        {/* ターミナル本体 */}
        <div className="bg-[#0a0a14]/95 backdrop-blur-xl px-5 py-5 font-mono">
          {/* 単語出題 */}
          <div className="mb-3">
            <span className="text-emerald-500/70 text-xs terminal-glow-dim">$ echo </span>
            <span className="text-3xl font-semibold tracking-[4px] text-white terminal-glow">
              {word.word}
            </span>
          </div>

          {/* ローマ字ガイド */}
          <div className="mb-2">
            <span className="text-emerald-500/40 text-xs terminal-glow-dim">$ type </span>
            <span className="text-lg tracking-wider break-all leading-relaxed">
              {displayRomaji.split('').map((char, i) => (
                <span
                  key={`${word.word}-${i}`}
                  className={`transition-all duration-100 ${
                    i < typedLength
                      ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]'
                      : 'text-white/25'
                  }`}
                >
                  {char}
                </span>
              ))}
            </span>
          </div>

          {/* フレーバーテキスト（コメント風） */}
          <div className="min-h-5 mb-3">
            {flavorText && (
              <span className="text-[16px] text-white/50 italic">
                <span className="text-white/60"># </span>{flavorText}
              </span>
            )}
          </div>

          {/* 入力行 */}
          <div
            className={`
              flex items-center py-2 px-3 -mx-1 rounded
              transition-all duration-200
              ${inputState === 'correct'
                ? 'bg-emerald-500/10'
                : inputState === 'wrong'
                  ? 'bg-red-500/10'
                  : 'bg-white/[0.02]'
              }
            `}
          >
            <span className="text-emerald-500/60 mr-1 text-xs shrink-0 terminal-glow-dim">$</span>
            <span className="text-emerald-400/90 text-lg break-all leading-relaxed terminal-glow">
              {typingState
                ? [...typingState.completedRomaji, typingState.inputBuffer].join('')
                : ''}
            </span>
            <span className="terminal-cursor text-emerald-400/80 ml-0.5">▊</span>
          </div>

          {/* コンボ表示 */}
          <ComboDisplay combo={combo} level={comboLevel} />
        </div>
      </div>

      {/* スコア */}
      <div className="flex justify-end items-center mt-3 min-h-8 gap-2 relative">
        <span className="text-[11px] text-white/40 whitespace-nowrap tracking-wide">常駐</span>
        <span className={`text-[22px] font-bold min-w-[80px] text-right ${scorePop ? 'animate-score-pop text-gradient-score' : ''}`}>
          {formatMonths(score)}
        </span>
        <FloatScoreContainer items={floatItems} />
      </div>
    </motion.div>
    </>
  )
}
