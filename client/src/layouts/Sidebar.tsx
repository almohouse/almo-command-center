import { NavLink } from 'react-router-dom'
import {
  BarChart2,
  Cpu,
  Brain,
  Target,
  Crosshair,
  Users,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sun,
  Paperclip,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { path: '/', label: 'Business', icon: BarChart2, description: 'Store, revenue, blockers' },
  { path: '/os', label: 'OS', icon: Cpu, description: 'Agents, pipeline, velocity' },
  { path: '/intelligence', label: 'Intelligence', icon: Brain, description: 'Anomalies, risks, signals' },
  { path: '/strategy', label: 'Strategy', icon: Target, description: 'OKRs, roadmap, North Star' },
  { path: '/cockpit', label: 'Cockpit', icon: Crosshair, description: 'Approvals, commands, comms' },
  { path: '/council', label: 'Council', icon: Users, description: 'Chiefs meeting room' },
  { path: '/founder', label: 'Founder', icon: User, description: "Alaa's strategic view" },
  { path: '/personal', label: 'Personal', icon: Sun, description: "Moe's brief & vault" },
  { path: '/paperclip', label: 'Paperclip', icon: Paperclip, description: 'Live Paperclip sync' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-surface-1 border-r border-glass-border transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-glass-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white leading-none">ALMO</p>
            <p className="text-xs text-text-secondary mt-0.5">Command Center</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon, description }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-all duration-150 group relative',
                isActive
                  ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                  : 'text-text-secondary hover:text-white hover:bg-glass'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive && 'text-accent-blue')} />
                {!collapsed && (
                  <span className="truncate font-medium">{label}</span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-surface-2 border border-glass-border rounded-md text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="font-medium">{label}</div>
                    <div className="text-text-tertiary">{description}</div>
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-glass-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg text-text-tertiary hover:text-white hover:bg-glass transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
