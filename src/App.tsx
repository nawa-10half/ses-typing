import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ParticleCanvas } from './components/canvas/ParticleCanvas.tsx'
import { ControlBar } from './components/ui/ControlBar.tsx'
import { ToastContainer } from './components/ui/Toast.tsx'
import { TitleScreen } from './components/screens/TitleScreen.tsx'
import { PlayScreen } from './components/screens/PlayScreen.tsx'
import { ResultScreen } from './components/screens/ResultScreen.tsx'
import { PrivacyScreen } from './components/screens/PrivacyScreen.tsx'
import { HowToScreen } from './components/screens/HowToScreen.tsx'
import { useAudioEngine } from './hooks/useAudioEngine.ts'
import { useScreen, useGameStore } from './stores/gameStore.ts'

declare global {
  interface Window { adsbygoogle: unknown[] }
}

function AdBanner() {
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    pushed.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch { /* ad blocker */ }
  }, [])

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', maxHeight: '90px', overflow: 'hidden' }}
      data-ad-client="ca-pub-4773362073066777"
      data-ad-slot="3879802428"
      data-ad-format="horizontal"
      data-full-width-responsive="false"
    />
  )
}

export default function App() {
  const screen = useScreen()
  const theme = useGameStore(s => s.theme)
  const audio = useAudioEngine()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className={`
      min-h-screen flex items-start justify-center
      px-4 pt-8 pb-[120px] overflow-x-hidden relative
      bg-mesh
      ${theme === 'dark' ? 'bg-bg-dark text-white' : 'bg-bg-light text-gray-900'}
    `}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />

      <div className="crt-scanlines" />
      <ParticleCanvas />
      <ControlBar audio={audio} />

      <div className="w-full max-w-[580px] relative z-10">
        <AnimatePresence mode="wait">
          {screen === 'title' && <TitleScreen key="title" />}
          {screen === 'play' && <PlayScreen key="play" audio={audio} />}
          {screen === 'result' && <ResultScreen key="result" audio={audio} />}
          {screen === 'privacy' && <PrivacyScreen key="privacy" />}
          {screen === 'howto' && <HowToScreen key="howto" />}
        </AnimatePresence>
      </div>

      <ToastContainer />

      {/* 広告バナーエリア */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center items-center gap-4 bg-black/80 backdrop-blur-sm border-t border-white/[0.06] py-1">
        <div className="shrink-0">
          <AdBanner />
        </div>
      </div>
    </div>
  )
}
