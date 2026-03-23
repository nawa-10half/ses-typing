import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../ui/Card.tsx'
import { Button } from '../ui/Button.tsx'
import { MetricGrid } from '../ui/MetricGrid.tsx'
import { SpeedChart } from '../ui/SpeedChart.tsx'
import { HighScoreList } from '../ui/HighScoreList.tsx'
import { WordLog } from '../ui/WordLog.tsx'
import { RankingBoard } from '../ui/RankingBoard.tsx'
import { NicknameDialog } from '../ui/NicknameDialog.tsx'
import { showToast } from '../ui/Toast.tsx'
import { useGameStore } from '../../stores/gameStore.ts'
import { useCourses } from '../../hooks/useCourses.ts'
import { submitScore } from '../../lib/api.ts'
import type { AudioEngine } from '../../lib/audioEngine.ts'
import { useParticles } from '../canvas/ParticleCanvas.tsx'

interface ResultScreenProps {
  audio: AudioEngine
}

export function ResultScreen({ audio }: ResultScreenProps) {
  const getResults = useGameStore(s => s.getResults)
  const saveScore = useGameStore(s => s.saveScore)
  const startGame = useGameStore(s => s.startGame)
  const setScreen = useGameStore(s => s.setScreen)
  const setNickname = useGameStore(s => s.setNickname)
  const activeCourseId = useGameStore(s => s.activeCourseId)
  const player = useGameStore(s => s.player)
  const particles = useParticles()
  const { courses } = useCourses()

  const results = useMemo(() => getResults(), []) // eslint-disable-line react-hooks/exhaustive-deps
  const activeCourse = courses.find(c => c.id === activeCourseId)
  const courseName = activeCourse?.name ?? ''

  const [submitted, setSubmitted] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [globalRank, setGlobalRank] = useState<number | null>(null)

  useEffect(() => {
    audio.gameComplete()
    setTimeout(() => particles?.confetti(120), 300)
    setTimeout(() => particles?.confetti(60), 800)

    saveScore({
      score: results.score,
      accuracy: results.accuracy,
      combo: results.maxCombo,
      date: new Date().toISOString().slice(0, 10),
      courseId: activeCourseId ?? undefined,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNicknameSubmit = useCallback((nickname: string) => {
    setNickname(nickname)
    setSubmitted(true)

    submitScore({
      playerId: player.id,
      nickname,
      score: results.score,
      accuracy: results.accuracy,
      maxCombo: results.maxCombo,
      totalTime: results.totalTime,
      rankTitle: results.rank.rank,
      courseId: results.courseId,
      kps: results.kps,
    }).then(res => {
      setSubmittedId(res.id)
      setGlobalRank(res.globalRank)
    }).catch(() => {
      // オフラインでも問題なし
    })
  }, [player.id, results, setNickname])

  const handleRetry = () => {
    if (activeCourse) startGame(activeCourse)
  }

  const handleShare = () => {
    const lines = [
      '\uD83C\uDFAE SESタイピング 〜あの案件に常駐せよ〜',
      `\uD83D\uDCCB ${courseName}`,
      '',
      `\uD83C\uDFC6 ${results.rank.rank}`,
      `\uD83D\uDCCA Score: ${results.score}`,
      `\u26A1 Speed: ${results.kps} 打/秒`,
      `\uD83C\uDFAF Accuracy: ${results.accuracy}%`,
      `\uD83D\uDD25 Max Combo: ${results.maxCombo}`,
    ]
    if (globalRank) lines.push(`\uD83C\uDF0D Global Rank: #${globalRank}`)
    lines.push('', '#SESタイピング #タイピングゲーム')

    navigator.clipboard.writeText(lines.join('\n')).then(
      () => showToast('クリップボードにコピーしました'),
      () => showToast('コピーに失敗しました'),
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card>
        <p className="text-[10px] text-white/40 tracking-[3px] uppercase mb-2">
          {courseName}
        </p>
        <h2 className="text-[32px] font-extrabold animate-stage-title text-gradient-rank animate-neon-pulse">
          {results.rank.rank}
        </h2>
        <p className="text-[13px] text-white/50 leading-[1.9] mb-6 mt-2">
          {results.rank.comment}
        </p>

        <MetricGrid
          metrics={[
            { label: 'SCORE', value: results.score, large: true },
            { label: 'SPEED', value: `${results.kps} 打/秒`, large: true },
            { label: 'ACCURACY', value: `${results.accuracy}%`, large: true },
            { label: 'MAX COMBO', value: results.maxCombo, large: true },
          ]}
        />

        <SpeedChart log={results.log} />

        {!submitted ? (
          <NicknameDialog defaultValue={player.nickname} onSubmit={handleNicknameSubmit} />
        ) : (
          <RankingBoard courseId={activeCourseId ?? undefined} highlightPlayerId={submittedId ?? undefined} />
        )}

        <HighScoreList currentScore={results.score} />
        <WordLog log={results.log} />

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleShare}>
              シェア
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleRetry}>
              もう一度 →
            </Button>
          </div>
          <button
            onClick={() => setScreen('title')}
            className="text-xs text-white/40 hover:text-white/60 transition-colors py-2 cursor-pointer"
          >
            コース選択に戻る
          </button>
        </div>
      </Card>
    </motion.div>
  )
}
