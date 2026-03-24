import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  accent?: 'blue' | 'purple' | 'green' | 'yellow' | 'red' | 'orange'
  className?: string
  children?: React.ReactNode
}

const ACCENT_CLASSES = {
  blue: 'text-accent-blue',
  purple: 'text-accent-purple',
  green: 'text-accent-green',
  yellow: 'text-accent-yellow',
  red: 'text-accent-red',
  orange: 'text-accent-orange',
}

const ACCENT_BG = {
  blue: 'bg-accent-blue/10',
  purple: 'bg-accent-purple/10',
  green: 'bg-accent-green/10',
  yellow: 'bg-accent-yellow/10',
  red: 'bg-accent-red/10',
  orange: 'bg-accent-orange/10',
}

export function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  accent = 'blue',
  className,
  children,
}: MetricCardProps) {
  return (
    <div className={cn('glass-card min-h-[9.5rem] p-4 sm:p-5 flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="metric-label leading-relaxed pr-2">{label}</p>
        {Icon && (
          <div className={cn('p-2 rounded-lg shrink-0', ACCENT_BG[accent])}>
            <Icon className={cn('w-4 h-4', ACCENT_CLASSES[accent])} />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className={cn('metric-value break-words text-[1.75rem] sm:text-[2rem]', ACCENT_CLASSES[accent])}>{value}</p>
        {subtitle && <p className="text-xs text-text-secondary mt-1 leading-relaxed break-words">{subtitle}</p>}
      </div>

      {trend && trendValue && (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'font-medium',
              trend === 'up' && 'text-accent-green',
              trend === 'down' && 'text-accent-red',
              trend === 'flat' && 'text-text-secondary'
            )}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
          <span className="text-text-tertiary">vs last week</span>
        </div>
      )}

      {children}
    </div>
  )
}
