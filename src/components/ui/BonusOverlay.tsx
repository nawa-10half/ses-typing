import { useEffect, useState, useCallback, useRef } from 'react'
import { Card } from './Card.tsx'
import { WordDisplay } from './WordDisplay.tsx'
import { TimerBar } from './TimerBar.tsx'
import { FloatScoreContainer, useFloatScore } from './FloatScore.tsx'
import { useGameStore, useBonusPhase, useCurrentBonusWord } from '../../stores/gameStore.ts'
import { useTimer } from '../../hooks/useTimer.ts'
import {
  createTypingState, processKey, getDisplayRomaji, getTypedLength,
  type TypingState,
} from '../../lib/romajiEngine.ts'
import type { AudioEngine } from '../../lib/audioEngine.ts'
import { useParticles } from '../canvas/ParticleCanvas.tsx'
import { BONUS_MULTIPLIER, BONUS_WORD_COUNT } from '../../lib/constants.ts'

interface BonusOverlayProps {
  audio: AudioEngine
  onEnd: () => void
}

export function BonusOverlay({ audio, onEnd }: BonusOverlayProps) {
  const bonusPhase = useBonusPhase()
  const bonusWord = useCurrentBonusWord()
  const setBonusPhase = useGameStore(s => s.setBonusPhase)
  const startBonusWordTimer = useGameStore(s => s.startBonusWordTimer)
  const completeBonusWord = useGameStore(s => s.completeBonusWord)
  const handleBonusTimeout = useGameStore(s => s.handleBonusTimeout)
  const advanceBonus = useGameStore(s => s.advanceBonus)
  const incrementCombo = useGameStore(s => s.incrementCombo)
  const resetCombo = useGameStore(s => s.resetCombo)
  const score = useGameStore(s => s.score)
  const pending = useGameStore(s => s.pending)
  const timerMax = useGameStore(s => s.timerMax)
  const bonusWordIdx = useGameStore(s => s.bonusWordIdx)

  const particles = useParticles()
  const cardRef = useRef<HTMLDivElement>(null)
  const goldRainRef = useRef(0)
  const { items: floatItems, spawn: spawnFloat } = useFloatScore()

  const [timerPct, setTimerPct] = useState(1)
  const [inputState, setInputState] = useState<'neutral' | 'correct' | 'wrong'>('neutral')
  const [flavorText, setFlavorText] = useState('')
  const [typingState, setTypingState] = useState<TypingState | null>(null)
  const [cardGlow, setCardGlow] = useState(false)
  const [scorePop, setScorePop] = useState(false)

  const displayRomaji = typingState ? getDisplayRomaji(typingState) : ''
  const typedLength = typingState ? getTypedLength(typingState) : 0

  // ── Phase transitions ──
  useEffect(() => {
    if (bonusPhase === 'blackout') {
      audio.bonusBlackout()
      const t = setTimeout(() => setBonusPhase('intro'), 1500)
      return () => clearTimeout(t)
    }
    if (bonusPhase === 'intro') {
      audio.bonusIntro()
      if (particles) {
        particles.emitBonusIntro(window.innerWidth / 2, window.innerHeight / 2)
      }
      const t = setTimeout(() => {
        setBonusPhase('active')
        startBonusWordTimer()
      }, 2500)
      return () => clearTimeout(t)
    }
  }, [bonusPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Gold rain during active phase ──
  useEffect(() => {
    if (bonusPhase === 'active' && particles) {
      const tick = () => {
        particles.emitBonusGoldRain()
        goldRainRef.current = requestAnimationFrame(tick)
      }
      // Throttle to ~10fps
      const interval = setInterval(() => {
        goldRainRef.current = requestAnimationFrame(tick)
      }, 100)
      return () => {
        clearInterval(interval)
        cancelAnimationFrame(goldRainRef.current)
      }
    }
  }, [bonusPhase, particles])

  // ── Create typing state for current bonus word ──
  useEffect(() => {
    if (bonusWord && bonusPhase === 'active') {
      setTypingState(createTypingState(bonusWord.kana))
      setInputState('neutral')
      setFlavorText('')
    }
  }, [bonusWord, bonusPhase])

  // ── Advance bonus word ──
  const advanceBonusWord = useCallback(() => {
    const done = advanceBonus()
    if (done) {
      setBonusPhase('outro')
      audio.bonusOutro()
      if (particles) {
        particles.confetti(80)
      }
      setTimeout(() => {
        setBonusPhase('inactive')
        onEnd()
      }, 2000)
    } else {
      startBonusWordTimer()
      setInputState('neutral')
      setFlavorText('')
    }
  }, [advanceBonus, setBonusPhase, startBonusWordTimer, audio, particles, onEnd])

  // ── Timeout ──
  const onTimeout = useCallback(() => {
    handleBonusTimeout()
    audio.timeout()
    setInputState('wrong')
    if (bonusWord) {
      setFlavorText(`時間切れ… 正解：${getDisplayRomaji(createTypingState(bonusWord.kana))}`)
    }
    setTimeout(advanceBonusWord, 1500)
  }, [handleBonusTimeout, audio, bonusWord, advanceBonusWord])

  const { start: startTimerTick, stop: stopTimerTick } = useTimer({
    onTick: setTimerPct,
    onTimeout,
  })

  // ── Start timer when bonus word timer is set ──
  useEffect(() => {
    if (bonusPhase === 'active' && timerMax > 0 && !pending) {
      startTimerTick(timerMax)
      setTimerPct(1)
    }
    return () => stopTimerTick()
  }, [bonusWordIdx, timerMax, bonusPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Word complete ──
  const handleWordComplete = useCallback(() => {
    const result = completeBonusWord()
    stopTimerTick()
    audio.bonusCorrect()

    setInputState('correct')
    setFlavorText(`+${result.pts}pts　x${BONUS_MULTIPLIER.toFixed(1)} ${result.flavor}`)
    spawnFloat(`+${result.pts}`)
    setCardGlow(true)
    setScorePop(true)
    setTimeout(() => setCardGlow(false), 600)
    setTimeout(() => setScorePop(false), 300)

    if (cardRef.current && particles) {
      const rect = cardRef.current.getBoundingClientRect()
      particles.emitBonusCorrect(rect.left + rect.width / 2, rect.top + rect.height / 3)
    }

    setTimeout(advanceBonusWord, 1200)
  }, [completeBonusWord, stopTimerTick, audio, particles, spawnFloat, advanceBonusWord])

  // ── Keydown handler ──
  useEffect(() => {
    if (bonusPhase !== 'active') return

    const handler = (e: KeyboardEvent) => {
      if (pending || !typingState) return
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
      const key = e.key.toLowerCase()
      if (!/[a-z'\-]/.test(key)) return

      e.preventDefault()

      const { state: newState, result } = processKey(typingState, key)

      if (result === 'accept') {
        setTypingState(newState)
        incrementCombo()
        audio.keyPress()
      } else if (result === 'complete') {
        setTypingState(newState)
        incrementCombo()
        handleWordComplete()
      } else {
        resetCombo()
        audio.wrongKey()
        setInputState('wrong')
        setTimeout(() => {
          if (!pending) setInputState('neutral')
        }, 200)
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [bonusPhase, typingState, pending, audio, handleWordComplete, incrementCombo, resetCombo])

  // ── Render phases ──

  if (bonusPhase === 'blackout') {
    return (
      <div className="bonus-overlay bonus-blackout">
        <div className="bonus-blackout-inner" />
      </div>
    )
  }

  if (bonusPhase === 'intro') {
    return (
      <div className="bonus-overlay bonus-intro">
        <div className="bonus-intro-flash" />
        <div className="bonus-intro-content">
          <div className="bonus-intro-title animate-neon-pulse">
            契約期間延長チャンス！！
          </div>
          <div className="bonus-intro-sub">
            x{BONUS_MULTIPLIER.toFixed(1)} ボーナス倍率
          </div>
        </div>
      </div>
    )
  }

  if (bonusPhase === 'active' && bonusWord) {
    return (
      <div className="bonus-overlay bonus-active">
        <div className="bonus-active-bg" />
        <div className="bonus-active-content">
          {/* Header */}
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-bold tracking-[4px] text-amber-400 uppercase">
              BONUS
            </span>
            <span className="text-[11px] text-amber-400/70 tracking-[3px]">
              {bonusWordIdx + 1} / {BONUS_WORD_COUNT}
            </span>
          </div>

          <TimerBar pct={timerPct} />

          <div ref={cardRef}>
            <Card className="mb-3 bonus-card" glow={cardGlow}>
              <WordDisplay word={bonusWord.word} romaji={displayRomaji} typedLength={typedLength} />
              {/* Bonus multiplier badge */}
              <div className="min-h-9 mt-2 flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full
                  text-[13px] font-extrabold tracking-wider
                  bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500
                  text-black shadow-amber-500/50 shadow-lg animate-combo-glow">
                  BONUS x{BONUS_MULTIPLIER.toFixed(1)}
                </span>
              </div>
            </Card>
          </div>

          {/* Input indicator */}
          <div
            className={`
              w-full backdrop-blur-sm bg-amber-900/20 text-white
              border-[1.5px] rounded-xl py-3.5 px-4
              font-mono text-xl text-center
              transition-all duration-200 min-h-[56px]
              flex items-center justify-center
              break-all leading-relaxed
              ${inputState === 'correct'
                ? 'border-amber-400 animate-pulse-correct'
                : inputState === 'wrong'
                  ? 'border-red-400 animate-shake-miss'
                  : 'border-amber-500/40'
              }
            `}
          >
            <span className="text-amber-100/80">
              {typingState
                ? [...typingState.completedRomaji, typingState.inputBuffer].join('')
                : ''}
            </span>
            <span className="animate-pulse text-amber-400/40 ml-0.5">|</span>
          </div>

          <div className="flex justify-between items-center mt-3 min-h-8 gap-2 relative">
            <span className="text-xs text-amber-300/70 italic flex-1 text-left">
              {flavorText}
            </span>
            <span className="text-[11px] text-amber-400/50 whitespace-nowrap tracking-wide">SCORE</span>
            <span className={`text-[22px] font-bold min-w-[52px] text-right text-amber-300 ${scorePop ? 'animate-score-pop' : ''}`}>{score}</span>
            <FloatScoreContainer items={floatItems} />
          </div>
        </div>
      </div>
    )
  }

  if (bonusPhase === 'outro') {
    return (
      <div className="bonus-overlay bonus-outro">
        <div className="bonus-outro-content">
          <div className="bonus-outro-title">
            ボーナス終了！
          </div>
        </div>
      </div>
    )
  }

  return null
}
