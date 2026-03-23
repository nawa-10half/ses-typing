const buildings = [
  { w: 20, h: 80 }, { w: 30, h: 120, lit: true }, { w: 18, h: 60 },
  { w: 35, h: 150, lit: true }, { w: 22, h: 90 }, { w: 28, h: 130, lit: true },
  { w: 40, h: 160 }, { w: 15, h: 70 }, { w: 32, h: 140, lit: true },
  { w: 20, h: 85 }, { w: 25, h: 110, lit: true }, { w: 35, h: 145 },
  { w: 18, h: 75 }, { w: 22, h: 100, lit: true },
]

const windowPattern = [
  'lit', '', 'blue', 'lit', '', 'lit', '', 'blue',
  '', 'lit', 'lit', '', 'blue', '', 'lit', '',
  'lit', '', '', 'lit', 'lit', 'blue', '', 'lit',
  '', 'blue', 'lit', '', '', 'lit', 'lit', '',
]

const persons = [
  { pos: 'left-[60px]', bodyColor: 'bg-[#2a2a3a]' },
  { pos: 'left-[100px]', bodyColor: 'bg-[#3a3a5a]' },
  { pos: 'right-[80px]', bodyColor: 'bg-[#2a2a3a]' },
]

export function TitleArt() {
  return (
    <div className="relative w-full aspect-square max-w-[540px] mx-auto overflow-hidden rounded-xl">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117] via-[#0a1628] to-[#0f1f3a]" />

      {/* グロー */}
      <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-[#4488ff] rounded-full blur-[40px] opacity-15" />
      <div className="absolute top-[20px] right-[30px] w-[150px] h-[150px] bg-[#44ff88] rounded-full blur-[40px] opacity-15" />

      {/* スカイライン */}
      <div className="absolute top-[30px] left-0 right-0 h-[180px] flex items-end justify-center gap-[3px] opacity-60">
        {buildings.map((b, i) => (
          <div
            key={i}
            className="relative"
            style={{
              width: b.w,
              height: b.h,
              background: 'linear-gradient(180deg, #1a5c3a 0%, #0d3320 100%)',
              borderTop: '1px solid #2a8a5a',
            }}
          >
            <div
              className="absolute top-1 left-[3px] right-[3px] bottom-1"
              style={{
                background: `repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(255,200,50,${b.lit ? 0.4 : 0.15}) 6px, rgba(255,200,50,${b.lit ? 0.4 : 0.15}) 8px)`,
                backgroundSize: '100% 10px',
              }}
            />
          </div>
        ))}
      </div>

      {/* タイトル */}
      <div className="relative z-10 text-center mt-[50px]">
        <h1
          className="font-black text-[56px] leading-tight tracking-[4px]"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #88ccff 50%, #4488cc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(2px 3px 0px #0a2040) drop-shadow(0 0 15px rgba(64,160,255,0.4))',
          }}
        >
          SESタイピング
        </h1>
        <p
          className="font-bold text-[22px] mt-2 tracking-[3px]"
          style={{
            color: '#ffdd44',
            textShadow: '0 0 8px rgba(255,200,0,0.5), 2px 2px 0 #3a2a00',
          }}
        >
          〜あの案件に常駐せよ〜
        </p>
      </div>

      {/* オフィスシーン */}
      <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[380px] h-[200px]">
        {/* SES人材 */}
        {persons.map((p, i) => (
          <div key={i} className={`absolute bottom-[22px] ${p.pos} w-[18px] h-[34px] flex flex-col items-center`}>
            <div className="w-[10px] h-[10px] bg-[#ffcc99] rounded-full border border-[#cc9966]" />
            <div className={`w-[14px] h-[16px] ${p.bodyColor} rounded-sm mt-px border border-[#4a4a5a]`} />
            <div className="w-[14px] h-[6px] flex gap-1 mt-px">
              <span className="flex-1 bg-[#2a2a3a] rounded-b-sm" />
              <span className="flex-1 bg-[#2a2a3a] rounded-b-sm" />
            </div>
          </div>
        ))}

        {/* オフィスビル */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[160px] rounded-t border-2 border-b-0 border-[#4a6a8a]"
          style={{ background: 'linear-gradient(180deg, #3a4a5c 0%, #2a3a4c 50%, #1a2a3c 100%)' }}
        >
          {/* ビル名 */}
          <div className="absolute -top-[22px] left-1/2 -translate-x-1/2 text-[11px] text-[#88aacc] tracking-[2px] whitespace-nowrap font-mono">
            客先常駐ビル
          </div>

          {/* 窓 */}
          <div className="grid grid-cols-8 grid-rows-4 gap-[6px] p-[14px_16px] h-[calc(100%-40px)]">
            {windowPattern.map((type, i) => {
              const base = 'rounded-[1px] border '
              if (type === 'lit')
                return <div key={i} className={base + 'border-[#ddaa22] shadow-[0_0_6px_rgba(255,200,50,0.4)]'} style={{ background: 'linear-gradient(180deg, #ffee88, #ffcc44)' }} />
              if (type === 'blue')
                return <div key={i} className={base + 'border-[#3366aa] shadow-[0_0_4px_rgba(100,150,255,0.3)]'} style={{ background: 'linear-gradient(180deg, #88bbff, #4488dd)' }} />
              return <div key={i} className={base + 'bg-[#0a1520] border-[#3a5a7a]'} />
            })}
          </div>

          {/* 入口 */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60px] h-[40px] rounded-t-sm border border-b-0 border-[#4a7aaa]"
            style={{ background: 'linear-gradient(180deg, #1a3050, #0a2040)' }}
          >
            <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] text-[#66aadd] tracking-[2px] font-mono">
              受付
            </div>
          </div>
        </div>

        {/* 道路 */}
        <div className="absolute bottom-0 left-0 right-0 h-[20px] bg-[#2a2a3a] border-t-2 border-[#4a4a5a]">
          <div
            className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2"
            style={{
              background: 'repeating-linear-gradient(90deg, #ffff88, #ffff88 20px, transparent 20px, transparent 40px)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
