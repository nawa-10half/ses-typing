import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: boolean
}

export function Card({ children, className = '', glow = false }: CardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        backdrop-blur-xl bg-white/[0.06] border border-white/[0.08]
        shadow-2xl shadow-black/30
        p-8 pb-10 text-center
        transition-all duration-300
        hover:shadow-black/40 hover:bg-white/[0.08]
        hover:-translate-y-0.5
        card-glow card-shimmer
        ${glow ? 'animate-card-flash' : ''}
        ${className}
      `}
    >
      {/* Top glow gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none" />
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
