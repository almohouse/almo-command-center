import { useState, useEffect, useRef } from 'react'
import { Sun, AlertTriangle, Users, TrendingUp, Search, FileText, Loader2, RefreshCw, X } from 'lucide-react'
import { SectionHeader } from '@/components/cards/SectionHeader'
import { paperclipApi, MorningBrief, VaultResult } from '@/api/paperclip'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PRIORITY_COLORS = {
  critical: 'text-accent-red',
  high: 'text-accent-orange',
  medium: 'text-accent-yellow',
  low: 'text-text-secondary',
}

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-glass text-text-secondary border-glass-border',
  in_progress: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
  blocked: 'bg-accent-red/10 text-accent-red border-accent-red/20',
  in_review: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
  done: 'bg-accent-green/10 text-accent-green border-accent-green/20',
}

function MorningBriefPanel() {
  const [brief, setBrief] = useState<MorningBrief | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await paperclipApi.morningBrief()
      setBrief(data)
    } catch (err) {
      console.error('Morning brief failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="glass-card p-6 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-accent-blue" />
        <p className="text-sm text-text-secondary">Generating morning brief...</p>
      </div>
    )
  }

  if (!brief) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-sm text-text-secondary">Failed to load morning brief</p>
        <button onClick={load} className="mt-2 text-xs text-accent-blue hover:underline">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Brief header */}
      <div className="glass-card p-5 border border-accent-blue/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-lg font-bold text-white">Good Morning, Moe</p>
            <p className="text-sm text-text-secondary">{brief.date}</p>
          </div>
          <button onClick={load} className="p-2 rounded-lg hover:bg-glass transition-all">
            <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
          </button>
        </div>

        {/* Summary stats */}
        <div data-testid="personal-summary-cards" className="grid grid-cols-1 min-[380px]:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="glass-card p-3 text-center">
            <p className="text-xl font-bold text-accent-blue">{brief.summary.onlineAgents}/{brief.summary.totalAgents}</p>
            <p className="text-xs text-text-secondary mt-0.5">Agents Online</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className={cn('text-xl font-bold', brief.summary.blockedCount > 0 ? 'text-accent-red' : 'text-accent-green')}>
              {brief.summary.blockedCount}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Blocked</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-xl font-bold text-accent-yellow">{brief.summary.inProgressCount}</p>
            <p className="text-xs text-text-secondary mt-0.5">In Progress</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className={cn('text-xl font-bold', brief.summary.criticalCount > 0 ? 'text-accent-red' : 'text-accent-green')}>
              {brief.summary.criticalCount}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Critical</p>
          </div>
        </div>
      </div>

      {/* Revenue — only shown when real data is available (Phase 2) */}
      {brief.revenue && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="metric-label flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-accent-green" />
              Revenue
            </p>
            <p className="text-sm font-bold text-white">{formatCurrency(brief.revenue.mtd)} MTD</p>
          </div>
          <div className="h-2 bg-glass rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-gradient-to-r from-accent-blue to-accent-green rounded-full transition-all"
              style={{ width: `${Math.min(Math.round((brief.revenue.mtd / brief.revenue.target) * 100), 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{Math.round((brief.revenue.mtd / brief.revenue.target) * 100)}% of {brief.revenue.currency} {(brief.revenue.target / 1000).toFixed(0)}K goal</span>
            <span>{formatCurrency(brief.revenue.today)} today</span>
          </div>
        </div>
      )}

      {/* Top blockers */}
      {brief.topBlockers.length > 0 && (
        <div className="glass-card p-5">
          <p className="metric-label flex items-center gap-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-accent-red" />
            Top Blockers
          </p>
          <div className="space-y-2">
            {brief.topBlockers.map(blocker => (
              <div key={blocker.id} className="flex items-center gap-3 py-2 border-b border-glass-border last:border-0">
                <span className="font-mono text-xs text-text-muted w-16 flex-shrink-0">{blocker.identifier}</span>
                <p className="text-sm text-white flex-1 truncate">{blocker.title}</p>
                <span className={cn('text-xs font-medium', PRIORITY_COLORS[blocker.priority as keyof typeof PRIORITY_COLORS] || 'text-text-secondary')}>
                  {blocker.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active agents */}
      {brief.activeAgents.length > 0 && (
        <div className="glass-card p-5">
          <p className="metric-label flex items-center gap-2 mb-3">
            <Users className="w-3.5 h-3.5 text-accent-blue" />
            Active Agents
          </p>
          <div className="flex flex-wrap gap-2">
            {brief.activeAgents.map((agent, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/20">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                <span className="text-xs text-white font-medium">{agent.name}</span>
                {agent.task && agent.task !== 'active task' && (
                  <span className="text-xs text-text-muted font-mono">{agent.task}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function VaultSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<VaultResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    try {
      const data = await paperclipApi.vaultSearch(q)
      setResults(data.results)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(val), 400)
  }

  const clear = () => {
    setQuery('')
    setResults([])
    setSearched(false)
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          value={query}
          onChange={handleChange}
          placeholder="Search issues, tasks, decisions... (min. 2 chars)"
          className="w-full bg-glass border border-glass-border rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-blue/50 transition-colors"
        />
        {query && (
          <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-glass">
            <X className="w-3.5 h-3.5 text-text-muted" />
          </button>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-accent-blue" />
          <p className="text-sm text-text-secondary">Searching vault...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="glass-card p-6 text-center">
          <FileText className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No results for "{query}"</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          {results.map(result => (
            <div key={result.id} className="glass-card p-4 space-y-1.5 hover:border-accent-blue/20 transition-colors cursor-default">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-text-muted">{result.identifier}</span>
                <span className={cn('text-xs px-1.5 py-0.5 rounded border', STATUS_COLORS[result.status] || 'bg-glass text-text-secondary border-glass-border')}>
                  {result.status}
                </span>
                <span className={cn('text-xs ml-auto', PRIORITY_COLORS[result.priority as keyof typeof PRIORITY_COLORS] || 'text-text-secondary')}>
                  {result.priority}
                </span>
              </div>
              <p className="text-sm text-white font-medium leading-snug">{result.title}</p>
              {result.excerpt && (
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{result.excerpt}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function PersonalView() {
  const [activeTab, setActiveTab] = useState<'brief' | 'vault'>('brief')

  return (
    <div className="space-y-6 animate-slide-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionHeader
          title="Moe's Personal Layer"
          subtitle="Morning brief · Vault search · Travel ready"
          icon={Sun}
          accent="blue"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass-card w-fit rounded-xl">
        <button
          onClick={() => setActiveTab('brief')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'brief'
              ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
              : 'text-text-secondary hover:text-white'
          )}
        >
          Morning Brief
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'vault'
              ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
              : 'text-text-secondary hover:text-white'
          )}
        >
          Vault Search
        </button>
      </div>

      {activeTab === 'brief' && <MorningBriefPanel />}
      {activeTab === 'vault' && <VaultSearch />}
    </div>
  )
}
