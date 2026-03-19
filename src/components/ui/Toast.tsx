import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface ToastState {
  message: string
  visible: boolean
}

let showToastFn: ((msg: string) => void) | null = null

export function showToast(msg: string) {
  showToastFn?.(msg)
}

export function ToastContainer() {
  const [state, setState] = useState<ToastState>({ message: '', visible: false })

  useEffect(() => {
    showToastFn = (msg: string) => {
      setState({ message: msg, visible: true })
      setTimeout(() => setState(s => ({ ...s, visible: false })), 2000)
    }
    return () => { showToastFn = null }
  }, [])

  return (
    <AnimatePresence>
      {state.visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000]
            bg-white text-[#0a0a0f] px-5 py-2 rounded-lg text-sm font-mono"
        >
          {state.message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
