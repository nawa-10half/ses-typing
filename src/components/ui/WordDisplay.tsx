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
        className="text-4xl font-semibold tracking-[5px] mb-3 min-h-[52px]"
      >
        {word}
      </div>
      <div className="text-lg font-mono tracking-wider mb-1 min-h-[28px]">
        {romaji.split('').map((char, i) => (
          <span
            key={`${word}-${i}`}
            className={
              i < typedLength
                ? 'text-emerald-400'
                : 'text-white/30'
            }
          >
            {char}
          </span>
        ))}
      </div>
    </>
  )
}
