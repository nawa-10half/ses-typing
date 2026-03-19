import { forwardRef, type InputHTMLAttributes } from 'react'

interface TypeInputProps extends InputHTMLAttributes<HTMLInputElement> {
  state?: 'neutral' | 'correct' | 'wrong'
}

export const TypeInput = forwardRef<HTMLInputElement, TypeInputProps>(
  ({ state = 'neutral', className = '', ...props }, ref) => {
    const stateStyles = {
      neutral: 'border-white/20 focus:border-white focus:shadow-[0_0_0_3px_rgba(255,255,255,0.03)]',
      correct: 'border-emerald-400 animate-pulse-correct',
      wrong: 'border-red-400 animate-shake-miss',
    }

    return (
      <input
        ref={ref}
        type="text"
        lang="en"
        data-form-type="other"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={`
          w-full backdrop-blur-sm bg-white/5 text-white
          border-[1.5px] rounded-xl py-3.5 px-4
          font-mono text-xl text-center outline-none
          transition-all duration-200
          ${stateStyles[state]}
          ${className}
        `}
        {...props}
      />
    )
  },
)

TypeInput.displayName = 'TypeInput'
