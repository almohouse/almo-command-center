import { useState, createContext, useContext } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { cn } from '@/lib/utils'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Business',
  '/os': 'OS Layer',
  '/intelligence': 'Intelligence',
  '/strategy': 'Strategy',
  '/cockpit': 'Decision Cockpit',
  '/council': 'Council Meeting',
  '/founder': "Founder's Portal",
  '/personal': "Moe's Personal Layer",
}

interface TravelModeContextType {
  travelMode: boolean
  toggleTravelMode: () => void
}

export const TravelModeContext = createContext<TravelModeContextType>({
  travelMode: false,
  toggleTravelMode: () => {},
})

export function useTravelMode() {
  return useContext(TravelModeContext)
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [travelMode, setTravelMode] = useState(false)
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Command Center'

  return (
    <TravelModeContext.Provider value={{ travelMode, toggleTravelMode: () => setTravelMode(m => !m) }}>
      <div className={cn('flex h-screen overflow-hidden bg-surface-0', travelMode && 'travel-mode')}>
        {!travelMode && (
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        )}

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar title={title} travelMode={travelMode} />
          <main className={cn(
            'flex-1 overflow-y-auto',
            travelMode ? 'p-3 max-w-lg mx-auto w-full' : 'p-6'
          )}>
            <Outlet />
          </main>
        </div>
      </div>
    </TravelModeContext.Provider>
  )
}
