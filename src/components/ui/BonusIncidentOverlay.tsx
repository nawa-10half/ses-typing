import { useEffect, useState, useCallback, useRef } from 'react'
import { Card } from './Card.tsx'
import { TimerBar } from './TimerBar.tsx'
import { FloatScoreContainer, useFloatScore } from './FloatScore.tsx'
import { useGameStore, useBonusPhase, useCurrentBonusWord } from '../../stores/gameStore.ts'
import { useTimer } from '../../hooks/useTimer.ts'
import type { AudioEngine } from '../../lib/audioEngine.ts'
import { useParticles } from '../canvas/ParticleCanvas.tsx'
import { BONUS_TIME_LIMIT, SUPER_BONUS_PER_WORD_CHANCE } from '../../lib/constants.ts'
import { formatMonths, calcIncidentMultiplier } from '../../lib/gameLogic.ts'

interface BonusIncidentOverlayProps {
  audio: AudioEngine
  onEnd: () => void
}

export function BonusIncidentOverlay({ audio, onEnd }: BonusIncidentOverlayProps) {
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
  const incidentData = useGameStore(s => s.incidentData)
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
  const [currentMultiplier, setCurrentMultiplier] = useState(3.0)

  const commandText = bonusWord?.word ?? ''

  // ── End bonus ──
  const endBonus = useCallback(() => {
    stopTimerTick()
    setBonusPhase('incident-outro')
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
    if (bonusPhase === 'incident-alert') {
      audio.bsodBeep()
      const t = setTimeout(() => setBonusPhase('incident-blackout'), 800)
      return () => clearTimeout(t)
    }
    if (bonusPhase === 'incident-blackout') {
      audio.bonusBlackout()
      const t = setTimeout(() => setBonusPhase('incident-intro'), 300)
      return () => clearTimeout(t)
    }
    if (bonusPhase === 'incident-intro') {
      audio.bonusIntro()
      if (particles) {
        particles.emitBonusIntro(window.innerWidth / 2, window.innerHeight / 2)
      }
      const t = setTimeout(() => {
        setBonusPhase('incident-active')
        setPending(false)
      }, 2000)
      return () => clearTimeout(t)
    }
    if (bonusPhase === 'incident-crash') {
      audio.bonusBlackout()
      const t = setTimeout(() => {
        enterSuperBonus()
      }, 1500)
      return () => clearTimeout(t)
    }
  }, [bonusPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset typed index ──
  useEffect(() => {
    if (bonusWord && bonusPhase === 'incident-active') {
      setTypedIndex(0)
      setInputState('neutral')
      setCurrentMultiplier(3.0)
    }
  }, [bonusWord, bonusPhase])

  // ── Live multiplier update ──
  useEffect(() => {
    if (bonusPhase !== 'incident-active' || !commandText) return
    const interval = setInterval(() => {
      const elapsed = performance.now() - useGameStore.getState().wordStartTime
      setCurrentMultiplier(calcIncidentMultiplier(elapsed, commandText.length))
    }, 100)
    return () => clearInterval(interval)
  }, [bonusPhase, commandText])

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
    if (bonusPhase === 'incident-active' && !pending) {
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
      setBonusPhase('incident-crash')
      return
    }

    setTimeout(advanceBonusWord, 600)
  }, [completeBonusWord, audio, particles, spawnFloat, advanceBonusWord, stopTimerTick, setBonusPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keydown handler ──
  useEffect(() => {
    if (bonusPhase !== 'incident-active') return

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

  if (bonusPhase === 'incident-alert') {
    return (
      <div className="bonus-overlay animate-incident-flash" style={{ background: 'rgba(180, 20, 20, 0.95)' }}>
        <div className="text-white font-mono text-center px-8 max-w-[500px]">
          <div className="text-[64px] leading-none mb-4 animate-pulse">&#x26A0;</div>
          <div className="text-2xl font-black tracking-[6px] text-red-200 mb-4">
            CRITICAL ALERT
          </div>
          <div className="text-[15px] leading-relaxed text-red-100/80">
            本番環境で障害が発生しました。直ちに対応してください。
          </div>
        </div>
      </div>
    )
  }

  if (bonusPhase === 'incident-blackout') {
    return (
      <div className="bonus-overlay bonus-blackout">
        <div className="bonus-blackout-inner" />
      </div>
    )
  }

  if (bonusPhase === 'incident-intro' && incidentData) {
    return (
      <div className="bonus-overlay" style={{ background: 'radial-gradient(ellipse at center, rgba(60, 10, 10, 0.95), rgba(10, 0, 0, 0.98))' }}>
        <div className="text-center px-8">
          <div className="text-[11px] font-bold tracking-[6px] text-red-400/60 uppercase mb-2">
            INCIDENT RESPONSE
          </div>
          <div className="text-3xl font-black tracking-[4px] text-red-400 animate-neon-pulse mb-4">
            {incidentData.name}
          </div>
          <div className="text-sm text-red-300/60">
            {incidentData.description}
          </div>
          <div className="mt-6 text-xs text-red-400/40">
            {incidentData.commands.length}コマンドで復旧せよ
          </div>
        </div>
      </div>
    )
  }

  if (bonusPhase === 'incident-active' && bonusWord) {
    const multiplierColor = currentMultiplier >= 2.5 ? 'text-emerald-400' : currentMultiplier >= 2.0 ? 'text-amber-400' : 'text-red-400'

    return (
      <div className="bonus-overlay" style={{ background: 'radial-gradient(ellipse at center, rgba(40, 5, 5, 0.95), rgba(5, 0, 0, 0.98))' }}>
        <div className="bonus-active-content">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-bold tracking-[4px] text-red-400 uppercase">
              INCIDENT
            </span>
            <span className="text-[11px] text-red-400/70 tracking-[3px]">
              {bonusWordIdx + 1} / {bonusWords.length}
            </span>
          </div>

          <TimerBar pct={timerPct} />

          <div ref={cardRef}>
            <Card className="mb-3 bonus-card" glow={cardGlow}>
              <div className="text-center py-3">
                <div className="text-sm text-red-400/50 mb-2 tracking-wider">
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
                          ? 'text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.5)]'
                          : i === typedIndex
                            ? 'text-white underline decoration-red-400 decoration-2 underline-offset-4'
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
                  bg-red-900/50 border border-red-500/30 shadow-lg
                  ${multiplierColor} transition-colors duration-200`}>
                  x{currentMultiplier.toFixed(1)} SPEED BONUS
                </span>
              </div>
            </Card>
          </div>

          <div
            className={`
              w-full backdrop-blur-sm bg-red-900/20 text-white
              border-[1.5px] rounded-xl py-3.5 px-4
              font-mono text-xl text-center
              transition-all duration-200 min-h-[56px]
              flex items-center justify-center
              break-all leading-relaxed
              ${inputState === 'correct'
                ? 'border-red-400 animate-pulse-correct'
                : inputState === 'wrong'
                  ? 'border-red-600 animate-shake-miss'
                  : 'border-red-500/40'
              }
            `}
          >
            <span className="text-red-100/80">
              {commandText.slice(0, typedIndex)}
            </span>
            <span className="animate-pulse text-red-400/40 ml-0.5">|</span>
          </div>

          <div className="flex justify-end items-center mt-3 min-h-8 gap-2 relative">
            <span className="text-[11px] text-red-400/50 whitespace-nowrap tracking-wide">常駐</span>
            <span className={`text-[22px] font-bold min-w-[52px] text-right text-red-300 ${scorePop ? 'animate-score-pop' : ''}`}>{formatMonths(score)}</span>
            <FloatScoreContainer items={floatItems} />
          </div>
        </div>
      </div>
    )
  }

  if (bonusPhase === 'incident-crash') {
    return (
      <div className="bonus-overlay animate-incident-flash" style={{ background: 'rgba(120, 0, 0, 0.98)' }}>
        <div className="text-center font-mono">
          <div className="text-red-500 text-lg mb-4 animate-pulse">FATAL ERROR</div>
          <div className="text-3xl font-black text-red-300 tracking-wider mb-4">
            DROP TABLE sessions;
          </div>
          <div className="text-sm text-red-400/60">
            復旧作業中に本番DBを破壊してしまった...
          </div>
        </div>
      </div>
    )
  }

  if (bonusPhase === 'incident-outro') {
    return (
      <div className="bonus-overlay" style={{ background: 'radial-gradient(ellipse at center, rgba(10, 40, 10, 0.95), rgba(0, 5, 0, 0.98))' }}>
        <div className="text-center">
          <div className="text-3xl font-black text-emerald-400 tracking-wider">
            障害復旧完了！
          </div>
        </div>
      </div>
    )
  }

  return null
}
