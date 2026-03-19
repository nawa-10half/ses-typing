import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'default' | 'primary'
  full?: boolean
}

export function Button({ children, variant = 'default', full = false, className = '', ...props }: ButtonProps) {
  const base = `
    relative rounded-xl font-mono text-sm cursor-pointer
    transition-all duration-200 active:scale-[0.97]
    backdrop-blur-sm
  `
  const variants = {
    default: `
      bg-white/5 text-white border border-white/20
      hover:bg-white/10 hover:border-white/30
      hover:shadow-lg hover:shadow-white/5
    `,
    primary: `
      bg-white text-[#0a0a0f] border border-transparent font-medium
      hover:opacity-90 hover:shadow-lg hover:shadow-white/10
    `,
  }
  const width = full ? 'w-full py-3.5 text-[15px]' : 'py-3 px-6'

  return (
    <button className={`${base} ${variants[variant]} ${width} ${className}`} {...props}>
      {children}
    </button>
  )
}
