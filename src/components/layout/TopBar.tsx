import { useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/bi': 'Business Intel',
  '/discovery': 'Discovery',
  '/crdo': 'CRDO',
  '/b2b': 'B2B Pipeline',
  '/inbox': 'Inbox',
  '/tasks': 'Tasks',
  '/projects': 'Projects',
  '/approvals': 'Approvals',
  '/factory': 'Software Factory',
  '/content': 'Content Engine',
  '/social': 'Social Hub',
  '/org': 'Org Chart',
  '/chat': 'Agent Chat',
  '/council': 'Council Room',
  '/costs': 'Agent Costs',
  '/calendar': 'Calendar',
  '/vault': 'Vault',
  '/memory': 'Memory',
  '/logs': 'System Logs',
  '/settings': 'Settings',
}

interface TopBarProps {
  sidebarWidth: number
}

export default function TopBar({ sidebarWidth }: TopBarProps) {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Mission Control'

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-surface-container-low/80 backdrop-blur-xl border-b border-primary/[0.06] flex items-center px-6 z-30 transition-[left] duration-300 ease-in-out"
      style={{ left: sidebarWidth }}
    >
      <h1 className="text-base font-bold text-primary tracking-wide">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse-glow" />
          Live
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/[0.05] hover:text-primary transition-all">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary border-2 border-surface-container-low" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-secondary-container flex items-center justify-center text-xs font-black text-primary cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all">
          M
        </div>
      </div>
    </header>
  )
}
