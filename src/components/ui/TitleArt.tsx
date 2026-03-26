const buildings = [
  { w: 20, h: 80 }, { w: 30, h: 120, lit: true }, { w: 18, h: 60 },
  { w: 35, h: 150, lit: true }, { w: 22, h: 90 }, { w: 28, h: 130, lit: true },
  { w: 40, h: 160 }, { w: 15, h: 70 }, { w: 32, h: 140, lit: true },
  { w: 20, h: 85 }, { w: 25, h: 110, lit: true }, { w: 35, h: 145 },
  { w: 18, h: 75 }, { w: 22, h: 100, lit: true },
]

export function TitleArt() {
  return (
    <div className="relative w-full max-w-[540px] mx-auto overflow-hidden rounded-xl py-8">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117] via-[#0a1628] to-[#0f1f3a]" />

      {/* グロー */}
      <div className="absolute top-[30px] left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-[#4488ff] rounded-full blur-[40px] opacity-15" />
      <div className="absolute top-[10px] right-[30px] w-[150px] h-[150px] bg-[#44ff88] rounded-full blur-[40px] opacity-15" />

      {/* スカイライン */}
      <div className="absolute bottom-0 left-0 right-0 h-[120px] flex items-end justify-center gap-[3px] opacity-40">
        {buildings.map((b, i) => (
          <div
            key={i}
            className="relative"
            style={{
              width: b.w,
              height: Math.min(b.h, 100),
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
      <div className="relative z-10 text-center">
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
    </div>
  )
}
