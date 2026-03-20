import { motion } from 'framer-motion'
import { Card } from '../ui/Card.tsx'
import { useGameStore } from '../../stores/gameStore.ts'
import { useCourses } from '../../hooks/useCourses.ts'
import type { Course, CourseId } from '../../types/game.ts'

const difficultyBadge: Record<CourseId, { label: string; color: string }> = {
  beginner: { label: '初級', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  intermediate: { label: '中級', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  advanced: { label: '上級', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const defaultBadge = { label: '—', color: 'bg-white/10 text-white/60 border-white/20' }

export function TitleScreen() {
  const startGame = useGameStore(s => s.startGame)
  const { courses } = useCourses()

  const handleSelect = (course: Course) => {
    startGame(course)
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
          SES EXPERIENCE TYPING
        </p>
        <h1 className="text-[36px] font-extrabold mb-3 tracking-tight text-gradient-rank
          drop-shadow-[0_0_20px_rgba(129,140,248,0.2)]">
          SESタイピング
        </h1>
        <p className="text-[13px] text-white/60 leading-[1.9] mb-8">
          SESあるあるの単語を<br />ローマ字で打ち抜け
        </p>

        <div className="flex flex-col gap-3">
          {courses.map(course => {
            const badge = difficultyBadge[course.id] ?? defaultBadge
            return (
              <button
                key={course.id}
                onClick={() => handleSelect(course)}
                className="
                  group relative w-full text-left
                  backdrop-blur-sm bg-white/[0.03] hover:bg-white/[0.08]
                  border border-white/[0.08] hover:border-white/20
                  rounded-xl px-5 py-4
                  transition-all duration-200 cursor-pointer
                  hover:shadow-lg hover:shadow-white/5
                  active:scale-[0.98]
                "
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <div>
                      <p className="text-[15px] font-semibold text-white group-hover:text-white/90">
                        {course.name}
                      </p>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        {course.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-[18px] font-semibold text-white/80">{course.words.length}</p>
                    <p className="text-[9px] text-white/30 tracking-wider">WORDS</p>
                  </div>
                </div>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 text-lg transition-all duration-200 group-hover:translate-x-1">
                  →
                </span>
              </button>
            )
          })}
        </div>
      </Card>
    </motion.div>
  )
}
