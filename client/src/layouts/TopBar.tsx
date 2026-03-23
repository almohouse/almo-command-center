import { Bell, RefreshCw, Wifi, Smartphone, Monitor } from 'lucide-react'
import { useClock } from '@/hooks/useClock'
import { cn } from '@/lib/utils'
import { useTravelMode } from './AppShell'

interface TopBarProps {
  title: string
  isLoading?: boolean
  lastUpdated?: Date
  travelMode?: boolean
}

export function TopBar({ title, isLoading, lastUpdated }: TopBarProps) {
  const now = useClock()
  const { travelMode, toggleTravelMode } = useTravelMode()

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-glass-border bg-surface-1/50 backdrop-blur-xl flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {lastUpdated && (
          <p className="text-xs text-text-tertiary mt-0.5">
            Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Live status */}
        <div className="flex items-center gap-1.5 text-xs text-accent-green">
          <Wifi className="w-3 h-3" />
          <span className="hidden sm:inline">LIVE</span>
        </div>

        {/* Refresh indicator */}
        <RefreshCw
          className={cn('w-3.5 h-3.5 text-text-tertiary', isLoading && 'animate-spin text-accent-blue')}
        />

        {/* Travel mode toggle */}
        <button
          onClick={toggleTravelMode}
          title={travelMode ? 'Switch to Desktop' : 'Travel Mode (mobile-first)'}
          className={cn(
            'p-1.5 rounded-lg transition-all',
            travelMode
              ? 'bg-accent-yellow/20 text-accent-yellow border border-accent-yellow/30'
              : 'hover:bg-glass text-text-secondary hover:text-white'
          )}
        >
          {travelMode ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button className="relative p-1.5 rounded-lg hover:bg-glass transition-all">
          <Bell className="w-4 h-4 text-text-secondary" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-accent-red rounded-full" />
        </button>

        {/* Clock — hide on travel mode for space */}
        {!travelMode && (
          <div className="text-right hidden md:block">
            <p className="text-sm font-mono font-bold text-white tabular-nums">{timeStr}</p>
            <p className="text-xs text-text-secondary">{dateStr}</p>
          </div>
        )}

        {/* Moe avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-xs font-bold text-white flex-shrink-0 cursor-pointer hover:shadow-glow-blue transition-shadow">
          M
        </div>
      </div>
    </header>
  )
}
