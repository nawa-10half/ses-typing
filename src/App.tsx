import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ParticleCanvas } from './components/canvas/ParticleCanvas.tsx'
import { ControlBar } from './components/ui/ControlBar.tsx'
import { ToastContainer } from './components/ui/Toast.tsx'
import { TitleScreen } from './components/screens/TitleScreen.tsx'
import { PlayScreen } from './components/screens/PlayScreen.tsx'
import { ResultScreen } from './components/screens/ResultScreen.tsx'
import { useAudioEngine } from './hooks/useAudioEngine.ts'
import { useScreen, useGameStore } from './stores/gameStore.ts'

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
      px-4 pt-8 pb-16 overflow-x-hidden relative
      ${theme === 'dark' ? 'bg-bg-dark text-white' : 'bg-bg-light text-gray-900'}
    `}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <ParticleCanvas />
      <ControlBar audio={audio} />

      <div className="w-full max-w-[580px] relative z-10">
        <AnimatePresence mode="wait">
          {screen === 'title' && <TitleScreen key="title" />}
          {screen === 'play' && <PlayScreen key="play" audio={audio} />}
          {screen === 'result' && <ResultScreen key="result" audio={audio} />}
        </AnimatePresence>
      </div>

      <ToastContainer />
    </div>
  )
}
