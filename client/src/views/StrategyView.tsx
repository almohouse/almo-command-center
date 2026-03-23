import { useState } from 'react'
import { Target, Map, Star, RefreshCw, Pencil, Check, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { SectionHeader } from '@/components/cards/SectionHeader'
import { paperclipApi, type Goal } from '@/api/paperclip'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { cn } from '@/lib/utils'

const CHIEF_ROLES = ['DCEO', 'CTO', 'CMO', 'COO', 'CFO', 'CPO', 'CRO', 'CCO']

const DEFAULT_ROADMAP = [
  { quarter: 'Q1 2026', title: 'ALMO OS Foundation', status: 'in_progress', items: ['Agent hiring framework', 'Paperclip integration', 'Command Center v1'] },
  { quarter: 'Q2 2026', title: 'Revenue Engine', status: 'planned', items: ['Salla full integration', 'CFO + CMO live', 'SAR 400K/month target'] },
  { quarter: 'Q3 2026', title: 'Scale', status: 'planned', items: ['8 Chiefs live', 'Zero human middleware', 'Expand product line'] },
  { quarter: 'Q4 2026', title: 'Expansion', status: 'planned', items: ['UAE market entry', 'Series A preparation', 'ALMO brand launch'] },
]

const ROADMAP_STATUS_COLORS: Record<string, string> = {
  in_progress: 'border-accent-blue text-accent-blue',
  planned: 'border-glass-border text-text-secondary',
  done: 'border-accent-green text-accent-green',
}

function formatGoalValue(goal: Goal) {
  if (goal.unit === 'SAR') return formatCurrency(goal.current)
  if (goal.unit === '%') return formatPercent(goal.current, 0)
  return `${formatNumber(goal.current)} ${goal.unit}`
}

function formatGoalTarget(goal: Goal) {
  if (goal.unit === 'SAR') return formatCurrency(goal.target)
  if (goal.unit === '%') return formatPercent(goal.target, 0)
  return `${formatNumber(goal.target)} ${goal.unit}`
}

function OKRCard({ goal }: { goal: Goal }) {
  const pct = Math.min((goal.current / goal.target) * 100, 100)
  const isDone = goal.status === 'done'
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{goal.title}</p>
            {goal.source === 'live' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green border border-accent-green/20 font-mono">LIVE</span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">{goal.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-white">{formatGoalValue(goal)}</p>
          <p className="text-xs text-text-tertiary">of {formatGoalTarget(goal)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-glass-border rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-500',
              isDone
                ? 'bg-gradient-to-r from-accent-green to-accent-cyan'
                : pct > 70
                ? 'bg-gradient-to-r from-accent-blue to-accent-purple'
                : 'bg-gradient-to-r from-accent-yellow to-accent-orange'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={cn('text-xs font-bold w-10 text-right', isDone ? 'text-accent-green' : 'text-white')}>
          {Math.round(pct)}%
        </span>
        {isDone && <span className="text-xs text-accent-green font-semibold">✓ DONE</span>}
      </div>
    </div>
  )
}

type RoadmapItem = typeof DEFAULT_ROADMAP[0]

function RoadmapCard({ item, onSave }: { item: RoadmapItem; onSave: (updated: RoadmapItem) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item)

  return (
    <div className={cn('glass-card p-4 border-t-2', ROADMAP_STATUS_COLORS[item.status])}>
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'inherit' }}>{item.quarter}</p>
        {!editing ? (
          <button onClick={() => { setDraft(item); setEditing(true) }} className="text-text-muted hover:text-white transition-colors">
            <Pencil className="w-3 h-3" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={() => { onSave(draft); setEditing(false) }} className="text-accent-green hover:text-accent-green/80 transition-colors">
              <Check className="w-3 h-3" />
            </button>
            <button onClick={() => setEditing(false)} className="text-accent-red hover:text-accent-red/80 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <input
            value={draft.title}
            onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
            className="w-full bg-glass border border-glass-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-blue/50"
          />
          <select
            value={draft.status}
            onChange={(e) => setDraft(d => ({ ...d, status: e.target.value }))}
            className="w-full bg-glass border border-glass-border rounded px-2 py-1 text-xs text-white focus:outline-none"
          >
            <option value="planned" style={{ background: '#0f0f18' }}>Planned</option>
            <option value="in_progress" style={{ background: '#0f0f18' }}>In Progress</option>
            <option value="done" style={{ background: '#0f0f18' }}>Done</option>
          </select>
          <textarea
            value={draft.items.join('\n')}
            onChange={(e) => setDraft(d => ({ ...d, items: e.target.value.split('\n').filter(Boolean) }))}
            rows={3}
            className="w-full bg-glass border border-glass-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-blue/50 resize-none"
          />
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-white mb-3">{item.title}</p>
          <ul className="space-y-1">
            {item.items.map((i) => (
              <li key={i} className="text-xs text-text-secondary flex gap-2">
                <span className="text-text-muted">·</span>{i}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export function StrategyView() {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['goals'],
    queryFn: paperclipApi.goals,
    refetchInterval: 60_000,
  })

  // Roadmap stored in localStorage for persistence
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>(() => {
    try {
      const saved = localStorage.getItem('almo-roadmap')
      return saved ? JSON.parse(saved) : DEFAULT_ROADMAP
    } catch {
      return DEFAULT_ROADMAP
    }
  })

  function updateRoadmapItem(index: number, updated: RoadmapItem) {
    const next = roadmap.map((item, i) => (i === index ? updated : item))
    setRoadmap(next)
    localStorage.setItem('almo-roadmap', JSON.stringify(next))
  }

  const goals = data?.goals ?? []
  const activeChiefs = data?.activeChiefs ?? 0
  const agentCount = data?.agentCount ?? 0

  // Build chief grid: mark as live if the API says so
  const chiefLiveCount = goals.find(g => g.id === 'okr-chiefs')?.current ?? activeChiefs

  return (
    <div className="space-y-8 animate-slide-in-up">
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="OKR Tracking" subtitle="Company-level goals — live data from Paperclip" icon={Target} accent="blue" />
          {isFetching && <RefreshCw className="w-4 h-4 text-text-muted animate-spin" />}
        </div>
        {isLoading ? (
          <div className="glass-card p-8 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 text-text-muted animate-spin" />
            <span className="text-sm text-text-secondary">Loading goals…</span>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => <OKRCard key={goal.id} goal={goal} />)}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Product Roadmap" subtitle="ALMO brand — editable visual timeline" icon={Map} accent="purple" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {roadmap.map((item, i) => (
            <RoadmapCard key={item.quarter} item={item} onSave={(updated) => updateRoadmapItem(i, updated)} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="North Star Tracker" subtitle={`Progress toward 8 Chiefs live — ${agentCount} total agents`} icon={Star} accent="green" />
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-3xl font-bold text-white">
                {isLoading ? '…' : chiefLiveCount}
                <span className="text-text-secondary text-lg font-normal"> / 8 Chiefs</span>
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {agentCount} agents total in Paperclip · {chiefLiveCount} exec roles mapped
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">Next milestone</p>
              <p className="text-sm font-semibold text-accent-blue">
                {chiefLiveCount < 8 ? `${8 - chiefLiveCount} more chiefs needed` : '8/8 achieved ✓'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {CHIEF_ROLES.map((chief, i) => {
              const isLive = i < chiefLiveCount
              return (
                <div
                  key={chief}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg border',
                    isLive ? 'bg-accent-blue/10 border-accent-blue/30' : 'bg-glass border-glass-border opacity-40'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                    isLive ? 'bg-accent-blue text-white' : 'bg-glass-strong text-text-tertiary'
                  )}>
                    {isLive ? '✓' : '·'}
                  </div>
                  <p className="text-xs text-center font-medium" style={{ color: isLive ? 'white' : '#64748b' }}>{chief}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
