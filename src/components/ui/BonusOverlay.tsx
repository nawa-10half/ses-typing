import { useEffect, useState, useCallback, useRef } from 'react'
// useRef still needed for cardRef
import { Card } from './Card.tsx'
import { TimerBar } from './TimerBar.tsx'
import { FloatScoreContainer, useFloatScore } from './FloatScore.tsx'
import { useGameStore, useBonusPhase, useCurrentBonusWord } from '../../stores/gameStore.ts'
import { useTimer } from '../../hooks/useTimer.ts'
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
  const timerMax = useGameStore(s => s.wordTimerMax)
  const bonusWordIdx = useGameStore(s => s.bonusWordIdx)

  const particles = useParticles()
  const cardRef = useRef<HTMLDivElement>(null)
  const { items: floatItems, spawn: spawnFloat } = useFloatScore()

  const [timerPct, setTimerPct] = useState(1)
  const [inputState, setInputState] = useState<'neutral' | 'correct' | 'wrong'>('neutral')
  const [flavorText, setFlavorText] = useState('')
  const [typedIndex, setTypedIndex] = useState(0)
  const [cardGlow, setCardGlow] = useState(false)
  const [scorePop, setScorePop] = useState(false)

  const commandText = bonusWord?.word ?? ''

  // ── Phase transitions ──
  useEffect(() => {
    if (bonusPhase === 'blackout') {
      audio.bonusBlackout()
      const t = setTimeout(() => setBonusPhase('intro'), 600)
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

  // ── Gold rain during active phase (fixed: no recursive rAF leak) ──
  useEffect(() => {
    if (bonusPhase === 'active' && particles) {
      const interval = setInterval(() => {
        particles.emitBonusGoldRain()
      }, 100)
      return () => clearInterval(interval)
    }
  }, [bonusPhase, particles])

  // ── Reset typed index for current bonus word ──
  useEffect(() => {
    if (bonusWord && bonusPhase === 'active') {
      setTypedIndex(0)
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
      setFlavorText(`時間切れ… 正解：${bonusWord.word}`)
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
    setFlavorText(`+${result.months}ヶ月　x${BONUS_MULTIPLIER.toFixed(1)} ${result.flavor}`)
    spawnFloat(`+${result.months}ヶ月`)
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

  // ── Keydown handler (direct character input) ──
  useEffect(() => {
    if (bonusPhase !== 'active') return

    const handler = (e: KeyboardEvent) => {
      if (pending || !commandText) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      // Accept printable characters and space
      if (e.key.length !== 1) return

      e.preventDefault()

      const expected = commandText[typedIndex]
      // Case-insensitive match for letters
      const matches = e.key.toLowerCase() === expected.toLowerCase()

      if (matches) {
        const nextIndex = typedIndex + 1
        setTypedIndex(nextIndex)
        incrementCombo()

        if (nextIndex >= commandText.length) {
          handleWordComplete()
        } else {
          audio.keyPress()
        }
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
  }, [bonusPhase, typedIndex, commandText, pending, audio, handleWordComplete, incrementCombo, resetCombo])

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
              {/* Command display with character-by-character progress */}
              <div className="text-center py-3">
                <div className="text-xs text-amber-400/50 mb-2 tracking-wider">
                  {bonusWord.flavor}
                </div>
                <div className="text-3xl font-mono font-bold tracking-[3px] break-all leading-relaxed">
                  {commandText.split('').map((char, i) => (
                    <span
                      key={`${bonusWordIdx}-${i}`}
                      className={`transition-all duration-100 ${
                        i < typedIndex
                          ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                          : i === typedIndex
                            ? 'text-white underline decoration-amber-400 decoration-2 underline-offset-4'
                            : 'text-white/30'
                      }`}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
                </div>
              </div>
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
              {commandText.slice(0, typedIndex)}
            </span>
            <span className="animate-pulse text-amber-400/40 ml-0.5">|</span>
          </div>

          <div className="flex justify-between items-center mt-3 min-h-8 gap-2 relative">
            <span className="text-xs text-amber-300/70 italic flex-1 text-left">
              {flavorText}
            </span>
            <span className="text-[11px] text-amber-400/50 whitespace-nowrap tracking-wide">常駐</span>
            <span className={`text-[22px] font-bold min-w-[52px] text-right text-amber-300 ${scorePop ? 'animate-score-pop' : ''}`}>{score}ヶ月</span>
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
