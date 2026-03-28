import { NavLink, useLocation, useNavigate } from 'react-router-dom'

const NAV_GROUPS = [
  {
    label: 'Business',
    items: [
      { path: '/dashboard', icon: 'grid_view', label: 'Dashboard' },
      { path: '/goals', icon: 'flag', label: 'Goals' },
      { path: '/bi', icon: 'trending_up', label: 'Business Intel' },
      { path: '/discovery', icon: 'explore', label: 'Discovery' },
      { path: '/crdo', icon: 'science', label: 'CRDO' },
      { path: '/b2b', icon: 'handshake', label: 'B2B Pipeline' },
      { path: '/inbox', icon: 'mail', label: 'Inbox' },
    ],
  },
  {
    label: 'Financials',
    items: [
      { path: '/sales', icon: 'point_of_sale', label: 'Sales' },
      { path: '/expenses', icon: 'receipt_long', label: 'Expenses' },
      { path: '/pnl', icon: 'balance', label: 'P&L' },
      { path: '/cashflow', icon: 'water_drop', label: 'Cash Flow' },
      { path: '/unit-economics', icon: 'calculate', label: 'Unit Economics' },
      { path: '/budget', icon: 'monitoring', label: 'Budget vs Actual' },
      { path: '/inventory-valuation', icon: 'inventory', label: 'Inventory Valuation' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { path: '/tasks', icon: 'view_kanban', label: 'Task Board' },
      { path: '/projects', icon: 'folder_open', label: 'Projects' },
      { path: '/approvals', icon: 'approval', label: 'Approvals' },
      { path: '/factory', icon: 'bolt', label: 'Software Factory' },
      { path: '/content', icon: 'movie', label: 'Content Engine' },
      { path: '/social', icon: 'share', label: 'Social Hub' },
    ],
  },
  {
    label: 'Agents & OS',
    items: [
      { path: '/org', icon: 'account_tree', label: 'Org Chart' },
      { path: '/chat', icon: 'forum', label: 'Agent Chat' },
      { path: '/council', icon: 'groups', label: 'Council Room' },
      { path: '/costs', icon: 'payments', label: 'Agent Costs' },
      { path: '/calendar', icon: 'calendar_month', label: 'Calendar' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { path: '/vault', icon: 'folder_open', label: 'Vault' },
      { path: '/memory', icon: 'menu_book', label: 'Memory' },
      { path: '/logs', icon: 'terminal', label: 'System Logs' },
      { path: '/settings', icon: 'settings', label: 'Settings' },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const user = localStorage.getItem('almo_user') === 'alaa'
    ? { initial: 'A', name: 'Alaa', role: 'Co-Founder' }
    : { initial: 'M', name: 'Moe', role: 'Co-Founder' }

  const width = collapsed ? 64 : 256

  return (
    <aside
      className="fixed top-0 left-0 h-screen bg-surface-container-low border-r border-primary/[0.06] flex flex-col z-40 overflow-hidden transition-[width] duration-300 ease-in-out"
      style={{ width }}
    >
      {/* Logo + toggle */}
      <div className="flex items-center h-16 border-b border-primary/[0.06] shrink-0" style={{ padding: collapsed ? '0 14px' : '0 20px' }}>
        {collapsed ? (
          <button onClick={onToggle} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-primary/[0.05] transition-all mx-auto">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant hover:text-primary transition-colors">menu</span>
          </button>
        ) : (
          <>
            <img src="/almo-logo.png" alt="ALMO OS" className="h-9 w-9 object-cover shrink-0 rounded-sm" style={{ filter: 'invert(1)' }} />
            <div className="ml-2.5 min-w-0">
              <div className="text-sm font-black tracking-[0.15em] text-primary uppercase">ALMO OS</div>
              <div className="text-[10px] font-bold tracking-[0.15em] text-on-surface-variant uppercase opacity-60 truncate">
                Version 1
              </div>
            </div>
            <button onClick={onToggle} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/[0.05] transition-all shrink-0" title="Collapse sidebar">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant hover:text-primary transition-colors">left_panel_close</span>
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5" style={{ padding: collapsed ? '16px 8px' : '16px 12px' }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="px-2 mb-1.5 text-[10px] font-bold tracking-[0.25em] text-on-surface-variant/50 uppercase">
                {group.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={[
                        'flex items-center rounded-xl transition-all',
                        collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2 text-xs font-bold tracking-[0.05em]',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-on-surface-variant hover:bg-primary/[0.05] hover:text-primary/80',
                      ].join(' ')}
                    >
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                      {!collapsed && item.label}
                      {!collapsed && isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse-glow shrink-0" />
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-primary/[0.06] shrink-0" style={{ padding: collapsed ? '12px 8px' : '12px 16px' }}>
        {collapsed ? (
          <button
            onClick={() => navigate('/login')}
            title={`${user.name} — Switch user`}
            className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-xs font-black text-primary mx-auto hover:ring-1 hover:ring-primary/20 transition-all"
          >
            {user.initial}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-xs font-black text-primary shrink-0">
              {user.initial}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-primary truncate">{user.name}</div>
              <div className="text-[10px] text-on-surface-variant truncate">{user.role}</div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="ml-auto text-on-surface-variant hover:text-primary transition-colors"
              title="Switch user"
            >
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
