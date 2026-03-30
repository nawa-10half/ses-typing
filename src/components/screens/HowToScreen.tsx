import { motion } from 'framer-motion'
import { Card } from '../ui/Card.tsx'
import { useGameStore } from '../../stores/gameStore.ts'

const steps = [
  {
    emoji: '🎯',
    title: 'コースを選ぶ',
    desc: '初級・中級・上級の3コースから選択。難易度が上がるほど制限時間がシビアに！',
  },
  {
    emoji: '⌨️',
    title: '表示された単語をローマ字で入力',
    desc: '画面に表示されるSES用語を、ローマ字でタイピング。ひらがな表記の読みに合わせて入力してください。',
  },
  {
    emoji: '⏱️',
    title: '制限時間に注意',
    desc: '全体の制限時間と、単語ごとの制限時間があります。正解するとタイムボーナスで時間が回復！',
  },
  {
    emoji: '🔥',
    title: 'コンボを繋げよう',
    desc: '連続正解でコンボが発生。コンボが高いほどスコアにボーナスが乗ります。ミスタイプするとコンボがリセット！',
  },
  {
    emoji: '📊',
    title: '結果発表',
    desc: 'スコア・正確率・最大コンボ・タイピング速度などの成績を確認。称号とランキングで腕前を競おう！',
  },
]

export function HowToScreen() {
  const setScreen = useGameStore(s => s.setScreen)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card>
        <button
          onClick={() => setScreen('title')}
          className="text-[13px] text-white/40 hover:text-white/70 transition-colors mb-6 cursor-pointer"
        >
          ← タイトルに戻る
        </button>

        <h1 className="text-[20px] font-bold text-white mb-6">遊び方</h1>

        <div className="flex flex-col gap-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex gap-3 backdrop-blur-sm bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3"
            >
              <span className="text-[24px] shrink-0 mt-0.5">{step.emoji}</span>
              <div>
                <p className="text-[14px] font-semibold text-white/90">
                  <span className="text-accent mr-1.5">STEP {i + 1}</span>
                  {step.title}
                </p>
                <p className="text-[12px] text-white/50 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 backdrop-blur-sm bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3">
          <p className="text-[14px] font-semibold text-white/90 mb-2">💡 ヒント</p>
          <ul className="text-[12px] text-white/50 flex flex-col gap-1.5 leading-relaxed">
            <li>・「し」は「si」「shi」「ci」など複数の入力方法に対応しています</li>
            <li>・「ん」は文脈に応じて「n」「nn」どちらでもOK</li>
            <li>・右上のアイコンからサウンドのON/OFFを切り替えられます</li>
          </ul>
        </div>

        <button
          onClick={() => setScreen('title')}
          className="
            mt-6 w-full py-3 rounded-xl text-[14px] font-semibold
            bg-accent/20 text-accent border border-accent/30
            hover:bg-accent/30 transition-all cursor-pointer
          "
        >
          コース選択に戻る
        </button>
      </Card>
    </motion.div>
  )
}
