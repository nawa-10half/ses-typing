import { useRef } from 'react'
import { useParticleSystem } from '../../hooks/useParticleSystem.ts'

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useParticleSystem(canvasRef)

  // Expose particles to parent via window for cross-component access
  ;(window as unknown as Record<string, unknown>).__particles = particles

  return <canvas ref={canvasRef} id="particle-canvas" />
}

export function useParticles() {
  return (window as unknown as Record<string, unknown>).__particles as ReturnType<typeof useParticleSystem> | undefined
}
