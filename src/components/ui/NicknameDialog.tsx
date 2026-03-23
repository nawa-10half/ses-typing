import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface NicknameDialogProps {
  defaultValue: string
  onSubmit: (nickname: string) => void
}

export function NicknameDialog({ defaultValue, onSubmit }: NicknameDialogProps) {
  const [value, setValue] = useState(defaultValue === '匿名' ? '' : defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleSubmit = () => {
    const name = value.trim() || '匿名'
    onSubmit(name)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[#12121a]/95 backdrop-blur-md rounded-2xl p-6 border border-white/[0.1]
            shadow-[0_0_40px_rgba(0,0,0,0.5)] w-[320px] mx-4"
        >
          <p className="text-[10px] text-white/40 tracking-widest mb-1">RANKING</p>
          <p className="text-lg font-bold text-white mb-4">ニックネームを入力</p>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="匿名"
            maxLength={20}
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2.5
              text-sm text-white placeholder-white/30
              focus:outline-none focus:border-indigo-500/50 transition-colors mb-3"
          />
          <button
            onClick={handleSubmit}
            className="w-full py-2.5 bg-indigo-500/80 hover:bg-indigo-500 text-white text-sm font-semibold
              rounded-lg transition-colors cursor-pointer"
          >
            ランキングに登録
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
