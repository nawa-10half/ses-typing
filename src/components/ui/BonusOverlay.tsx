import { useEffect, useState, useCallback, useRef } from 'react'
import { Card } from './Card.tsx'
import { TimerBar } from './TimerBar.tsx'
import { FloatScoreContainer, useFloatScore } from './FloatScore.tsx'
import { useGameStore, useBonusPhase, useCurrentBonusWord } from '../../stores/gameStore.ts'
import { useTimer } from '../../hooks/useTimer.ts'
import type { AudioEngine } from '../../lib/audioEngine.ts'
import { useParticles } from '../canvas/ParticleCanvas.tsx'
import { BONUS_MULTIPLIER, BONUS_TIME_LIMIT, SUPER_BONUS_TRIGGER_WORD, SUPER_BONUS_CHANCE } from '../../lib/constants.ts'
import { formatMonths } from '../../lib/gameLogic.ts'
import { SuperBonusOverlay } from './SuperBonusOverlay.tsx'

interface BonusOverlayProps {
  audio: AudioEngine
  onEnd: () => void
}

export function BonusOverlay({ audio, onEnd }: BonusOverlayProps) {
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

  // ── End bonus (shared by timeout and all-words-done) ──
  const endBonus = useCallback(() => {
    stopTimerTick()
    setBonusPhase('outro')
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
    if (bonusPhase === 'bsod') {
      audio.bsodBeep()
      const t = setTimeout(() => setBonusPhase('blackout'), 600)
      return () => clearTimeout(t)
    }
    if (bonusPhase === 'blackout') {
      audio.bonusBlackout()
      const t = setTimeout(() => setBonusPhase('intro'), 300)
      return () => clearTimeout(t)
    }
    if (bonusPhase === 'intro') {
      audio.bonusIntro()
      if (particles) {
        particles.emitBonusIntro(window.innerWidth / 2, window.innerHeight / 2)
      }
      const t = setTimeout(() => {
        setBonusPhase('active')
        setPending(false)
      }, 2500)
      return () => clearTimeout(t)
    }
  }, [bonusPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Gold rain during active phase ──
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
    }
  }, [bonusWord, bonusPhase])

  // ── Timeout (bonus time is up) ──
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

  // ── Start overall timer once when active phase begins ──
  useEffect(() => {
    if (bonusPhase === 'active' && !pending) {
      startTimerTick(BONUS_TIME_LIMIT)
      setTimerPct(1)
    }
    return () => stopTimerTick()
  }, [bonusPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Advance bonus word (timer keeps running) ──
  const advanceBonusWord = useCallback(() => {
    advanceBonus()
    setPending(false)
    setInputState('neutral')
  }, [advanceBonus, setPending])

  // ── Word complete ──
  const handleWordComplete = useCallback(() => {
    const result = completeBonusWord()
    audio.bonusCorrect()

    // SES揃いトリガー判定: rm -rf /* 入力完了時に50%で発動
    if (bonusWord?.word === SUPER_BONUS_TRIGGER_WORD && Math.random() < SUPER_BONUS_CHANCE) {
      stopTimerTick()
      enterSuperBonus()
      return
    }

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

    setTimeout(advanceBonusWord, 1200)
  }, [completeBonusWord, audio, particles, spawnFloat, advanceBonusWord, bonusWord, stopTimerTick, enterSuperBonus])

  // ── Keydown handler (direct character input) ──
  useEffect(() => {
    if (bonusPhase !== 'active') return

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

  // ── Render phases ──

  // Super bonus phases → delegate to SuperBonusOverlay
  if (bonusPhase.startsWith('super-')) {
    return <SuperBonusOverlay audio={audio} onEnd={onEnd} />
  }

  if (bonusPhase === 'bsod') {
    return (
      <div className="bonus-overlay" style={{ background: '#0078d7' }}>
        <div className="text-white font-mono text-center px-8 max-w-[500px]">
          <div className="text-[72px] leading-none mb-4">:(</div>
          <div className="text-[15px] leading-relaxed">
            お使いのPCで問題が発生したため、再起動する必要があります。エラー情報を収集しています。自動的に再起動します。
          </div>
          <div className="mt-6 text-[13px] text-white/70">
            停止コード: BONUS_TIME_OVERFLOW
          </div>
        </div>
      </div>
    )
  }

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
              {bonusWordIdx + 1} WORDS
            </span>
          </div>

          <TimerBar pct={timerPct} />

          <div ref={cardRef}>
            <Card className="mb-3 bonus-card" glow={cardGlow}>
              {/* Command display with character-by-character progress */}
              <div className="text-center py-3">
                <div className="text-sm text-amber-400/50 mb-2 tracking-wider">
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

          <div className="flex justify-end items-center mt-3 min-h-8 gap-2 relative">
            <span className="text-[11px] text-amber-400/50 whitespace-nowrap tracking-wide">常駐</span>
            <span className={`text-[22px] font-bold min-w-[52px] text-right text-amber-300 ${scorePop ? 'animate-score-pop' : ''}`}>{formatMonths(score)}</span>
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
