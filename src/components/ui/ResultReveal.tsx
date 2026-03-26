import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatMonths } from '../../lib/gameLogic.ts'
import type { AudioEngine } from '../../lib/audioEngine.ts'

interface ParticleActions {
  confetti(count: number): void
}

interface ResultRevealProps {
  totalMonths: number
  rankTitle: string
  rankComment: string
  courseName: string
  kps: number
  accuracy: number
  maxCombo: number
  audio: AudioEngine
  particles: ParticleActions | null | undefined
  onComplete: () => void
}

type RevealPhase = 'label' | 'months' | 'rank' | 'comment' | 'done'

const PHASE_DELAYS: Record<RevealPhase, number> = {
  label: 600,
  months: 1400,
  rank: 1200,
  comment: 1000,
  done: 0,
}

function getRankStyle(months: number): { className: string; style: React.CSSProperties } {
  if (months >= 720) {
    // 60年〜: レインボー
    return {
      className: 'result-rank-rainbow',
      style: { filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.5))' },
    }
  }
  if (months >= 360) {
    // 30年〜: ゴールド
    return {
      className: '',
      style: {
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #fde68a, #d97706)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 0 14px rgba(251,191,36,0.6))',
      },
    }
  }
  if (months >= 120) {
    // 10年〜: 紫〜ピンク
    return {
      className: '',
      style: {
        background: 'linear-gradient(135deg, #a855f7, #ec4899, #f43f5e)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.5))',
      },
    }
  }
  if (months >= 60) {
    // 5年〜: シアン
    return {
      className: '',
      style: {
        background: 'linear-gradient(135deg, #22d3ee, #3b82f6, #818cf8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.4))',
      },
    }
  }
  if (months >= 24) {
    // 2年〜: エメラルド
    return {
      className: '',
      style: {
        background: 'linear-gradient(135deg, #34d399, #2dd4bf)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.4))',
      },
    }
  }
  // 〜2年: 白
  return {
    className: '',
    style: {
      color: 'rgba(255,255,255,0.8)',
      filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.2))',
    },
  }
}

export function ResultReveal({
  totalMonths, rankTitle, rankComment, courseName,
  kps, accuracy, maxCombo, audio, particles, onComplete,
}: ResultRevealProps) {
  const [phase, setPhase] = useState<RevealPhase>('label')

  useEffect(() => {
    const phases: RevealPhase[] = ['label', 'months', 'rank', 'comment', 'done']
    const idx = phases.indexOf(phase)
    if (phase === 'done') return
    const delay = PHASE_DELAYS[phase]
    const t = setTimeout(() => setPhase(phases[idx + 1]), delay)
    return () => clearTimeout(t)
  }, [phase])

  // SE per phase
  useEffect(() => {
    if (phase === 'label') audio.revealStep()
    if (phase === 'months') audio.revealStep()
    if (phase === 'rank') audio.revealRank()
    if (phase === 'comment') audio.revealStep()
    if (phase === 'done') {
      audio.revealFanfare()
      particles?.confetti(120)
      setTimeout(() => particles?.confetti(60), 500)
    }
  }, [phase, audio, particles])

  const handleSkip = useCallback(() => {
    if (phase !== 'done') {
      setPhase('done')
    }
  }, [phase])

  const handleShareX = useCallback(() => {
    const text = [
      `SESタイピング 〜あの案件に常駐せよ〜`,
      `${courseName}`,
      '',
      `常駐期間: ${formatMonths(totalMonths)}`,
      `${rankTitle}`,
      `「${rankComment}」`,
      '',
      `Speed: ${kps} 打/秒 | Accuracy: ${accuracy}% | Max Combo: ${maxCombo}`,
      '',
      '#SESタイピング #タイピングゲーム',
      'https://ses-typing.pages.dev/',
    ].join('\n')
    const url = `https://x.com/intent/post?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [totalMonths, rankTitle, rankComment, courseName, kps, accuracy, maxCombo])

  const phaseIdx = ['label', 'months', 'rank', 'comment', 'done'].indexOf(phase)
  const rankStyle = getRankStyle(totalMonths)

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  }

  const rankVariants = {
    hidden: { opacity: 0, scale: 0.3, rotate: -5 },
    visible: {
      opacity: 1, scale: 1, rotate: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    },
  }

  return (
    <motion.div
      className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={handleSkip}
    >
      <div className="text-center px-6 max-w-[480px] w-full" onClick={e => e.stopPropagation()}>
        <AnimatePresence>
          {/* ラベル: 常駐期間 */}
          {phaseIdx >= 0 && (
            <motion.div
              key="label"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-white/40 text-sm tracking-[4px] uppercase mb-3"
            >
              常駐期間
            </motion.div>
          )}

          {/* 期間 */}
          {phaseIdx >= 1 && (
            <motion.div
              key="months"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-[48px] font-black text-white mb-6 tracking-[2px]"
              style={{
                textShadow: '0 0 20px rgba(52,211,153,0.4), 0 0 40px rgba(52,211,153,0.2)',
              }}
            >
              {formatMonths(totalMonths)}
            </motion.div>
          )}

          {/* 称号 */}
          {phaseIdx >= 2 && (
            <motion.div
              key="rank"
              variants={rankVariants}
              initial="hidden"
              animate="visible"
              className={`text-[28px] font-extrabold mb-3 ${rankStyle.className}`}
              style={rankStyle.style}
            >
              {rankTitle}
            </motion.div>
          )}

          {/* コメント */}
          {phaseIdx >= 3 && (
            <motion.div
              key="comment"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-[15px] text-white/50 leading-relaxed mb-8"
            >
              {rankComment}
            </motion.div>
          )}

          {/* ボタン */}
          {phaseIdx >= 4 && (
            <motion.div
              key="buttons"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="flex gap-3 justify-center"
            >
              <button
                onClick={handleShareX}
                className="py-2.5 px-6 rounded-xl text-sm font-mono cursor-pointer
                  bg-white/5 text-white border border-white/20
                  hover:bg-white/10 hover:border-white/30 transition-all duration-200
                  active:scale-[0.97] flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Xに投稿
              </button>
              <button
                onClick={onComplete}
                className="py-2.5 px-6 rounded-xl text-sm font-mono cursor-pointer
                  bg-white text-[#0a0a0f] border border-transparent font-medium
                  hover:opacity-90 transition-all duration-200
                  active:scale-[0.97]"
              >
                結果を見る
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* スキップヒント */}
        {phase !== 'done' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-white/20 text-[10px] mt-8 tracking-wider"
          >
            TAP TO SKIP
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}
