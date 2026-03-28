import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'info' | 'error'
}

interface ToastState {
  toasts: ToastItem[]
  show: (message: string, type?: 'success' | 'info' | 'error') => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastState | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `t-${Date.now()}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, show, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
