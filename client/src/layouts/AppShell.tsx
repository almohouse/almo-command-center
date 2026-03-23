import { useState, createContext, useContext, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
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
  '/paperclip': 'Paperclip Sync',
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Command Center'

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <TravelModeContext.Provider value={{ travelMode, toggleTravelMode: () => setTravelMode(m => !m) }}>
      <div className={cn('flex h-screen overflow-hidden bg-surface-0', travelMode && 'travel-mode')}>
        {/* Desktop sidebar — hidden on mobile */}
        {!travelMode && (
          <div className="hidden md:flex flex-shrink-0">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
          </div>
        )}

        {/* Mobile sidebar overlay */}
        {!travelMode && mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed left-0 top-0 h-full z-50 md:hidden">
              <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
            </div>
          </>
        )}

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar
            title={title}
            travelMode={travelMode}
            onMobileMenuToggle={() => setMobileMenuOpen(o => !o)}
          />
          <main className={cn(
            'flex-1 overflow-y-auto',
            travelMode ? 'p-3 max-w-lg mx-auto w-full' : 'p-4 md:p-6',
            // Add bottom padding for mobile nav
            !travelMode && 'pb-20 md:pb-6'
          )}>
            <Outlet />
          </main>
        </div>

        {/* Mobile bottom nav — visible on small screens only, not in travel mode */}
        {!travelMode && <MobileNav />}
      </div>
    </TravelModeContext.Provider>
  )
}
