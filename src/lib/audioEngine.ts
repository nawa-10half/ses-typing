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

  gameComplete(): void {
    const melody = [523, 659, 784, 1047, 784, 1047, 1319]
    melody.forEach((f, i) => this._tone(f, 0.35, 'sine', 0.2, i * 0.15))
    ;[523, 784, 1047].forEach(f => this._tone(f, 0.8, 'sine', 0.1, 0.9))
  }
}
