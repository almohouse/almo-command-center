import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StoreProvider } from './data/store'
import { AudioPlayerProvider } from './data/audio-player'
import { ToastProvider } from './data/toast'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <AudioPlayerProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AudioPlayerProvider>
      </StoreProvider>
    </QueryClientProvider>
  </StrictMode>,
)
