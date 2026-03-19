interface Metric {
  label: string
  value: string | number
  large?: boolean
}

interface MetricGridProps {
  metrics: Metric[]
}

export function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-8">
      {metrics.map(m => (
        <div
          key={m.label}
          className="bg-white/[0.03] backdrop-blur-sm rounded-xl py-3.5 px-2 border border-white/[0.06]"
        >
          <p className="text-[9px] text-white/40 tracking-widest mb-1">{m.label}</p>
          <p className={`font-semibold ${m.large ? 'text-xl' : 'text-lg'}`}>{m.value}</p>
        </div>
      ))}
    </div>
  )
}
