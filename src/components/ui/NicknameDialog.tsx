import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface NicknameDialogProps {
  defaultValue: string
  onSubmit: (nickname: string) => void
}

export function NicknameDialog({ defaultValue, onSubmit }: NicknameDialogProps) {
  const [value, setValue] = useState(defaultValue === '匿名' ? '' : defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    const name = value.trim() || '匿名'
    onSubmit(name)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-white/[0.06] backdrop-blur-md rounded-xl p-5 mb-6 border border-white/[0.1]"
    >
      <p className="text-[10px] text-white/40 tracking-widest mb-3">ENTER YOUR NAME</p>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="匿名"
          maxLength={20}
          className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2
            text-sm text-white placeholder-white/30
            focus:outline-none focus:border-white/30 transition-colors"
        />
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-indigo-500/80 hover:bg-indigo-500 text-white text-sm font-semibold
            rounded-lg transition-colors cursor-pointer"
        >
          送信
        </button>
      </div>
    </motion.div>
  )
}
