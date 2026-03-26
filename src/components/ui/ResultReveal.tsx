import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatMonths } from '../../lib/gameLogic.ts'

interface ResultRevealProps {
  totalMonths: number
  rankTitle: string
  rankComment: string
  courseName: string
  kps: number
  accuracy: number
  maxCombo: number
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

export function ResultReveal({
  totalMonths, rankTitle, rankComment, courseName,
  kps, accuracy, maxCombo, onComplete,
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
              className="text-[28px] font-extrabold mb-3 text-gradient-rank"
              style={{
                filter: 'drop-shadow(0 0 12px rgba(129,140,248,0.4))',
              }}
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
