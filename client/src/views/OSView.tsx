import { Cpu, Activity, GitBranch, Clock } from 'lucide-react'
import { SectionHeader } from '@/components/cards/SectionHeader'
import { SparkLine } from '@/components/charts/SparkLine'
import { useDashboard } from '@/hooks/useDashboard'
import { cn } from '@/lib/utils'

// Simulated agent performance data (real data from /api/agents when server is live)
const MOCK_AGENTS = [
  { id: '1', name: 'CTO', role: 'Chief Technology Officer', status: 'online', completionRate: 94, revisionRate: 6, avgTaskHours: 2.4, trend7d: [8,9,11,10,12,9,11] },
  { id: '2', name: 'CMO', role: 'Chief Marketing Officer', status: 'online', completionRate: 88, revisionRate: 12, avgTaskHours: 3.1, trend7d: [6,7,6,8,7,9,8] },
  { id: '3', name: 'COO', role: 'Chief Operating Officer', status: 'idle', completionRate: 91, revisionRate: 9, avgTaskHours: 2.8, trend7d: [5,6,7,5,8,7,6] },
  { id: '4', name: 'CFO', role: 'Chief Financial Officer', status: 'offline', completionRate: 78, revisionRate: 22, avgTaskHours: 4.2, trend7d: [3,4,3,2,4,3,3] },
  { id: '5', name: 'DCEO', role: 'Deputy CEO', status: 'online', completionRate: 97, revisionRate: 3, avgTaskHours: 1.9, trend7d: [10,11,12,11,13,12,14] },
]


const STATUS_DOT: Record<string, string> = {
  online: 'status-dot-green',
  idle: 'status-dot-yellow',
  offline: 'status-dot bg-text-muted',
}


export function OSView() {
  const { data: dashboard, isLoading } = useDashboard()

  // Use real agent data if available, fallback to mock
  const agents = (dashboard?.agents?.length ? dashboard.agents : MOCK_AGENTS) as typeof MOCK_AGENTS

  return (
    <div className="space-y-8 animate-slide-in-up">

      {/* ── Agent Performance Matrix ── */}
      <section>
        <SectionHeader
          title="Agent Performance Matrix"
          subtitle="Real-time agent efficiency metrics"
          icon={Cpu}
          accent="blue"
        />
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-glass-border px-4 py-3 md:hidden">
            <p className="text-xs text-text-secondary">Swipe to compare all agent metrics</p>
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-text-tertiary">Mobile scroll</span>
          </div>
          <div
            data-testid="agent-performance-table-scroll"
            className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"
          >
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="text-left px-4 py-3 metric-label">Agent</th>
                <th className="text-right px-4 py-3 metric-label">Status</th>
                <th className="text-right px-4 py-3 metric-label">Completion</th>
                <th className="text-right px-4 py-3 metric-label">Revision Rate</th>
                <th className="text-right px-4 py-3 metric-label">Avg Hours/Task</th>
                <th className="text-right px-4 py-3 metric-label w-28">7-Day Output</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id} className="border-b border-glass-border/50 hover:bg-glass transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{agent.name}</p>
                    <p className="text-xs text-text-tertiary">{agent.role}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={STATUS_DOT[agent.status]} />
                      <span className="text-xs text-text-secondary capitalize">{agent.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-glass-border rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-accent-green"
                          style={{ width: `${agent.completionRate}%` }}
                        />
                      </div>
                      <span className="text-white font-mono text-xs w-9 text-right">{agent.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      'text-xs font-mono',
                      agent.revisionRate > 15 ? 'text-accent-red' :
                      agent.revisionRate > 10 ? 'text-accent-yellow' : 'text-accent-green'
                    )}>
                      {agent.revisionRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-white font-mono text-xs">{agent.avgTaskHours}h</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-24 ml-auto">
                      <SparkLine
                        data={agent.trend7d}
                        color="#3b82f6"
                        height={28}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      {/* ── Pipeline Flow ── */}
      <section>
        <SectionHeader
          title="Pipeline Flow"
          subtitle="Tasks by stage — bottlenecks highlighted"
          icon={GitBranch}
          accent="purple"
        />
        <div
          data-testid="pipeline-flow-scroll"
          className="glass-card p-8 flex flex-col items-center justify-center text-center border border-accent-purple/10 rounded-xl"
        >
          <Clock className="w-10 h-10 text-text-muted mb-3" />
          <p className="text-base font-semibold text-white mb-1">Live Pipeline — Phase 2</p>
          <p className="text-sm text-text-secondary max-w-sm">
            Real-time Kanban with issue data grouped by stage will be available once the pipeline API is integrated.
          </p>
          <span className="mt-4 px-3 py-1 rounded-full text-xs font-medium bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
            Coming in Phase 2
          </span>
        </div>
      </section>

      {/* ── Task Velocity ── */}
      <section>
        <SectionHeader
          title="Task Velocity"
          subtitle="Tasks completed per day, by agent"
          icon={Activity}
          accent="green"
        />
        <div className="glass-card p-8 flex flex-col items-center justify-center text-center border border-accent-green/10 rounded-xl">
          <Clock className="w-10 h-10 text-text-muted mb-3" />
          <p className="text-base font-semibold text-white mb-1">Velocity Chart — Phase 2</p>
          <p className="text-sm text-text-secondary max-w-sm">
            Per-agent task completion trends will be tracked once velocity metrics are collected from Paperclip.
          </p>
          <span className="mt-4 px-3 py-1 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20">
            Coming in Phase 2
          </span>
        </div>
      </section>
    </div>
  )
}
