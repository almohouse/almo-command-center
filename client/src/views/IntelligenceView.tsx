import { Brain, AlertCircle, Shield, TrendingUp, Search, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { SectionHeader } from '@/components/cards/SectionHeader'
import { paperclipApi, type Anomaly, type Risk } from '@/api/paperclip'
import { cn } from '@/lib/utils'

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-accent-red/10 border-accent-red/30 text-accent-red',
  high: 'bg-accent-orange/10 border-accent-orange/30 text-accent-orange',
  warning: 'bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow',
  info: 'bg-accent-blue/10 border-accent-blue/30 text-accent-blue',
}

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  return (
    <div className={cn('glass-card p-4 flex items-center gap-4 border', SEVERITY_STYLES[anomaly.severity])}>
      <Brain className="w-4 h-4 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{anomaly.title}</p>
        {anomaly.detail && (
          <p className="text-xs text-text-secondary mt-0.5 font-mono truncate">{anomaly.detail}</p>
        )}
        <p className="text-xs text-text-secondary mt-0.5">{anomaly.time}</p>
      </div>
      <span className="text-xs uppercase font-semibold flex-shrink-0">{anomaly.severity}</span>
    </div>
  )
}

function RiskCard({ risk }: { risk: Risk }) {
  return (
    <div className={cn('glass-card p-4 border', SEVERITY_STYLES[risk.severity])}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white font-medium">{risk.title}</p>
          {risk.issueId && (
            <p className="text-xs font-mono text-text-muted mt-0.5">{risk.issueId}</p>
          )}
          <p className="text-xs text-text-secondary mt-1">Mitigation: {risk.mitigation}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs uppercase font-bold">{risk.severity}</p>
          <p className="text-xs text-text-secondary mt-0.5">⏱ {risk.countdown}</p>
        </div>
      </div>
    </div>
  )
}

export function IntelligenceView() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['intelligence'],
    queryFn: paperclipApi.intelligence,
    refetchInterval: 30_000,
  })

  const anomalies = data?.anomalies ?? []
  const risks = data?.risks ?? []

  return (
    <div className="space-y-8 animate-slide-in-up">
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Anomaly Detection" subtitle="Unusual patterns from live Paperclip data" icon={AlertCircle} accent="purple" />
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-glass-border text-xs text-text-secondary hover:text-white transition-colors"
          >
            <RefreshCw className={cn('w-3 h-3', isFetching && 'animate-spin')} />
            Refresh
          </button>
        </div>
        {isLoading ? (
          <div className="glass-card p-8 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 text-text-muted animate-spin" />
            <span className="text-sm text-text-secondary">Loading intelligence data…</span>
          </div>
        ) : isError ? (
          <div className="glass-card p-6 text-center text-accent-red text-sm">
            Failed to load intelligence data
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((a) => <AnomalyCard key={a.id} anomaly={a} />)}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Risk Radar" subtitle="Live threats derived from blocked tasks & critical priorities" icon={Shield} accent="blue" />
        {isLoading ? (
          <div className="glass-card p-6 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 text-text-muted animate-spin" />
            <span className="text-sm text-text-secondary">Loading risks…</span>
          </div>
        ) : (
          <div className="space-y-3">
            {risks.map((r) => <RiskCard key={r.id} risk={r} />)}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-6">
        <section>
          <SectionHeader title="Competitive Pulse" subtitle="Competitor monitoring feed" icon={TrendingUp} accent="green" />
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center h-48">
            <TrendingUp className="w-8 h-8 text-text-muted mb-3" />
            <p className="text-sm text-text-secondary">Competitive intel feed</p>
            <p className="text-xs text-text-tertiary mt-1">Connect market data source to activate</p>
            <p className="text-xs text-text-muted mt-3 font-mono">API_HOOK: /api/intelligence/competitive</p>
          </div>
        </section>
        <section>
          <SectionHeader title="Opportunity Scanner" subtitle="Market signal detection" icon={Search} accent="green" />
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center h-48">
            <Search className="w-8 h-8 text-text-muted mb-3" />
            <p className="text-sm text-text-secondary">Opportunity scanning</p>
            <p className="text-xs text-text-tertiary mt-1">Connect market data source to activate</p>
            <p className="text-xs text-text-muted mt-3 font-mono">API_HOOK: /api/intelligence/opportunities</p>
          </div>
        </section>
      </div>
    </div>
  )
}
