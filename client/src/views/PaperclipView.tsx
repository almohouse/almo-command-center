import { useQuery } from '@tanstack/react-query'
import { Paperclip, Users, ListChecks, FolderOpen, CheckCircle, RefreshCw, Clock, AlertCircle } from 'lucide-react'
import { SectionHeader } from '@/components/cards/SectionHeader'
import { paperclipApi, type Agent, type Issue, type Project, type Approval } from '@/api/paperclip'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  todo: 'bg-glass text-text-secondary border-glass-border',
  in_progress: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
  blocked: 'bg-accent-red/10 text-accent-red border-accent-red/20',
  in_review: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
  done: 'bg-accent-green/10 text-accent-green border-accent-green/20',
  backlog: 'bg-glass text-text-muted border-glass-border',
  cancelled: 'bg-glass text-text-muted border-glass-border',
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'text-accent-red',
  high: 'text-accent-orange',
  medium: 'text-accent-yellow',
  low: 'text-text-tertiary',
}

const AGENT_STATUS_DOT: Record<string, string> = {
  online: 'status-dot-green',
  idle: 'status-dot-yellow',
  offline: 'status-dot bg-text-muted',
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
        {agent.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white truncate">{agent.name}</span>
          <span className={cn('status-dot flex-shrink-0', AGENT_STATUS_DOT[agent.status] ?? 'status-dot bg-text-muted')} />
        </div>
        <p className="text-xs text-text-tertiary truncate mt-0.5">{agent.currentTask || 'No active task'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-white">{agent.completionRate}%</p>
        <p className="text-xs text-text-tertiary">done rate</p>
      </div>
    </div>
  )
}

function IssueRow({ issue }: { issue: Issue }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-glass-border/50 last:border-0">
      <span className="text-xs font-mono text-text-muted flex-shrink-0 w-16 truncate">{issue.identifier}</span>
      <p className="flex-1 text-sm text-white truncate">{issue.title}</p>
      <span className={cn('text-xs px-1.5 py-0.5 rounded border flex-shrink-0', STATUS_STYLES[issue.status] ?? 'bg-glass text-text-secondary border-glass-border')}>
        {issue.status.replace('_', ' ')}
      </span>
      {issue.priority && (
        <span className={cn('text-xs font-semibold flex-shrink-0 hidden sm:inline', PRIORITY_COLORS[issue.priority] ?? 'text-text-secondary')}>
          {issue.priority}
        </span>
      )}
    </div>
  )
}

export function PaperclipView() {
  const { data: agents = [], isLoading: agentsLoading, refetch: refetchAgents } = useQuery({
    queryKey: ['paperclip-agents'],
    queryFn: () => paperclipApi.agents(),
    refetchInterval: 30000,
  })

  const { data: issues = [], isLoading: issuesLoading, refetch: refetchIssues } = useQuery({
    queryKey: ['paperclip-issues-active'],
    queryFn: () => paperclipApi.issues('status=todo,in_progress,blocked,in_review'),
    refetchInterval: 30000,
  })

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['paperclip-projects'],
    queryFn: () => paperclipApi.projects(),
    refetchInterval: 60000,
  })

  const { data: approvals = [], isLoading: approvalsLoading } = useQuery({
    queryKey: ['paperclip-approvals'],
    queryFn: () => paperclipApi.approvals(),
    refetchInterval: 30000,
  })

  const pendingApprovals = approvals.filter((a: Approval) => a.status === 'pending')

  const issueBuckets = {
    blocked: issues.filter((i: Issue) => i.status === 'blocked'),
    in_progress: issues.filter((i: Issue) => i.status === 'in_progress'),
    in_review: issues.filter((i: Issue) => i.status === 'in_review'),
    todo: issues.filter((i: Issue) => i.status === 'todo'),
  }

  function handleRefreshAll() {
    refetchAgents()
    refetchIssues()
  }

  return (
    <div className="space-y-6 animate-slide-in-up">

      {/* Header summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Paperclip Live Sync</h2>
          <p className="text-xs text-text-tertiary mt-0.5">Real-time agent & task data · refreshes every 30s</p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-glass-border text-xs text-text-secondary hover:text-white transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold text-white">{agentsLoading ? '…' : agents.length}</p>
          <p className="text-xs text-text-secondary mt-1">Agents</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold text-accent-blue">{issuesLoading ? '…' : issueBuckets.in_progress.length}</p>
          <p className="text-xs text-text-secondary mt-1">In Progress</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold text-accent-red">{issuesLoading ? '…' : issueBuckets.blocked.length}</p>
          <p className="text-xs text-text-secondary mt-1">Blocked</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold text-accent-yellow">{approvalsLoading ? '…' : pendingApprovals.length}</p>
          <p className="text-xs text-text-secondary mt-1">Pending Approvals</p>
        </div>
      </div>

      {/* Agents */}
      <section>
        <SectionHeader title="Agents" subtitle={agentsLoading ? 'Loading…' : `${agents.filter((a: Agent) => a.status === 'online').length} online`} icon={Users} accent="blue" />
        {agentsLoading ? (
          <div className="glass-card p-6 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-text-muted" />
            <span className="text-sm text-text-secondary">Loading agents…</span>
          </div>
        ) : agents.length === 0 ? (
          <div className="glass-card p-6 text-center text-sm text-text-secondary">No agents found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agents.map((agent: Agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </section>

      {/* Active Issues by status */}
      <section>
        <SectionHeader
          title="Active Issues"
          subtitle={issuesLoading ? 'Loading…' : `${issues.length} open`}
          icon={ListChecks}
          accent="purple"
        />
        {issuesLoading ? (
          <div className="glass-card p-6 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-text-muted" />
            <span className="text-sm text-text-secondary">Loading issues…</span>
          </div>
        ) : issues.length === 0 ? (
          <div className="glass-card p-6 text-center text-sm text-text-secondary">No active issues</div>
        ) : (
          <div className="space-y-4">
            {issueBuckets.blocked.length > 0 && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-accent-red" />
                  <p className="text-sm font-semibold text-accent-red">Blocked ({issueBuckets.blocked.length})</p>
                </div>
                {issueBuckets.blocked.map((i: Issue) => <IssueRow key={i.id} issue={i} />)}
              </div>
            )}
            {issueBuckets.in_progress.length > 0 && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="w-4 h-4 text-accent-blue" />
                  <p className="text-sm font-semibold text-accent-blue">In Progress ({issueBuckets.in_progress.length})</p>
                </div>
                {issueBuckets.in_progress.map((i: Issue) => <IssueRow key={i.id} issue={i} />)}
              </div>
            )}
            {issueBuckets.in_review.length > 0 && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-accent-purple" />
                  <p className="text-sm font-semibold text-accent-purple">In Review ({issueBuckets.in_review.length})</p>
                </div>
                {issueBuckets.in_review.map((i: Issue) => <IssueRow key={i.id} issue={i} />)}
              </div>
            )}
            {issueBuckets.todo.length > 0 && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ListChecks className="w-4 h-4 text-text-secondary" />
                  <p className="text-sm font-semibold text-text-secondary">To Do ({issueBuckets.todo.length})</p>
                </div>
                {issueBuckets.todo.map((i: Issue) => <IssueRow key={i.id} issue={i} />)}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Projects */}
      <section>
        <SectionHeader title="Projects" subtitle={projectsLoading ? 'Loading…' : `${projects.length} projects`} icon={FolderOpen} accent="green" />
        {projectsLoading ? (
          <div className="glass-card p-6 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-text-muted" />
            <span className="text-sm text-text-secondary">Loading projects…</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-card p-6 text-center text-sm text-text-secondary">No projects found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.map((p: Project) => {
              const pct = p.issueCount > 0 ? Math.round((p.doneCount / p.issueCount) * 100) : 0
              return (
                <div key={p.id} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                    <span className="text-xs text-text-tertiary flex-shrink-0 ml-2">{p.doneCount}/{p.issueCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-glass-border rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-accent-blue to-accent-purple"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-white tabular-nums">{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <section>
          <SectionHeader title="Pending Approvals" subtitle={`${pendingApprovals.length} awaiting decision`} icon={CheckCircle} />
          <div className="space-y-2">
            {pendingApprovals.map((a: Approval) => (
              <div key={a.id} className="glass-card p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{a.title || 'Approval request'}</p>
                  {a.requestedByName && (
                    <p className="text-xs text-text-secondary mt-0.5">By <span className="text-accent-blue">{a.requestedByName}</span></p>
                  )}
                </div>
                <span className="text-xs px-2 py-0.5 rounded border bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20 flex-shrink-0">
                  pending
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
