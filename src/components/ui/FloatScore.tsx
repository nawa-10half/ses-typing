import { useState } from 'react'

interface FloatItem {
  id: number
  text: string
}

let nextId = 0

export function useFloatScore() {
  const [items, setItems] = useState<FloatItem[]>([])

  const spawn = (text: string) => {
    const id = nextId++
    setItems(prev => [...prev, { id, text }])
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id))
    }, 800)
  }

  return { items, spawn }
}

export function FloatScoreContainer({ items }: { items: FloatItem[] }) {
  return (
    <>
      {items.map(item => (
        <FloatScoreItem key={item.id} text={item.text} />
      ))}
    </>
  )
}

function FloatScoreItem({ text }: { text: string }) {
  return (
    <span
      className="absolute right-4 -top-2 text-sm font-bold text-emerald-400
        pointer-events-none animate-float-score"
    >
      {text}
    </span>
  )
}
