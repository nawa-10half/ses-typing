import { useEffect, useRef } from 'react'

interface WordDisplayProps {
  word: string
  romaji: string
  typedLength: number
}

export function WordDisplay({ word, romaji, typedLength }: WordDisplayProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.classList.remove('animate-word-entrance')
    void el.offsetWidth
    el.classList.add('animate-word-entrance')
  }, [word])

  return (
    <>
      <div
        ref={ref}
        className="text-4xl font-semibold tracking-[5px] mb-3 min-h-[52px]
          drop-shadow-[0_0_8px_rgba(129,140,248,0.15)]"
      >
        {word}
      </div>
      <div className="text-lg font-mono tracking-wider mb-1 min-h-[28px] break-all leading-relaxed">
        {romaji.split('').map((char, i) => (
          <span
            key={`${word}-${i}`}
            className={`transition-all duration-100 ${
              i < typedLength
                ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]'
                : 'text-white/25'
            }`}
          >
            {char}
          </span>
        ))}
      </div>
    </>
  )
}
