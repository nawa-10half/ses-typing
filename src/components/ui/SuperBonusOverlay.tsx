import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useGameStore, useBonusPhase } from '../../stores/gameStore.ts'
import type { AudioEngine } from '../../lib/audioEngine.ts'
import { useParticles } from '../canvas/ParticleCanvas.tsx'
import { formatMonths } from '../../lib/gameLogic.ts'
import {
  FAKE_FILE_PATHS,
  REEL_SYMBOLS,
  SUPER_BONUS_TYPE_WORDS,
} from '../../lib/constants.ts'

interface SuperBonusOverlayProps {
  audio: AudioEngine
  onEnd: () => void
}

// ── リール内部コンポーネント ──
const SYMBOL_HEIGHT = 80
const VISIBLE_ROWS = 3

// SESのインデックス（REEL_SYMBOLSの先頭）
const SES_INDEX = 0

function buildReelStrip(): string[] {
  // リールストリップ: シンボル配列を3回繰り返して十分な長さにする
  const strip: string[] = []
  for (let r = 0; r < 5; r++) {
    for (const s of REEL_SYMBOLS) {
      strip.push(s)
    }
  }
  return strip
}

function SlotReels({ stoppedReels }: { stoppedReels: number }) {
  const strips = useMemo(() => [buildReelStrip(), buildReelStrip(), buildReelStrip()], [])
  const reelRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])
  const offsetRefs = useRef([0, 0, 0])
  const rafRef = useRef(0)
  const stoppedRef = useRef(stoppedReels)
  stoppedRef.current = stoppedReels

  // SESが中段に来る停止位置を計算
  const getStopOffset = useCallback(() => {
    // 中段 = 1行目（0-indexed）に SES を表示するための offset
    // 十分スクロールした位置の SES_INDEX を使う
    const symbolsCount = REEL_SYMBOLS.length
    const cycleOffset = symbolsCount * 3 // 3サイクル目
    const targetIdx = cycleOffset + SES_INDEX
    // 中段に配置: offset = -(targetIdx - 1) * SYMBOL_HEIGHT
    return -(targetIdx - 1) * SYMBOL_HEIGHT
  }, [])

  useEffect(() => {
    const speeds = [12, 14, 16] // ピクセル/フレーム（各リール微妙に違う速度）
    const totalSymbols = strips[0].length

    const animate = () => {
      for (let i = 0; i < 3; i++) {
        if (i < stoppedRef.current) continue // 停止済み
        offsetRefs.current[i] -= speeds[i]
        // ループ: 十分戻ったらリセット
        const maxOffset = -(totalSymbols - VISIBLE_ROWS) * SYMBOL_HEIGHT
        if (offsetRefs.current[i] < maxOffset) {
          offsetRefs.current[i] = 0
        }
        if (reelRefs.current[i]) {
          reelRefs.current[i]!.style.transform = `translateY(${offsetRefs.current[i]}px)`
        }
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [strips])

  // リール停止処理
  useEffect(() => {
    for (let i = 0; i < stoppedReels; i++) {
      const stopY = getStopOffset()
      offsetRefs.current[i] = stopY
      if (reelRefs.current[i]) {
        reelRefs.current[i]!.classList.add('reel-stopping')
        reelRefs.current[i]!.style.transform = `translateY(${stopY}px)`
      }
    }
  }, [stoppedReels, getStopOffset])

  return (
    <div className="slot-machine-frame">
      <div className="slot-reels-container">
        {strips.map((strip, reelIdx) => (
          <div key={reelIdx} className="reel-column">
            <div
              ref={el => { reelRefs.current[reelIdx] = el }}
              className="reel-strip"
            >
              {strip.map((symbol, symIdx) => {
                const isSES = symbol === 'SES'
                const isStopped = reelIdx < stoppedReels
                return (
                  <div
                    key={symIdx}
                    className={`reel-symbol ${isSES ? 'reel-symbol-ses' : ''} ${isSES && isStopped ? 'reel-symbol-stopped' : ''}`}
                  >
                    {symbol}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div className="payline-indicator" />
      </div>
    </div>
  )
}

// ── メインコンポーネント ──
export function SuperBonusOverlay({ audio, onEnd }: SuperBonusOverlayProps) {
  const bonusPhase = useBonusPhase()
  const setBonusPhase = useGameStore(s => s.setBonusPhase)
  const applySuperBonusScore = useGameStore(s => s.applySuperBonusScore)
  const endSuperBonus = useGameStore(s => s.endSuperBonus)
  const score = useGameStore(s => s.score)

  const particles = useParticles()

  const [typedIndex, setTypedIndex] = useState(0)
  const [stoppedReels, setStoppedReels] = useState(0)
  const [displayScore, setDisplayScore] = useState(0)
  const [preDoubleScore, setPreDoubleScore] = useState(0)

  // 現在のタイピングフェーズのターゲットワード
  const currentTypeWord = useMemo(() => {
    if (bonusPhase === 'super-type-system') return SUPER_BONUS_TYPE_WORDS[0]
    if (bonusPhase === 'super-type-engineering') return SUPER_BONUS_TYPE_WORDS[1]
    if (bonusPhase === 'super-type-service') return SUPER_BONUS_TYPE_WORDS[2]
    return ''
  }, [bonusPhase])

  // リール回転フェーズ以降かどうか
  const showReels = bonusPhase === 'super-reels'
    || bonusPhase === 'super-type-system'
    || bonusPhase === 'super-type-engineering'
    || bonusPhase === 'super-type-service'

  // ── フェーズ遷移 ──
  useEffect(() => {
    if (bonusPhase === 'super-rm-exec') {
      audio.superBonusRmExec()
      const t = setTimeout(() => setBonusPhase('super-blackout'), 1000)
      return () => clearTimeout(t)
    }
    if (bonusPhase === 'super-blackout') {
      audio.superBonusBlackout()
      const t = setTimeout(() => setBonusPhase('super-reels'), 600)
      return () => clearTimeout(t)
    }
    if (bonusPhase === 'super-reels') {
      audio.superBonusReelSpin()
      // リール回転開始 → すぐタイピングフェーズへ
      const t = setTimeout(() => {
        setBonusPhase('super-type-system')
        setTypedIndex(0)
      }, 1500)
      return () => clearTimeout(t)
    }
  }, [bonusPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── リール回転音を定期的に鳴らす ──
  useEffect(() => {
    if (!showReels) return
    const interval = setInterval(() => {
      if (stoppedReels < 3) audio.superBonusReelSpin()
    }, 500)
    return () => clearInterval(interval)
  }, [showReels, stoppedReels, audio])

  // ── タイピング完了時の処理 ──
  const handleTypeComplete = useCallback(() => {
    if (bonusPhase === 'super-type-system') {
      setStoppedReels(1)
      audio.superBonusReelStop()
      if (particles) {
        particles.emitReelStop(window.innerWidth / 2 - 54, window.innerHeight / 2)
      }
      setTimeout(() => {
        setBonusPhase('super-type-engineering')
        setTypedIndex(0)
      }, 800)
    } else if (bonusPhase === 'super-type-engineering') {
      setStoppedReels(2)
      audio.superBonusReelStop()
      audio.superBonusTenpai()
      if (particles) {
        particles.emitReelStop(window.innerWidth / 2, window.innerHeight / 2)
      }
      setTimeout(() => {
        setBonusPhase('super-type-service')
        setTypedIndex(0)
      }, 1200)
    } else if (bonusPhase === 'super-type-service') {
      setStoppedReels(3)
      audio.superBonusReelStop()
      audio.superBonusFanfare()
      if (particles) {
        particles.emitReelStop(window.innerWidth / 2 + 54, window.innerHeight / 2)
        particles.emitSuperCelebration()
      }
      // スコア2倍
      const currentScore = useGameStore.getState().score
      setPreDoubleScore(currentScore)
      setTimeout(() => {
        const added = applySuperBonusScore()
        audio.superBonusScoreDouble()
        setBonusPhase('super-celebration')
        // カウントアップアニメーション
        const startScore = currentScore
        const endScore = currentScore + added
        const duration = 2000
        const startTime = performance.now()
        const animateCount = (now: number) => {
          const elapsed = now - startTime
          const progress = Math.min(elapsed / duration, 1)
          // easeOut
          const eased = 1 - (1 - progress) ** 3
          setDisplayScore(Math.round(startScore + (endScore - startScore) * eased))
          if (progress < 1) requestAnimationFrame(animateCount)
        }
        requestAnimationFrame(animateCount)
      }, 1500)
    }
  }, [bonusPhase, setBonusPhase, applySuperBonusScore, audio, particles])

  // ── セレブレーション終了 ──
  useEffect(() => {
    if (bonusPhase !== 'super-celebration') return
    const t = setTimeout(() => {
      endSuperBonus()
      onEnd()
    }, 4000)
    return () => clearTimeout(t)
  }, [bonusPhase, endSuperBonus, onEnd])

  // ── キーダウンハンドラ ──
  useEffect(() => {
    if (!currentTypeWord) return

    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key.length !== 1) return
      e.preventDefault()

      const expected = currentTypeWord[typedIndex]
      if (e.key.toLowerCase() === expected.toLowerCase()) {
        const nextIndex = typedIndex + 1
        setTypedIndex(nextIndex)
        audio.keyPress()

        if (nextIndex >= currentTypeWord.length) {
          handleTypeComplete()
        }
      } else {
        audio.wrongKey()
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [currentTypeWord, typedIndex, audio, handleTypeComplete])

  // ── rm -rf 実行演出 ──
  if (bonusPhase === 'super-rm-exec') {
    return (
      <div className="super-rm-exec-overlay">
        <div className="rm-scroll-container">
          {FAKE_FILE_PATHS.map((path, i) => (
            <div key={i} className="rm-line">
              rm: removing '{path}'
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── 暗転（CRTプチューーーン = 通常ボーナスと同じビジュアル） ──
  if (bonusPhase === 'super-blackout') {
    return (
      <div className="bonus-overlay bonus-blackout">
        <div className="bonus-blackout-inner" />
      </div>
    )
  }

  // ── リール + タイピング ──
  if (showReels) {
    const reelPhaseIdx = bonusPhase === 'super-type-system' ? 0
      : bonusPhase === 'super-type-engineering' ? 1
      : bonusPhase === 'super-type-service' ? 2
      : -1

    return (
      <div className="slot-machine-overlay">
        {/* SES揃いタイトル */}
        <div className="text-center mb-6">
          <div className="text-[11px] font-bold tracking-[6px] text-amber-400/60 uppercase mb-2">
            SUPER BONUS
          </div>
          <div className="text-2xl font-black tracking-[4px] text-amber-400 animate-neon-pulse">
            SES揃い
          </div>
        </div>

        <SlotReels stoppedReels={stoppedReels} />

        {/* タイピングプロンプト */}
        {currentTypeWord && (
          <div className="super-type-prompt">
            <div className="text-sm text-amber-400/50 mb-3">
              {currentTypeWord}と入力してください
            </div>
            <div className="super-type-word">
              {currentTypeWord.split('').map((char, i) => (
                <span
                  key={`${reelPhaseIdx}-${i}`}
                  className={`transition-all duration-100 ${
                    i < typedIndex
                      ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                      : i === typedIndex
                        ? 'text-white underline decoration-amber-400 decoration-2 underline-offset-4'
                        : 'text-white/30'
                  }`}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* スコア */}
        <div className="mt-6 text-center">
          <span className="text-[11px] text-amber-400/40 tracking-wide">常駐 </span>
          <span className="text-xl font-bold text-amber-300">{formatMonths(score)}</span>
        </div>
      </div>
    )
  }

  // ── セレブレーション ──
  if (bonusPhase === 'super-celebration') {
    return (
      <div className="super-celebration-overlay">
        <div className="super-celebration-title">
          SES揃い！！
        </div>
        <div className="super-celebration-label">
          常駐期間 x2.0
        </div>
        <div className="super-celebration-score">
          {formatMonths(displayScore)}
        </div>
        <div className="text-sm text-amber-400/40 mt-4 tracking-wider">
          {formatMonths(preDoubleScore)} → {formatMonths(displayScore)}
        </div>
      </div>
    )
  }

  return null
}
