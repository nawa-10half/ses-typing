import type { LogEntry } from '../types/game.ts'

export class ChartRenderer {
  static draw(canvas: HTMLCanvasElement, log: LogEntry[], isDark: boolean): void {
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    const W = rect.width
    const H = rect.height

    const times = log.map(l => l.time)
    const maxTime = Math.max(...times, 1000)

    const barW = Math.max(2, (W - 40) / log.length - 2)
    const startX = 30
    const startY = 10
    const chartH = H - 30

    // Y axis
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 0.5
    ctx.font = '9px monospace'
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
    for (let i = 0; i <= 4; i++) {
      const y = startY + (chartH / 4) * i
      ctx.beginPath()
      ctx.moveTo(startX, y)
      ctx.lineTo(W, y)
      ctx.stroke()
      const label = Math.round(maxTime - (maxTime / 4) * i)
      ctx.fillText(label + '', 0, y + 3)
    }

    // Bars
    log.forEach((l, i) => {
      const x = startX + i * ((W - startX) / log.length) + 1
      const h = (l.time / maxTime) * chartH
      const y = startY + chartH - h

      ctx.fillStyle = l.ok
        ? (isDark ? 'rgba(29,158,117,0.7)' : 'rgba(21,128,61,0.7)')
        : (isDark ? 'rgba(226,75,74,0.7)' : 'rgba(220,38,38,0.7)')
      ctx.beginPath()
      ctx.roundRect(x, y, barW, h, [2, 2, 0, 0])
      ctx.fill()
    })

    // Word index labels
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
    ctx.font = '8px monospace'
    const labelInterval = Math.max(1, Math.floor(log.length / 8))
    log.forEach((_, i) => {
      if (i % labelInterval === 0) {
        const x = startX + i * ((W - startX) / log.length) + 1
        ctx.fillText(String(i + 1), x, startY + chartH + 14)
      }
    })
  }
}
