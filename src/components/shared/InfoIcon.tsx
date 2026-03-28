import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { createPortal } from 'react-dom'

/**
 * Info icon with hover/click tooltip.
 * Renders the tooltip via a portal into document.body so it is ALWAYS the top layer
 * and never clipped by overflow:hidden, z-index stacking, or glass-card containers.
 */
export default function InfoIcon({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (show && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPos({
        x: rect.left + rect.width / 2,
        y: rect.top,
      })
    }
  }, [show])

  return (
    <>
      <button
        ref={ref}
        onClick={() => setShow(v => !v)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-on-surface-variant/40 hover:text-primary transition-colors shrink-0"
      >
        <span className="material-symbols-outlined text-[14px]">info</span>
      </button>
      {createPortal(
        <AnimatePresence>
          {show && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="fixed w-64 px-4 py-3 rounded-xl text-[11px] text-on-surface leading-relaxed pointer-events-none"
              style={{
                left: pos.x,
                top: pos.y - 8,
                transform: 'translate(-50%, -100%)',
                background: 'rgba(25,25,29,0.98)',
                border: '1px solid rgba(230,230,250,0.12)',
                backdropFilter: 'blur(20px)',
                zIndex: 99999,
              }}
            >
              {text}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
