import { motion } from 'framer-motion'
import { Card } from '../ui/Card.tsx'
import { useGameStore } from '../../stores/gameStore.ts'

export function PrivacyScreen() {
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

        <h1 className="text-[20px] font-bold text-white mb-6">プライバシーポリシー</h1>

        <div className="flex flex-col gap-5 text-[13px] text-white/70 leading-relaxed">
          <section>
            <h2 className="text-[15px] font-semibold text-white/90 mb-2">1. 運営者情報</h2>
            <p>本サイト「SESタイピング」（以下「当サイト」）は、10HALF LLC（以下「当社」）が運営するWebサービスです。</p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-white/90 mb-2">2. 収集する情報</h2>
            <p>当サイトでは、以下の情報を取得・利用する場合があります。</p>
            <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
              <li>ニックネーム（ランキング表示のため、任意入力）</li>
              <li>ゲームスコア・プレイデータ（ランキング機能のため）</li>
              <li>Cookie・ローカルストレージ（設定・スコアの保存のため）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-white/90 mb-2">3. 広告について</h2>
            <p>
              当サイトでは、アフィリエイトプログラムを利用した広告を掲載しています。
              広告リンクを経由して商品・サービスの購入等が行われた場合、当社が報酬を受け取ることがあります。
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-white/90 mb-2">4. アクセス解析について</h2>
            <p>
              当サイトでは、Googleによるアクセス解析ツールを使用する場合があります。
              トラフィックデータの収集のためにCookieが使用されますが、
              このデータは匿名で収集されており、個人を特定するものではありません。
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-white/90 mb-2">5. 免責事項</h2>
            <p>
              当サイトのコンテンツや情報について、可能な限り正確な情報を掲載するよう努めておりますが、
              正確性や安全性を保証するものではありません。当サイトの利用により生じた損害等について、
              当社は一切の責任を負いかねますのでご了承ください。
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-semibold text-white/90 mb-2">6. プライバシーポリシーの変更</h2>
            <p>
              本ポリシーの内容は、必要に応じて変更することがあります。
              変更後のプライバシーポリシーは、当サイトに掲載した時点から効力を生じるものとします。
            </p>
          </section>

          <p className="text-white/40 text-[11px] mt-2">制定日: 2025年3月30日</p>
        </div>
      </Card>
    </motion.div>
  )
}
