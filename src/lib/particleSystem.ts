interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  gravity: number
  friction: number
  type: 'circle' | 'rect'
  rotation: number
  rotationSpeed: number
}

interface SpawnOpts {
  x?: number
  y?: number
  vx?: number
  vy?: number
  life?: number
  size?: number
  color?: string
  gravity?: number
  friction?: number
  type?: 'circle' | 'rect'
  rotation?: number
  rotationSpeed?: number
}

interface BurstOpts {
  speed?: number
  life?: number
  size?: number
  color?: string
  colors?: string[]
  gravity?: number
  friction?: number
  type?: 'circle' | 'rect'
}

export class ParticleSystem {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private particles: Particle[] = []
  private dpr: number
  private w = 0
  private h = 0
  private _raf = 0
  private _lastTime = 0
  private _isDark: () => boolean

  constructor(canvas: HTMLCanvasElement, isDark: () => boolean) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.dpr = window.devicePixelRatio || 1
    this._isDark = isDark
    this.resize()
    window.addEventListener('resize', () => this.resize())
    this.loop(0)
  }

  resize(): void {
    const w = window.innerWidth
    const h = window.innerHeight
    this.canvas.width = w * this.dpr
    this.canvas.height = h * this.dpr
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = h + 'px'
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.w = w
    this.h = h
  }

  spawn(opts: SpawnOpts): void {
    this.particles.push({
      x: opts.x ?? 0,
      y: opts.y ?? 0,
      vx: opts.vx ?? 0,
      vy: opts.vy ?? 0,
      life: opts.life ?? 1,
      maxLife: opts.life ?? 1,
      size: opts.size ?? 3,
      color: opts.color ?? '#fff',
      gravity: opts.gravity ?? 0,
      friction: opts.friction ?? 0.98,
      type: opts.type ?? 'circle',
      rotation: opts.rotation ?? 0,
      rotationSpeed: opts.rotationSpeed ?? 0,
    })
  }

  burst(x: number, y: number, count: number, opts: BurstOpts = {}): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5
      const speed = (opts.speed ?? 3) * (0.5 + Math.random())
      this.spawn({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: (opts.life ?? 0.8) + Math.random() * 0.3,
        size: (opts.size ?? 4) * (0.5 + Math.random() * 0.5),
        color: opts.colors
          ? opts.colors[Math.floor(Math.random() * opts.colors.length)]
          : (opts.color ?? '#fff'),
        gravity: opts.gravity ?? 0.08,
        friction: opts.friction ?? 0.97,
        type: opts.type ?? 'circle',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      })
    }
  }

  confetti(count = 100): void {
    const colors = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#06b6d4']
    for (let i = 0; i < count; i++) {
      this.spawn({
        x: Math.random() * this.w,
        y: -10 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        life: 2 + Math.random() * 2,
        size: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.04,
        friction: 0.995,
        type: 'rect',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
      })
    }
  }

  emitCorrect(x: number, y: number): void {
    this.burst(x, y, 30, {
      colors: ['#1D9E75', '#34d399', '#6ee7b7', '#a7f3d0', '#10b981'],
      speed: 5, life: 0.8, size: 6, gravity: 0.1,
    })
    // Extra sparkle ring
    this.burst(x, y, 8, {
      colors: ['#ffffff', '#d1fae5'],
      speed: 2, life: 0.5, size: 2, gravity: 0.02,
    })
  }

  emitWrong(x: number, y: number): void {
    this.burst(x, y, 15, {
      colors: ['#E24B4A', '#f87171', '#fca5a5'],
      speed: 3, life: 0.5, size: 4, gravity: 0.08,
    })
  }

  emitCombo(x: number, y: number, level: number): void {
    const count = 25 + level * 3
    const colors = level >= 80
      ? ['#a855f7', '#c084fc', '#e879f9', '#f0abfc', '#ec4899', '#f43f5e']
      : level >= 50
        ? ['#ef4444', '#f97316', '#f59e0b', '#ec4899']
        : level >= 30
          ? ['#ef4444', '#f97316', '#f59e0b']
          : ['#f59e0b', '#fbbf24', '#fde68a']
    this.burst(x, y, count, { colors, speed: 4 + level * 0.05, life: 0.9, size: 5, gravity: 0.08 })
  }

  emitScreenFlash(): void {
    for (let i = 0; i < 40; i++) {
      this.spawn({
        x: Math.random() * this.w,
        y: Math.random() * this.h * 0.6,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 1 + 0.5,
        life: 1 + Math.random() * 1.5,
        size: 2 + Math.random() * 3,
        color: ['#a855f7', '#c084fc', '#818cf8', '#e879f9'][Math.floor(Math.random() * 4)],
        gravity: 0.02, friction: 0.99,
        type: 'circle', rotation: 0, rotationSpeed: 0,
      })
    }
  }

  // Gold rain for bonus mode — call repeatedly during active phase
  emitBonusGoldRain(): void {
    if (this.particles.length > 300) return
    for (let i = 0; i < 3; i++) {
      const colors = ['#fbbf24', '#f59e0b', '#fde68a', '#d97706', '#fffbeb']
      this.spawn({
        x: Math.random() * this.w,
        y: -10 - Math.random() * 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 1.5 + Math.random() * 2,
        life: 2.5 + Math.random() * 2,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.03,
        friction: 0.998,
        type: 'rect',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.12,
      })
    }
  }

  // Big burst for bonus intro — gold explosion
  emitBonusIntro(x: number, y: number): void {
    const colors = ['#fbbf24', '#f59e0b', '#fde68a', '#d97706', '#fff', '#fef3c7']
    this.burst(x, y, 80, {
      colors, speed: 8, life: 1.5, size: 7, gravity: 0.06, friction: 0.96,
    })
    // Sparkle ring
    this.burst(x, y, 30, {
      colors: ['#fff', '#fde68a', '#fbbf24'],
      speed: 3, life: 1.0, size: 2, gravity: 0.01,
    })
  }

  // Bonus correct — gold + rainbow burst
  emitBonusCorrect(x: number, y: number): void {
    const colors = ['#fbbf24', '#f59e0b', '#fde68a', '#34d399', '#818cf8', '#f472b6']
    this.burst(x, y, 50, {
      colors, speed: 6, life: 1.2, size: 6, gravity: 0.08,
    })
    this.burst(x, y, 20, {
      colors: ['#fff', '#fef3c7'],
      speed: 2.5, life: 0.6, size: 2, gravity: 0.02,
    })
  }

  emitAmbient(): void {
    if (this.particles.length > 150) return
    this.spawn({
      x: Math.random() * this.w,
      y: this.h + 5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(0.3 + Math.random() * 0.5),
      life: 4 + Math.random() * 4,
      size: 1.5 + Math.random() * 2,
      color: 'var-ambient',
      gravity: -0.005,
      friction: 1,
      type: 'circle',
    })
  }

  private loop(timestamp: number): void {
    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.05)
    this._lastTime = timestamp
    this.ctx.clearRect(0, 0, this.w, this.h)

    const isDark = this._isDark()

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= dt
      if (p.life <= 0) { this.particles.splice(i, 1); continue }

      p.vx *= p.friction
      p.vy *= p.friction
      p.vy += p.gravity
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.rotationSpeed

      const alpha = Math.min(1, p.life / (p.maxLife * 0.3))
      let color = p.color
      if (color === 'var-ambient') {
        color = isDark ? `rgba(255,255,255,${0.06 * alpha})` : `rgba(0,0,0,${0.04 * alpha})`
      } else {
        this.ctx.globalAlpha = alpha
      }

      this.ctx.fillStyle = color

      if (p.type === 'circle') {
        this.ctx.beginPath()
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        this.ctx.fill()
      } else if (p.type === 'rect') {
        this.ctx.save()
        this.ctx.translate(p.x, p.y)
        this.ctx.rotate(p.rotation)
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        this.ctx.restore()
      }

      this.ctx.globalAlpha = 1
    }

    this._raf = requestAnimationFrame(t => this.loop(t))
  }

  destroy(): void {
    cancelAnimationFrame(this._raf)
  }
}
