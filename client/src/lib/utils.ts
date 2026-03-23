import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'SAR'): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ${currency}`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K ${currency}`
  return `${value.toLocaleString()} ${currency}`
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return '#ef4444'
    case 'high': return '#f97316'
    case 'medium': return '#f59e0b'
    case 'low': return '#10b981'
    default: return '#64748b'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'done': return '#10b981'
    case 'in_progress': return '#3b82f6'
    case 'in_review': return '#8b5cf6'
    case 'blocked': return '#ef4444'
    case 'todo': return '#f59e0b'
    case 'backlog': return '#64748b'
    default: return '#64748b'
  }
}
