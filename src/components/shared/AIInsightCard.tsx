import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'

interface AIInsightAction {
  label: string
  href: string
}

interface AIInsightCardProps {
  text: string
  action?: AIInsightAction
  onDismiss?: () => void
}

export default function AIInsightCard({ text, action, onDismiss }: AIInsightCardProps) {
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  function handleDismiss() {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, height: 0, marginTop: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="glass-card p-4 pl-5 border-l-2 border-l-tertiary"
        >
          <div className="flex items-start gap-3">
            {/* Sparkle icon */}
            <span className="material-symbols-outlined text-[16px] text-tertiary mt-0.5 shrink-0">
              auto_awesome
            </span>

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-on-surface-variant/60 mb-1.5">
                AI Insight
              </div>
              {/* Body */}
              <div className="text-sm text-on-surface leading-relaxed">{text}</div>
              {/* Action */}
              {action && (
                <button
                  onClick={() => navigate(action.href)}
                  className="mt-2.5 text-[11px] font-semibold text-secondary hover:text-primary transition-all"
                >
                  {action.label}
                </button>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-primary/[0.05] transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
