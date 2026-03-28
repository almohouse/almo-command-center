import { motion, AnimatePresence } from 'motion/react'
import { useToast } from '@/data/toast'
import { useAudioPlayer } from '@/data/audio-player'

interface Props {
  sidebarWidth: number
}

const TYPE_STYLES = {
  success: 'border-secondary/30 bg-secondary/15 text-secondary',
  info: 'border-primary/20 bg-primary/10 text-primary',
  error: 'border-error/30 bg-error/15 text-error',
}

export default function ToastContainer({ sidebarWidth }: Props) {
  const { toasts, dismiss } = useToast()
  const audioPlayer = useAudioPlayer()

  // Bottom offset: 24px default, +64px if audio player is showing
  const bottomOffset = audioPlayer.show ? 88 : 24

  return (
    <div
      className="fixed z-[9998] flex flex-col-reverse gap-2 pointer-events-none transition-all duration-300 ease-in-out"
      style={{
        bottom: bottomOffset,
        right: 24,
        left: sidebarWidth + 24,
        top: 80, // below topbar (h-16=64px + 16px gap)
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
      }}
    >
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={() => dismiss(toast.id)}
            className={`pointer-events-auto px-5 py-3 rounded-xl border text-sm font-semibold backdrop-blur-xl cursor-pointer ${TYPE_STYLES[toast.type]}`}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
