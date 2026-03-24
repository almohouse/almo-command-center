import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const DEFAULT_INTERVAL_MS = 5_000

type SyncStatus = 'live' | 'reconnecting' | 'offline'

declare global {
  interface Window {
    __ALMO_LIVE_SYNC_INTERVAL_MS__?: number
  }
}

interface UseLivePaperclipSyncOptions {
  queryKeys: string[][]
  intervalMs?: number
}

export function useLivePaperclipSync({ queryKeys, intervalMs }: UseLivePaperclipSyncOptions) {
  const queryClient = useQueryClient()
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [status, setStatus] = useState<SyncStatus>(navigator.onLine ? 'reconnecting' : 'offline')

  const resolvedIntervalMs = useMemo(() => {
    if (typeof window !== 'undefined' && typeof window.__ALMO_LIVE_SYNC_INTERVAL_MS__ === 'number') {
      return window.__ALMO_LIVE_SYNC_INTERVAL_MS__
    }
    return intervalMs ?? DEFAULT_INTERVAL_MS
  }, [intervalMs])

  useEffect(() => {
    let disposed = false

    const sync = async () => {
      if (document.visibilityState === 'hidden') return
      if (!navigator.onLine) {
        setStatus('offline')
        return
      }

      setStatus((current) => (current === 'live' ? current : 'reconnecting'))

      try {
        await Promise.all(
          queryKeys.map((queryKey) =>
            queryClient.invalidateQueries({
              queryKey,
              refetchType: 'active',
            })
          )
        )

        if (!disposed) {
          setLastSyncAt(new Date())
          setStatus('live')
        }
      } catch {
        if (!disposed) {
          setStatus('reconnecting')
        }
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void sync()
      }
    }

    const onOnline = () => {
      setStatus('reconnecting')
      void sync()
    }

    const onOffline = () => setStatus('offline')

    void sync()
    const timer = window.setInterval(() => void sync(), resolvedIntervalMs)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      disposed = true
      window.clearInterval(timer)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [queryClient, queryKeys, resolvedIntervalMs])

  return {
    status,
    lastSyncAt,
    intervalMs: resolvedIntervalMs,
  }
}
