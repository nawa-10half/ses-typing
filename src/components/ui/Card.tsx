import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        backdrop-blur-xl bg-white/5 border border-white/10
        shadow-2xl shadow-black/20
        p-8 pb-10 text-center
        ${className}
      `}
    >
      {/* Top glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
