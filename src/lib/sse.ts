import { useEffect, useRef } from 'react'
import { API_BASE } from '@/lib/api'

export function useSSE(onEvent: (type: string, data: unknown) => void) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    let es: EventSource | null = null
    let retryDelay = 1000
    let unmounted = false

    function connect() {
      if (unmounted) return
      es = new EventSource(API_BASE + '/events')

      es.onopen = () => {
        retryDelay = 1000 // reset on successful connection
      }

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)
          onEventRef.current(parsed.type ?? 'message', parsed)
        } catch {
          onEventRef.current('message', event.data)
        }
      }

      // Handle named event types from the backend
      for (const type of ['agent.status', 'task.updated', 'approval.created', 'notification.new']) {
        es.addEventListener(type, (event) => {
          try {
            const parsed = JSON.parse((event as MessageEvent).data)
            onEventRef.current(type, parsed)
          } catch {
            onEventRef.current(type, (event as MessageEvent).data)
          }
        })
      }

      es.onerror = () => {
        es?.close()
        if (!unmounted) {
          setTimeout(connect, retryDelay)
          retryDelay = Math.min(retryDelay * 2, 30000)
        }
      }
    }

    connect()

    return () => {
      unmounted = true
      es?.close()
    }
  }, [])
}
