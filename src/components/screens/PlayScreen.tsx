import { useRef, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../ui/Card.tsx'
import { TimerBar } from '../ui/TimerBar.tsx'
import { WordDisplay } from '../ui/WordDisplay.tsx'
import { ComboDisplay } from '../ui/ComboDisplay.tsx'
import { TypeInput } from '../ui/TypeInput.tsx'
import { FloatScoreContainer, useFloatScore } from '../ui/FloatScore.tsx'
import { useGameStore, useCurrentWord, useComboLevel, useMultiplier } from '../../stores/gameStore.ts'
import { useTimer } from '../../hooks/useTimer.ts'
import type { AudioEngine } from '../../lib/audioEngine.ts'
import { useParticles } from '../canvas/ParticleCanvas.tsx'

interface PlayScreenProps {
  audio: AudioEngine
}

export function PlayScreen({ audio }: PlayScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const wordIdx = useGameStore(s => s.wordIdx)
  const score = useGameStore(s => s.score)
  const combo = useGameStore(s => s.combo)
  const pending = useGameStore(s => s.pending)
  const timerMax = useGameStore(s => s.timerMax)
  const activeWords = useGameStore(s => s.activeWords)
  const checkAnswer = useGameStore(s => s.checkAnswer)
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
  const [typedLength, setTypedLength] = useState(0)

  const advanceWord = useCallback(() => {
    const gameOver = advance()
    if (gameOver) {
      setScreen('result')
    } else {
      startWordTimer()
      setInputState('neutral')
      setFlavorText('')
      setTypedLength(0)
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.value = ''
          inputRef.current.focus()
        }
      }, 50)
    }
  }, [advance, startWordTimer, setScreen])

  const onTimeout = useCallback(() => {
    handleTimeoutAction()
    audio.timeout()
    setInputState('wrong')
    if (word) {
      setFlavorText(`時間切れ… 正解：${word.romaji}`)
    }
    // Shake
    if (containerRef.current) {
      containerRef.current.style.animation = 'shakeMiss 0.4s ease-out'
      containerRef.current.addEventListener('animationend', () => {
        if (containerRef.current) containerRef.current.style.animation = ''
      }, { once: true })
    }
    // Particles
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

  // Start timer on mount and when word changes
  useEffect(() => {
    startWordTimer()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (timerMax > 0 && !pending) {
      startTimerTick(timerMax)
      setTimerPct(1)
      setInputState('neutral')
      setFlavorText('')
      setTypedLength(0)
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.value = ''
          inputRef.current.focus()
        }
      }, 50)
    }
    return () => stopTimerTick()
  }, [wordIdx, timerMax]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    if (pending) return
    const typed = (e.target as HTMLInputElement).value.toLowerCase()

    // Update typed length for visual progress
    if (word && word.romaji.startsWith(typed)) {
      setTypedLength(typed.length)
    }

    const result = checkAnswer(typed)
    if (!result) return

    stopTimerTick()
    audio.correct()
    if (result.combo >= 3) audio.combo(result.combo)

    if (inputRef.current) inputRef.current.value = ''
    setInputState('correct')
    setFlavorText(`+${result.pts}pts　${result.flavor}`)
    setTypedLength(word?.romaji.length ?? 0)
    spawnFloat(`+${result.pts}`)

    // Particles
    if (cardRef.current && particles) {
      const rect = cardRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 3
      particles.emitCorrect(cx, cy)
      if (result.combo >= 3) particles.emitCombo(cx, cy, result.combo)
    }

    setTimeout(advanceWord, 1200)
  }, [pending, word, checkAnswer, stopTimerTick, audio, particles, spawnFloat, advanceWord])

  // Keypress sound
  useEffect(() => {
    const handler = () => {
      if (!pending) audio.keyPress()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [audio, pending])

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
          <WordDisplay word={word.word} romaji={word.romaji} typedLength={typedLength} />
          <ComboDisplay combo={combo} level={comboLevel} multiplier={multiplier} />
        </Card>
      </div>

      <TypeInput
        ref={inputRef}
        state={inputState}
        placeholder="ローマ字で入力…"
        onInput={handleInput}
      />

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
