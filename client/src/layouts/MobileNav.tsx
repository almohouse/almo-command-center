import { NavLink } from 'react-router-dom'
import { BarChart2, Paperclip, Brain, Crosshair, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

// Show most important nav items in the bottom bar (5 max)
const MOBILE_NAV_ITEMS = [
  { path: '/', label: 'Business', icon: BarChart2 },
  { path: '/paperclip', label: 'Agents', icon: Paperclip },
  { path: '/intelligence', label: 'Intel', icon: Brain },
  { path: '/cockpit', label: 'Cockpit', icon: Crosshair },
  { path: '/personal', label: 'Personal', icon: Sun },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-surface-1/95 backdrop-blur-xl border-t border-glass-border">
      <div className="flex items-stretch">
        {MOBILE_NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 text-xs transition-colors',
                isActive
                  ? 'text-accent-blue'
                  : 'text-text-tertiary hover:text-text-secondary'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5', isActive && 'text-accent-blue')} />
                <span className="leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
