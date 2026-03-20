import { useRef, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../ui/Card.tsx'
import { TimerBar } from '../ui/TimerBar.tsx'
import { WordDisplay } from '../ui/WordDisplay.tsx'
import { ComboDisplay } from '../ui/ComboDisplay.tsx'
import { FloatScoreContainer, useFloatScore } from '../ui/FloatScore.tsx'
import { useGameStore, useCurrentWord, useComboLevel, useMultiplier } from '../../stores/gameStore.ts'
import { useTimer } from '../../hooks/useTimer.ts'
import {
  createTypingState, processKey, getDisplayRomaji, getTypedLength,
  type TypingState,
} from '../../lib/romajiEngine.ts'
import type { AudioEngine } from '../../lib/audioEngine.ts'
import { useParticles } from '../canvas/ParticleCanvas.tsx'

interface PlayScreenProps {
  audio: AudioEngine
}

export function PlayScreen({ audio }: PlayScreenProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const wordIdx = useGameStore(s => s.wordIdx)
  const score = useGameStore(s => s.score)
  const combo = useGameStore(s => s.combo)
  const pending = useGameStore(s => s.pending)
  const timerMax = useGameStore(s => s.timerMax)
  const activeWords = useGameStore(s => s.activeWords)
  const completeWord = useGameStore(s => s.completeWord)
  const handleTimeoutAction = useGameStore(s => s.handleTimeout)
  const advance = useGameStore(s => s.advance)
  const setScreen = useGameStore(s => s.setScreen)
  const startWordTimer = useGameStore(s => s.startWordTimer)

  const word = useCurrentWord()
  const comboLevel = useComboLevel()
  const multiplier = useMultiplier()
  const particles = useParticles()
  const { items: floatItems, spawn: spawnFloat } = useFloatScore()

  const [timerPct, setTimerPct] = useState(1)
  const [inputState, setInputState] = useState<'neutral' | 'correct' | 'wrong'>('neutral')
  const [flavorText, setFlavorText] = useState('')
  const [typingState, setTypingState] = useState<TypingState | null>(null)

  // Derived display values
  const displayRomaji = typingState ? getDisplayRomaji(typingState) : (word?.romaji ?? '')
  const typedLength = typingState ? getTypedLength(typingState) : 0

  // ── Advance to next word or end ──
  const advanceWord = useCallback(() => {
    const gameOver = advance()
    if (gameOver) {
      setScreen('result')
    } else {
      startWordTimer()
      setInputState('neutral')
      setFlavorText('')
    }
  }, [advance, startWordTimer, setScreen])

  // ── Timeout handler ──
  const onTimeout = useCallback(() => {
    handleTimeoutAction()
    audio.timeout()
    setInputState('wrong')
    if (word) {
      setFlavorText(`時間切れ… 正解：${word.romaji}`)
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
    setTimeout(advanceWord, 1500)
  }, [handleTimeoutAction, audio, word, particles, advanceWord])

  const { start: startTimerTick, stop: stopTimerTick } = useTimer({
    onTick: setTimerPct,
    onTimeout,
  })

  // ── Initialize / reset on word change ──
  useEffect(() => {
    startWordTimer()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (timerMax > 0 && !pending) {
      startTimerTick(timerMax)
      setTimerPct(1)
      setInputState('neutral')
      setFlavorText('')
    }
    return () => stopTimerTick()
  }, [wordIdx, timerMax]) // eslint-disable-line react-hooks/exhaustive-deps

  // Create typing state when word changes
  useEffect(() => {
    if (word) {
      setTypingState(createTypingState(word.kana))
    }
  }, [word])

  // ── Handle word completion ──
  const handleWordComplete = useCallback(() => {
    const result = completeWord()
    stopTimerTick()
    audio.correct()
    if (result.combo >= 3) audio.combo(result.combo)

    setInputState('correct')
    setFlavorText(`+${result.pts}pts　${result.flavor}`)
    spawnFloat(`+${result.pts}`)

    if (cardRef.current && particles) {
      const rect = cardRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 3
      particles.emitCorrect(cx, cy)
      if (result.combo >= 3) particles.emitCombo(cx, cy, result.combo)
    }

    setTimeout(advanceWord, 1200)
  }, [completeWord, stopTimerTick, audio, particles, spawnFloat, advanceWord])

  // ── Keydown handler — romaji engine ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (pending || !typingState) return

      // Only single printable chars (letters + apostrophe)
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
      const key = e.key.toLowerCase()
      if (!/[a-z']/.test(key)) return

      e.preventDefault()

      const { state: newState, result } = processKey(typingState, key)

      if (result === 'accept') {
        setTypingState(newState)
        audio.keyPress()
      } else if (result === 'complete') {
        setTypingState(newState)
        handleWordComplete()
      } else {
        // reject — error feedback
        audio.wrongKey()
        setInputState('wrong')
        setTimeout(() => {
          if (!pending) setInputState('neutral')
        }, 200)
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [typingState, pending, audio, handleWordComplete])

  if (!word) return null

  const progress = { current: wordIdx + 1, total: activeWords.length }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] text-white/40 tracking-[3px] uppercase">
          WORD
        </span>
        <span className="text-[10px] text-white/40 tracking-[3px]">
          {progress.current} / {progress.total}
        </span>
      </div>

      <TimerBar pct={timerPct} />

      <div ref={cardRef}>
        <Card className="mb-3">
          <WordDisplay word={word.word} romaji={displayRomaji} typedLength={typedLength} />
          <ComboDisplay combo={combo} level={comboLevel} multiplier={multiplier} />
        </Card>
      </div>

      {/* Visual input indicator — shows typed romaji */}
      <div
        className={`
          w-full backdrop-blur-sm bg-white/5 text-white
          border-[1.5px] rounded-xl py-3.5 px-4
          font-mono text-xl text-center
          transition-all duration-200 min-h-[56px]
          flex items-center justify-center
          ${inputState === 'correct'
            ? 'border-emerald-400 animate-pulse-correct'
            : inputState === 'wrong'
              ? 'border-red-400 animate-shake-miss'
              : 'border-white/20'
          }
        `}
      >
        <span className="text-white/80">
          {typingState
            ? [...typingState.completedRomaji, typingState.inputBuffer].join('')
            : ''}
        </span>
        <span className="animate-pulse text-white/30 ml-0.5">|</span>
      </div>

      <div className="flex justify-between items-center mt-3 min-h-8 gap-2 relative">
        <span className="text-xs text-white/60 italic flex-1 text-left">
          {flavorText}
        </span>
        <span className="text-[11px] text-white/40 whitespace-nowrap tracking-wide">SCORE</span>
        <span className="text-[22px] font-semibold min-w-[52px] text-right">{score}</span>
        <FloatScoreContainer items={floatItems} />
      </div>
    </motion.div>
  )
}
