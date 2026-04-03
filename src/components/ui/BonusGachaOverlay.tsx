import { useEffect, useState, useCallback, useRef } from 'react'
import { Card } from './Card.tsx'
import { TimerBar } from './TimerBar.tsx'
import { FloatScoreContainer, useFloatScore } from './FloatScore.tsx'
import { useGameStore, useBonusPhase, useCurrentBonusWord } from '../../stores/gameStore.ts'
import { useTimer } from '../../hooks/useTimer.ts'
import type { AudioEngine } from '../../lib/audioEngine.ts'
import { useParticles } from '../canvas/ParticleCanvas.tsx'
import { BONUS_TIME_LIMIT, SUPER_BONUS_PER_WORD_CHANCE } from '../../lib/constants.ts'
import { formatMonths } from '../../lib/gameLogic.ts'
import type { GachaRarity } from '../../types/game.ts'

interface BonusGachaOverlayProps {
  audio: AudioEngine
  onEnd: () => void
}

const RARITY_STYLES: Record<Exclude<GachaRarity, 'UR'>, { color: string; bg: string; glow: string; label: string }> = {
  SSR: { color: 'text-yellow-300', bg: 'from-yellow-500 via-amber-400 to-yellow-500', glow: 'shadow-yellow-500/50', label: 'SUPER SUPER RARE' },
  SR:  { color: 'text-purple-300', bg: 'from-purple-500 via-violet-400 to-purple-500', glow: 'shadow-purple-500/50', label: 'SUPER RARE' },
  R:   { color: 'text-blue-300', bg: 'from-blue-500 via-cyan-400 to-blue-500', glow: 'shadow-blue-500/50', label: 'RARE' },
  N:   { color: 'text-gray-300', bg: 'from-gray-500 via-gray-400 to-gray-500', glow: 'shadow-gray-500/50', label: 'NORMAL' },
}

export function BonusGachaOverlay({ audio, onEnd }: BonusGachaOverlayProps) {
  const bonusPhase = useBonusPhase()
  const bonusWord = useCurrentBonusWord()
  const setBonusPhase = useGameStore(s => s.setBonusPhase)
  const completeBonusWord = useGameStore(s => s.completeBonusWord)
  const handleBonusTimeout = useGameStore(s => s.handleBonusTimeout)
  const advanceBonus = useGameStore(s => s.advanceBonus)
  const incrementCombo = useGameStore(s => s.incrementCombo)
  const resetCombo = useGameStore(s => s.resetCombo)
  const score = useGameStore(s => s.score)
  const pending = useGameStore(s => s.pending)
  const bonusWordIdx = useGameStore(s => s.bonusWordIdx)
  const bonusWords = useGameStore(s => s.bonusWords)
  const gachaRarity = useGameStore(s => s.gachaRarity)
  const gachaProjectName = useGameStore(s => s.gachaProjectName)
  const bonusMultiplier = useGameStore(s => s.bonusMultiplier)
  const enterSuperBonus = useGameStore(s => s.enterSuperBonus)
  const setPending = useCallback((v: boolean) => useGameStore.setState({ pending: v }), [])

  const particles = useParticles()
  const cardRef = useRef<HTMLDivElement>(null)
  const { items: floatItems, spawn: spawnFloat } = useFloatScore()

  const [timerPct, setTimerPct] = useState(1)
  const [inputState, setInputState] = useState<'neutral' | 'correct' | 'wrong'>('neutral')
  const [typedIndex, setTypedIndex] = useState(0)
  const [cardGlow, setCardGlow] = useState(false)
  const [scorePop, setScorePop] = useState(false)

  const commandText = bonusWord?.word ?? ''
  const style = (gachaRarity && gachaRarity !== 'UR') ? RARITY_STYLES[gachaRarity] : RARITY_STYLES.N

  // ── End bonus ──
  const endBonus = useCallback(() => {
    stopTimerTick()
    setBonusPhase('gacha-outro')
    audio.bonusOutro()
    if (particles) {
      particles.confetti(80)
    }
    setTimeout(() => {
      setBonusPhase('inactive')
      onEnd()
    }, 2000)
  }, [setBonusPhase, audio, particles, onEnd]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phase transitions ──
  useEffect(() => {
    if (bonusPhase === 'gacha-blackout') {
      audio.bonusBlackout()
      const t = setTimeout(() => setBonusPhase('gacha-spin'), 300)
      return () => clearTimeout(t)
    }
    if (bonusPhase === 'gacha-spin') {
      audio.bonusIntro()
      const t = setTimeout(() => setBonusPhase('gacha-reveal'), 2500)
      return () => clearTimeout(t)
    }
    if (bonusPhase === 'gacha-super') {
      audio.bonusCorrect()
      if (particles) {
        particles.emitBonusIntro(window.innerWidth / 2, window.innerHeight / 2)
      }
      const t = setTimeout(() => enterSuperBonus(), 3000)
      return () => clearTimeout(t)
    }
    if (bonusPhase === 'gacha-reveal') {
      if (particles) {
        particles.emitBonusIntro(window.innerWidth / 2, window.innerHeight / 2)
      }
      if (gachaRarity === 'SSR') {
        audio.bonusCorrect()
      }
      const t = setTimeout(() => {
        setBonusPhase('gacha-active')
        setPending(false)
      }, 1500)
      return () => clearTimeout(t)
    }
  }, [bonusPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset typed index ──
  useEffect(() => {
    if (bonusWord && bonusPhase === 'gacha-active') {
      setTypedIndex(0)
      setInputState('neutral')
    }
  }, [bonusWord, bonusPhase])

  // ── Timeout ──
  const onTimeout = useCallback(() => {
    handleBonusTimeout()
    audio.timeout()
    setInputState('wrong')
    setTimeout(endBonus, 1500)
  }, [handleBonusTimeout, audio, endBonus])

  const { start: startTimerTick, stop: stopTimerTick } = useTimer({
    onTick: setTimerPct,
    onTimeout,
  })

  useEffect(() => {
    if (bonusPhase === 'gacha-active' && !pending) {
      startTimerTick(BONUS_TIME_LIMIT)
      setTimerPct(1)
    }
    return () => stopTimerTick()
  }, [bonusPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Advance bonus word ──
  const advanceBonusWord = useCallback(() => {
    advanceBonus()
    setPending(false)
    setInputState('neutral')
  }, [advanceBonus, setPending])

  // ── Word complete ──
  const handleWordComplete = useCallback(() => {
    const result = completeBonusWord()
    audio.bonusCorrect()

    setInputState('correct')
    spawnFloat(`+${result.months}ヶ月`)
    setCardGlow(true)
    setScorePop(true)
    setTimeout(() => setCardGlow(false), 600)
    setTimeout(() => setScorePop(false), 300)

    if (cardRef.current && particles) {
      const rect = cardRef.current.getBoundingClientRect()
      particles.emitBonusCorrect(rect.left + rect.width / 2, rect.top + rect.height / 3)
    }

    // ワード完了ごとにスーパーボーナス判定（~3%/word）
    if (Math.random() < SUPER_BONUS_PER_WORD_CHANCE) {
      stopTimerTick()
      setBonusPhase('gacha-super')
      return
    }

    setTimeout(advanceBonusWord, 600)
  }, [completeBonusWord, audio, particles, spawnFloat, advanceBonusWord, stopTimerTick, enterSuperBonus])

  // ── Keydown handler ──
  useEffect(() => {
    if (bonusPhase !== 'gacha-active') return

    const handler = (e: KeyboardEvent) => {
      if (pending || !commandText) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key.length !== 1) return

      e.preventDefault()

      const expected = commandText[typedIndex]
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

  // ── Render ──

  if (bonusPhase === 'gacha-blackout') {
    return (
      <div className="bonus-overlay bonus-blackout">
        <div className="bonus-blackout-inner" />
      </div>
    )
  }

  if (bonusPhase === 'gacha-spin') {
    return (
      <div className="bonus-overlay" style={{ background: 'radial-gradient(ellipse at center, rgba(20, 10, 40, 0.95), rgba(5, 0, 10, 0.98))' }}>
        <div className="text-center">
          <div className="text-[11px] font-bold tracking-[6px] text-purple-400/60 uppercase mb-4">
            PROJECT GACHA
          </div>
          <div className="text-6xl mb-6 animate-spin" style={{ animationDuration: '0.5s' }}>
            &#x1F3B0;
          </div>
          <div className="text-lg text-purple-300/60 animate-pulse">
            案件を抽選中...
          </div>
        </div>
      </div>
    )
  }

  if (bonusPhase === 'gacha-reveal') {
    return (
      <div className="bonus-overlay" style={{ background: 'radial-gradient(ellipse at center, rgba(20, 10, 40, 0.95), rgba(5, 0, 10, 0.98))' }}>
        <div className="text-center">
          <div className={`text-[11px] font-bold tracking-[6px] uppercase mb-2 ${style.color}`}>
            {style.label}
          </div>
          <div className={`text-4xl font-black tracking-[4px] mb-4 ${style.color}`}>
            {gachaProjectName}
          </div>
          <div className="mt-4">
            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full
              text-[13px] font-extrabold tracking-wider
              bg-gradient-to-r ${style.bg}
              text-black ${style.glow} shadow-lg`}>
              x{bonusMultiplier.toFixed(1)} BONUS
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (bonusPhase === 'gacha-active' && bonusWord) {
    return (
      <div className="bonus-overlay" style={{ background: 'radial-gradient(ellipse at center, rgba(20, 10, 40, 0.95), rgba(5, 0, 10, 0.98))' }}>
        <div className="bonus-active-content">
          <div className="flex justify-between items-center mb-1.5">
            <span className={`text-[11px] font-bold tracking-[4px] uppercase ${style.color}`}>
              {gachaRarity} - {gachaProjectName}
            </span>
            <span className="text-[11px] text-purple-400/70 tracking-[3px]">
              {bonusWordIdx + 1} / {bonusWords.length}
            </span>
          </div>

          <TimerBar pct={timerPct} />

          <div ref={cardRef}>
            <Card className="mb-3 bonus-card" glow={cardGlow}>
              <div className="text-center py-3">
                <div className="text-sm text-purple-400/50 mb-2 tracking-wider">
                  {bonusWord.flavor}
                </div>
                <div className={`font-mono font-bold leading-relaxed ${
                    commandText.length <= 10 ? 'text-3xl tracking-[3px]'
                    : commandText.length <= 16 ? 'text-2xl tracking-[2px]'
                    : commandText.length <= 22 ? 'text-xl tracking-[1px]'
                    : 'text-lg tracking-[0.5px]'
                  }`}>
                  {commandText.split('').map((char, i) => (
                    <span
                      key={`${bonusWordIdx}-${i}`}
                      className={`transition-all duration-100 ${
                        i < typedIndex
                          ? 'text-purple-400 drop-shadow-[0_0_6px_rgba(192,132,252,0.5)]'
                          : i === typedIndex
                            ? 'text-white underline decoration-purple-400 decoration-2 underline-offset-4'
                            : 'text-white/30'
                      }`}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
                </div>
              </div>
              <div className="min-h-9 mt-2 flex items-center justify-center">
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full
                  text-[13px] font-extrabold tracking-wider
                  bg-gradient-to-r ${style.bg}
                  text-black ${style.glow} shadow-lg`}>
                  x{bonusMultiplier.toFixed(1)} {gachaRarity}
                </span>
              </div>
            </Card>
          </div>

          <div
            className={`
              w-full backdrop-blur-sm bg-purple-900/20 text-white
              border-[1.5px] rounded-xl py-3.5 px-4
              font-mono text-xl text-center
              transition-all duration-200 min-h-[56px]
              flex items-center justify-center
              break-all leading-relaxed
              ${inputState === 'correct'
                ? 'border-purple-400 animate-pulse-correct'
                : inputState === 'wrong'
                  ? 'border-red-400 animate-shake-miss'
                  : 'border-purple-500/40'
              }
            `}
          >
            <span className="text-purple-100/80">
              {commandText.slice(0, typedIndex)}
            </span>
            <span className="animate-pulse text-purple-400/40 ml-0.5">|</span>
          </div>

          <div className="flex justify-end items-center mt-3 min-h-8 gap-2 relative">
            <span className="text-[11px] text-purple-400/50 whitespace-nowrap tracking-wide">常駐</span>
            <span className={`text-[22px] font-bold min-w-[52px] text-right text-purple-300 ${scorePop ? 'animate-score-pop' : ''}`}>{formatMonths(score)}</span>
            <FloatScoreContainer items={floatItems} />
          </div>
        </div>
      </div>
    )
  }

  if (bonusPhase === 'gacha-super') {
    return (
      <div className="bonus-overlay" style={{ background: 'radial-gradient(ellipse at center, rgba(40, 20, 0, 0.95), rgba(5, 0, 10, 0.98))' }}>
        <div className="text-center">
          <div className="text-[11px] font-bold tracking-[6px] uppercase mb-2 animate-pulse"
            style={{
              background: 'linear-gradient(90deg, #fbbf24, #ef4444, #a855f7, #3b82f6, #22c55e, #fbbf24)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'rainbowShift 1s linear infinite',
            }}>
            &#x2605; ULTRA RARE &#x2605;
          </div>
          <div className="text-4xl font-black tracking-[4px] mb-4 text-yellow-300"
            style={{
              textShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.4)',
            }}>
            フルリモート自社開発案件
          </div>
          <div className="text-sm text-yellow-400/60 mb-6">
            配属が決定しました...
          </div>
          <div className="text-xs text-white/30 animate-pulse">
            ...!?
          </div>
        </div>
      </div>
    )
  }

  if (bonusPhase === 'gacha-outro') {
    return (
      <div className="bonus-overlay" style={{ background: 'radial-gradient(ellipse at center, rgba(20, 10, 40, 0.95), rgba(5, 0, 10, 0.98))' }}>
        <div className="text-center">
          <div className="text-3xl font-black text-purple-300 tracking-wider">
            案件配属完了！
          </div>
        </div>
      </div>
    )
  }

  return null
}
