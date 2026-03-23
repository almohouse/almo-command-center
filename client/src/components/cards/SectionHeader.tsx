import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  accent?: 'blue' | 'purple' | 'green'
  action?: React.ReactNode
  className?: string
}

const ACCENT = {
  blue: 'from-accent-blue to-accent-purple',
  purple: 'from-accent-purple to-accent-cyan',
  green: 'from-accent-green to-accent-cyan',
}

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  accent = 'blue',
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn('p-2 rounded-lg bg-gradient-to-br', ACCENT[accent], 'opacity-90')}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        )}
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
