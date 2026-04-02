import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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

const PHASES: RevealPhase[] = ['label', 'months', 'rank', 'comment', 'done']

const PHASE_DELAYS: Record<RevealPhase, number> = {
  label: 600,
  months: 1400,
  rank: 1200,
  comment: 1000,
  done: 0,
}

export function getRankClassName(months: number): string {
  if (months >= 720) return 'result-rank-rainbow'
  if (months >= 360) return 'text-gradient-rank-gold'
  if (months >= 120) return 'text-gradient-rank-purple'
  if (months >= 60) return 'text-gradient-rank-cyan'
  if (months >= 24) return 'text-gradient-rank-emerald'
  return 'text-gradient-rank-white'
}

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

type AffiliateBannerData = { type: 'affiliate'; href: string; img: string; pixel: string; width: number; height: number }
type SelfBannerData = { type: 'self'; href: string; img: string; title: string }
type AdSlotData = AffiliateBannerData | SelfBannerData

function AdBanner({ ad }: { ad: AdSlotData }) {
  if (ad.type === 'affiliate') {
    return (
      <>
        <span className="text-[10px] text-white/60 block mb-1">PR</span>
        <a href={ad.href} rel="nofollow" target="_blank">
          <img src={ad.img} width={ad.width} height={ad.height} alt="" className="rounded-xl opacity-80 hover:opacity-100 transition-opacity" />
        </a>
        <img src={ad.pixel} width="1" height="1" alt="" style={{ position: 'absolute', opacity: 0 }} />
      </>
    )
  }
  return (
    <>
      <span className="text-[10px] text-white/60 block mb-1">{ad.title}</span>
      <a href={ad.href} target="_blank" rel="noopener noreferrer">
        <img src={ad.img} width={300} height={250} alt={ad.title} className="rounded-xl opacity-80 hover:opacity-100 transition-opacity object-cover" />
      </a>
    </>
  )
}

export function ResultReveal({
  totalMonths, rankTitle, rankComment, courseName,
  kps, accuracy, maxCombo, audio, particles, onComplete,
}: ResultRevealProps) {
  const [phase, setPhase] = useState<RevealPhase>('label')
  const confettiTimer = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    const idx = PHASES.indexOf(phase)
    if (phase === 'done') return
    const delay = PHASE_DELAYS[phase]
    const t = setTimeout(() => setPhase(PHASES[idx + 1]), delay)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'label' || phase === 'months' || phase === 'comment') audio.revealStep()
    if (phase === 'rank') audio.revealRank()
    if (phase === 'done') {
      audio.revealFanfare()
      particles?.confetti(120)
      confettiTimer.current = setTimeout(() => particles?.confetti(60), 500)
    }
    return () => {
      if (confettiTimer.current) clearTimeout(confettiTimer.current)
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
      'https://ses-typing.pages.dev',
    ].join('\n')
    const url = `https://x.com/intent/post?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [totalMonths, rankTitle, rankComment, courseName, kps, accuracy, maxCombo])

  const phaseIdx = PHASES.indexOf(phase)
  const rankClass = getRankClassName(totalMonths)

  const ALL_AFFILIATES: AffiliateBannerData[] = [
    {
      type: 'affiliate',
      href: 'https://px.a8.net/svt/ejp?a8mat=4AZS0W+6LJZ5E+50+2HQ0V5',
      img: 'https://www21.a8.net/svt/bgt?aid=260330144399&wid=001&eno=01&mid=s00000000018015070000&mc=1',
      pixel: 'https://www17.a8.net/0.gif?a8mat=4AZS0W+6LJZ5E+50+2HQ0V5',
      width: 200, height: 200,
    },
    {
      type: 'affiliate',
      href: 'https://px.a8.net/svt/ejp?a8mat=4AZS0W+8FN3AQ+4LXM+5ZMCH',
      img: 'https://www29.a8.net/svt/bgt?aid=260330144510&wid=001&eno=01&mid=s00000021505001006000&mc=1',
      pixel: 'https://www13.a8.net/0.gif?a8mat=4AZS0W+8FN3AQ+4LXM+5ZMCH',
      width: 300, height: 250,
    },
    {
      type: 'affiliate',
      href: 'https://px.a8.net/svt/ejp?a8mat=4AZS0W+7LVF1U+1N1U+68EPD',
      img: 'https://www21.a8.net/svt/bgt?aid=260330144460&wid=001&eno=01&mid=s00000007653001047000&mc=1',
      pixel: 'https://www16.a8.net/0.gif?a8mat=4AZS0W+7LVF1U+1N1U+68EPD',
      width: 300, height: 250,
    },
    {
      type: 'affiliate',
      href: 'https://px.a8.net/svt/ejp?a8mat=4AZS0W+7MGUNM+4LJQ+5Z6WX',
      img: 'https://www27.a8.net/svt/bgt?aid=260330144461&wid=001&eno=01&mid=s00000021455001004000&mc=1',
      pixel: 'https://www17.a8.net/0.gif?a8mat=4AZS0W+7MGUNM+4LJQ+5Z6WX',
      width: 300, height: 250,
    },
    {
      type: 'affiliate',
      href: 'https://px.a8.net/svt/ejp?a8mat=4AZS0W+8G8IWI+3TVC+BXYE9',
      img: 'https://www22.a8.net/svt/bgt?aid=260330144511&wid=001&eno=01&mid=s00000017868002006000&mc=1',
      pixel: 'https://www14.a8.net/0.gif?a8mat=4AZS0W+8G8IWI+3TVC+BXYE9',
      width: 300, height: 250,
    },
    {
      type: 'affiliate',
      href: 'https://px.a8.net/svt/ejp?a8mat=4AZS0W+8TC27M+5R1M+62MDD',
      img: 'https://www23.a8.net/svt/bgt?aid=260330144533&wid=001&eno=01&mid=s00000026833001020000&mc=1',
      pixel: 'https://www12.a8.net/0.gif?a8mat=4AZS0W+8TC27M+5R1M+62MDD',
      width: 300, height: 250,
    },
    {
      type: 'affiliate',
      href: 'https://px.a8.net/svt/ejp?a8mat=4AZS0W+9FYJ76+5EO2+5ZEMP',
      img: 'https://www22.a8.net/svt/bgt?aid=260330144571&wid=001&eno=01&mid=s00000025229001005000&mc=1',
      pixel: 'https://www13.a8.net/0.gif?a8mat=4AZS0W+9FYJ76+5EO2+5ZEMP',
      width: 300, height: 250,
    },
    {
      type: 'affiliate',
      href: 'https://px.a8.net/svt/ejp?a8mat=4AZS0W+8TXHTE+2OM2+103Q4H',
      img: 'https://www24.a8.net/svt/bgt?aid=260330144534&wid=001&eno=01&mid=s00000012521006064000&mc=1',
      pixel: 'https://www13.a8.net/0.gif?a8mat=4AZS0W+8TXHTE+2OM2+103Q4H',
      width: 300, height: 250,
    },
    {
      type: 'affiliate',
      href: 'https://px.a8.net/svt/ejp?a8mat=4B1BLK+33XIIA+5KF0+5Z6WX',
      img: 'https://www20.a8.net/svt/bgt?aid=260402168188&wid=001&eno=01&mid=s00000025974001004000&mc=1',
      pixel: 'https://www18.a8.net/0.gif?a8mat=4B1BLK+33XIIA+5KF0+5Z6WX',
      width: 300, height: 250,
    },
  ]

  const SELF_PRODUCTS: SelfBannerData[] = [
    {
      type: 'self',
      href: 'https://10half.jp/kaetao.html',
      img: 'https://10half.jp/kaetao-og.png',
      title: 'かえたお',
    },
    {
      type: 'self',
      href: 'https://10half.jp/classictimer.html',
      img: 'https://10half.jp/classictimer-og.png',
      title: 'ClassicTimer',
    },
  ]

  // ランダムに2件選択（30%の確率で片方を自社プロダクトに）
  const [adLeft, adRight] = useMemo<[AdSlotData, AdSlotData]>(() => {
    const shuffledAff = [...ALL_AFFILIATES].sort(() => Math.random() - 0.5)
    const shuffledSelf = [...SELF_PRODUCTS].sort(() => Math.random() - 0.5)
    if (Math.random() < 0.3) {
      // 左右どちらかを自社プロダクトに
      return Math.random() < 0.5
        ? [shuffledSelf[0], shuffledAff[0]]
        : [shuffledAff[0], shuffledSelf[0]]
    }
    return [shuffledAff[0], shuffledAff[1]]
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[8000] flex items-center justify-center gap-8 bg-black/90 backdrop-blur-sm cursor-pointer px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={handleSkip}
    >
      {/* 左広告 + 中央コンテンツ + 右広告 */}
      {phaseIdx >= 4 && (
        <motion.div
          className="hidden xl:flex flex-col items-center justify-center shrink-0 z-[8001]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
        >
          <AdBanner ad={adLeft} />
        </motion.div>
      )}

      <div className="text-center px-6 max-w-[480px] w-full shrink-0" onClick={e => e.stopPropagation()}>
        <AnimatePresence>
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

          {phaseIdx >= 2 && (
            <motion.div
              key="rank"
              variants={rankVariants}
              initial="hidden"
              animate="visible"
              className={`text-[28px] font-extrabold mb-3 ${rankClass}`}
            >
              {rankTitle}
            </motion.div>
          )}

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

      {phaseIdx >= 4 && (
        <motion.div
          className="hidden xl:flex flex-col items-center justify-center shrink-0 z-[8001]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
        >
          <AdBanner ad={adRight} />
        </motion.div>
      )}
    </motion.div>
  )
}
