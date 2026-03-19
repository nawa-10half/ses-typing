import type { LogEntry } from '../../types/game.ts'

interface WordLogProps {
  log: LogEntry[]
}

export function WordLog({ log }: WordLogProps) {
  return (
    <div className="text-left border-t border-white/[0.08] pt-4 mb-6">
      <p className="text-[10px] text-white/40 tracking-widest mb-2">WORD LOG</p>
      {log.map((l, i) => (
        <div
          key={i}
          className="flex justify-between items-center py-1.5 border-b border-white/[0.06] last:border-b-0 text-[13px] font-medium"
        >
          <span className="flex gap-2 items-center">
            {l.word}
            {l.combo >= 3 && (
              <span className="text-[10px] text-amber-500 font-bold">x{l.combo}</span>
            )}
          </span>
          <span className={l.ok ? 'text-emerald-400' : 'text-red-400'}>
            {l.ok ? `+${l.pts}pts` : 'MISS'}
          </span>
        </div>
      ))}
    </div>
  )
}
