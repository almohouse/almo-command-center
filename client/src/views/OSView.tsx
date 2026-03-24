import { Cpu, Activity, GitBranch } from 'lucide-react'
import { SectionHeader } from '@/components/cards/SectionHeader'
import { SparkLine } from '@/components/charts/SparkLine'
import { MiniAreaChart } from '@/components/charts/MiniAreaChart'
import { useDashboard } from '@/hooks/useDashboard'
import { getStatusColor, formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

// Simulated agent performance data (real data from /api/agents when server is live)
const MOCK_AGENTS = [
  { id: '1', name: 'CTO', role: 'Chief Technology Officer', status: 'online', completionRate: 94, revisionRate: 6, avgTaskHours: 2.4, trend7d: [8,9,11,10,12,9,11] },
  { id: '2', name: 'CMO', role: 'Chief Marketing Officer', status: 'online', completionRate: 88, revisionRate: 12, avgTaskHours: 3.1, trend7d: [6,7,6,8,7,9,8] },
  { id: '3', name: 'COO', role: 'Chief Operating Officer', status: 'idle', completionRate: 91, revisionRate: 9, avgTaskHours: 2.8, trend7d: [5,6,7,5,8,7,6] },
  { id: '4', name: 'CFO', role: 'Chief Financial Officer', status: 'offline', completionRate: 78, revisionRate: 22, avgTaskHours: 4.2, trend7d: [3,4,3,2,4,3,3] },
  { id: '5', name: 'DCEO', role: 'Deputy CEO', status: 'online', completionRate: 97, revisionRate: 3, avgTaskHours: 1.9, trend7d: [10,11,12,11,13,12,14] },
]

const KANBAN_COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: '#64748b' },
  { id: 'todo', label: 'To Do', color: '#f59e0b' },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'in_review', label: 'In Review', color: '#8b5cf6' },
  { id: 'done', label: 'Done', color: '#10b981' },
]

// Mock pipeline data
const MOCK_PIPELINE = {
  backlog: [
    { id: 'ALM-61', title: 'Salla API integration', priority: 'high', agent: 'CTO' },
    { id: 'ALM-62', title: 'CFO hiring', priority: 'medium', agent: null },
  ],
  todo: [
    { id: 'ALM-60', title: 'Brand social media strategy', priority: 'high', agent: 'CMO' },
    { id: 'ALM-58', title: 'Q1 financial report', priority: 'medium', agent: 'CFO' },
  ],
  in_progress: [
    { id: 'ALM-59', title: 'ALMO Command Center', priority: 'critical', agent: 'CTO' },
    { id: 'ALM-55', title: 'Product catalog audit', priority: 'high', agent: 'COO' },
  ],
  in_review: [
    { id: 'ALM-53', title: 'Mission Control v2 spec', priority: 'high', agent: 'CTO' },
  ],
  done: [
    { id: 'ALM-52', title: 'Agent hiring framework', priority: 'medium', agent: 'DCEO' },
    { id: 'ALM-51', title: 'Company onboarding flow', priority: 'high', agent: 'DCEO' },
    { id: 'ALM-50', title: 'Paperclip workspace setup', priority: 'medium', agent: 'CTO' },
  ],
}

const VELOCITY_DATA = [
  { date: 'Mar 17', CTO: 3, CMO: 2, COO: 1, DCEO: 4 },
  { date: 'Mar 18', CTO: 4, CMO: 3, COO: 2, DCEO: 5 },
  { date: 'Mar 19', CTO: 2, CMO: 1, COO: 3, DCEO: 3 },
  { date: 'Mar 20', CTO: 5, CMO: 4, COO: 2, DCEO: 6 },
  { date: 'Mar 21', CTO: 3, CMO: 2, COO: 4, DCEO: 4 },
  { date: 'Mar 22', CTO: 4, CMO: 3, COO: 1, DCEO: 5 },
  { date: 'Mar 23', CTO: 2, CMO: 2, COO: 2, DCEO: 3 },
]

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const AGENT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

const STATUS_DOT: Record<string, string> = {
  online: 'status-dot-green',
  idle: 'status-dot-yellow',
  offline: 'status-dot bg-text-muted',
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'border-l-accent-red',
  high: 'border-l-accent-orange',
  medium: 'border-l-accent-yellow',
  low: 'border-l-text-muted',
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
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-glass-border px-4 py-3 md:hidden">
            <p className="text-xs text-text-secondary">Swipe across stages to review the full pipeline</p>
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-text-tertiary">Mobile scroll</span>
          </div>
          <div
            data-testid="pipeline-flow-scroll"
            className="overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch]"
          >
        <div className="grid grid-cols-5 gap-3 min-w-[720px] p-3">
          {KANBAN_COLUMNS.map((col) => {
            const tasks = MOCK_PIPELINE[col.id as keyof typeof MOCK_PIPELINE] ?? []
            const isBottleneck = col.id === 'in_review' && tasks.length > 2
            return (
              <div key={col.id} className={cn('glass-card p-3', isBottleneck && 'border-accent-purple/40')}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                    <p className="text-xs font-semibold text-white">{col.label}</p>
                  </div>
                  <span className={cn(
                    'text-xs font-bold px-1.5 py-0.5 rounded',
                    isBottleneck ? 'bg-accent-purple/20 text-accent-purple' : 'bg-glass text-text-secondary'
                  )}>
                    {tasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'glass-card p-2 border-l-2',
                        PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]
                      )}
                    >
                      <p className="text-xs text-text-secondary font-mono">{task.id}</p>
                      <p className="text-xs text-white mt-0.5 leading-snug line-clamp-2">{task.title}</p>
                      {task.agent && (
                        <p className="text-xs text-accent-blue mt-1">{task.agent}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
          </div>
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
        <div className="glass-card p-5">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={VELOCITY_DATA} margin={{ top: 0, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 15, 24, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              {['CTO', 'CMO', 'COO', 'DCEO'].map((agent, i) => (
                <Bar key={agent} dataKey={agent} stackId="a" fill={AGENT_COLORS[i]} radius={i === 3 ? [4, 4, 0, 0] : undefined} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
