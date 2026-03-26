export class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  enabled = true
  private initialized = false

  init(): void {
    if (this.initialized) return
    try {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.25
      this.masterGain.connect(this.ctx.destination)
      this.initialized = true
    } catch {
      this.enabled = false
    }
  }

  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume()
  }

  toggle(): boolean {
    this.enabled = !this.enabled
    return this.enabled
  }

  private _tone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.3, delay = 0): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return
    const t = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + duration)
    osc.connect(g)
    g.connect(this.masterGain)
    osc.start(t)
    osc.stop(t + duration)
  }

  private _noise(duration: number, gain = 0.1, delay = 0): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return
    const t = this.ctx.currentTime + delay
    const bufferSize = this.ctx.sampleRate * duration
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + duration)
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1000
    src.connect(filter)
    filter.connect(g)
    g.connect(this.masterGain)
    src.start(t)
    src.stop(t + duration)
  }

  keyPress(): void {
    this._tone(600 + Math.random() * 400, 0.04, 'square', 0.12)
    this._noise(0.02, 0.06)
  }

  correct(): void {
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((f, i) => this._tone(f, 0.18, 'sine', 0.2, i * 0.07))
  }

  wrong(): void {
    this._tone(220, 0.25, 'sawtooth', 0.12)
    this._tone(180, 0.3, 'square', 0.08, 0.05)
  }

  wrongKey(): void {
    this._tone(200, 0.08, 'square', 0.08)
  }

  timeout(): void {
    this._tone(150, 0.35, 'triangle', 0.15)
    this._noise(0.15, 0.05, 0.1)
  }

  combo(level: number): void {
    const base = 523 + Math.min(level, 12) * 40
    ;[base, base * 1.25, base * 1.5].forEach((f, i) =>
      this._tone(f, 0.1, 'sine', 0.15, i * 0.05),
    )
  }

  stageClear(): void {
    ;[523, 659, 784, 1047].forEach((f, i) =>
      this._tone(f, 0.3, 'sine', 0.2, i * 0.12),
    )
    this._noise(0.1, 0.04, 0.5)
  }

  // Bonus mode: BSOD beep (3 short beeps)
  bsodBeep(): void {
    for (let i = 0; i < 3; i++) {
      this._tone(800, 0.08, 'square', 0.25, i * 0.12)
    }
  }

  // Bonus mode: CRT power-off "プチュン" sound
  bonusBlackout(): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return
    const t = this.ctx.currentTime

    // High-frequency sweep down (the "プチュ" part)
    const sweep = this.ctx.createOscillator()
    const sweepGain = this.ctx.createGain()
    sweep.type = 'sine'
    sweep.frequency.setValueAtTime(4000, t)
    sweep.frequency.exponentialRampToValueAtTime(80, t + 0.15)
    sweepGain.gain.setValueAtTime(0.25, t)
    sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
    sweep.connect(sweepGain)
    sweepGain.connect(this.masterGain)
    sweep.start(t)
    sweep.stop(t + 0.25)

    // CRT flyback whine (the "ン" resonance)
    this._tone(2400, 0.3, 'sine', 0.06, 0.05)
    this._tone(1200, 0.15, 'triangle', 0.04, 0.08)

    // Brief static burst
    this._noise(0.08, 0.12, 0)
    // Residual hum
    this._tone(60, 0.5, 'sine', 0.03, 0.15)
  }

  // Bonus mode: flashy intro jingle (pachislot-like fanfare)
  bonusIntro(): void {
    const fanfare = [784, 988, 1175, 1319, 1568, 1319, 1568, 2093]
    fanfare.forEach((f, i) => this._tone(f, 0.2, 'sine', 0.22, i * 0.1))
    // Sparkle layer
    ;[1568, 2093, 2637].forEach((f, i) => this._tone(f, 0.4, 'sine', 0.08, 0.8 + i * 0.06))
    // Bass hit
    this._tone(131, 0.5, 'triangle', 0.2, 0.0)
    this._tone(165, 0.5, 'triangle', 0.15, 0.4)
  }

  // Bonus mode: correct answer (extra dramatic)
  bonusCorrect(): void {
    ;[784, 988, 1175, 1568].forEach((f, i) =>
      this._tone(f, 0.25, 'sine', 0.22, i * 0.06))
    this._tone(131, 0.3, 'triangle', 0.15)
    this._noise(0.08, 0.06, 0.3)
  }

  // Bonus mode: outro (returning to normal)
  bonusOutro(): void {
    ;[1568, 1319, 1175, 988, 784].forEach((f, i) =>
      this._tone(f, 0.3, 'sine', 0.15, i * 0.12))
    this._tone(262, 0.6, 'triangle', 0.1, 0.6)
  }

  // Result reveal: step sound (each item appears)
  revealStep(): void {
    this._tone(880, 0.08, 'sine', 0.2)
    this._tone(1320, 0.06, 'sine', 0.1, 0.03)
  }

  // Result reveal: rank appears (dramatic hit)
  revealRank(): void {
    this._tone(523, 0.3, 'sine', 0.25)
    this._tone(784, 0.25, 'sine', 0.2, 0.05)
    this._tone(1047, 0.2, 'sine', 0.15, 0.1)
    this._noise(0.06, 0.08)
  }

  // Result reveal: fanfare "テケテテケテテーン"
  revealFanfare(): void {
    // テケテ
    const run1 = [784, 988, 784, 988]
    run1.forEach((f, i) => this._tone(f, 0.08, 'sine', 0.2, i * 0.07))
    // テケテ
    const run2 = [1047, 1319, 1047, 1319]
    run2.forEach((f, i) => this._tone(f, 0.08, 'sine', 0.22, 0.32 + i * 0.07))
    // テーン！ (final chord)
    this._tone(1568, 0.6, 'sine', 0.3, 0.62)
    this._tone(1047, 0.6, 'sine', 0.2, 0.62)
    this._tone(784, 0.6, 'sine', 0.15, 0.62)
    // Sparkle
    ;[2093, 2637, 3136].forEach((f, i) =>
      this._tone(f, 0.3, 'sine', 0.08, 0.65 + i * 0.05))
  }

  gameComplete(): void {
    const melody = [523, 659, 784, 1047, 784, 1047, 1319]
    melody.forEach((f, i) => this._tone(f, 0.35, 'sine', 0.2, i * 0.15))
    ;[523, 784, 1047].forEach(f => this._tone(f, 0.8, 'sine', 0.1, 0.9))
  }
}
