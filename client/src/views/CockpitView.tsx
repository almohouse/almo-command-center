import { useState, useRef, useEffect } from 'react'
import { Crosshair, CheckCircle, XCircle, Send, MessageSquare, RefreshCw, CheckSquare } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SectionHeader } from '@/components/cards/SectionHeader'
import { paperclipApi, type Approval, type Conversation } from '@/api/paperclip'
import { cn } from '@/lib/utils'

function ApprovalRow({
  approval,
  onResolve,
  resolving,
}: {
  approval: Approval
  onResolve: (id: string, action: 'approve' | 'reject') => void
  resolving: string | null
}) {
  const isResolving = resolving === approval.id
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{approval.title || 'Approval request'}</p>
        <p className="text-xs text-text-secondary mt-0.5">
          {approval.requestedByName && (
            <>By <span className="text-accent-blue">{approval.requestedByName}</span> · </>
          )}
          {new Date(approval.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onResolve(approval.id, 'approve')}
          disabled={isResolving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-green/10 text-accent-green border border-accent-green/20 text-xs font-medium hover:bg-accent-green/20 transition-all disabled:opacity-50"
        >
          {isResolving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
          Approve
        </button>
        <button
          onClick={() => onResolve(approval.id, 'reject')}
          disabled={isResolving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-red/10 text-accent-red border border-accent-red/20 text-xs font-medium hover:bg-accent-red/20 transition-all disabled:opacity-50"
        >
          {isResolving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
          Reject
        </button>
      </div>
    </div>
  )
}

function ConversationFeed({ conversations, isLoading }: { conversations: Conversation[]; isLoading: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations.length])

  if (isLoading) {
    return (
      <div className="glass-card p-6 flex items-center justify-center gap-2 h-80">
        <RefreshCw className="w-4 h-4 text-text-muted animate-spin" />
        <span className="text-sm text-text-secondary">Loading conversations…</span>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center text-center h-80">
        <MessageSquare className="w-8 h-8 text-text-muted mb-3" />
        <p className="text-sm text-text-secondary">No recent agent activity</p>
        <p className="text-xs text-text-tertiary mt-1">Agent comments from active tasks will appear here</p>
      </div>
    )
  }

  return (
    <div className="glass-card p-4 space-y-3 max-h-80 overflow-y-auto">
      {conversations.map((c) => (
        <div key={c.id} className="glass-card p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-accent-blue">{c.from}</span>
              {c.issueIdentifier && (
                <>
                  <span className="text-xs text-text-muted">on</span>
                  <span className="text-xs font-mono text-accent-purple">{c.issueIdentifier}</span>
                </>
              )}
            </div>
            <span className="text-xs text-text-muted font-mono flex-shrink-0">{c.time}</span>
          </div>
          <p className="text-xs text-white leading-relaxed line-clamp-2">{c.message}</p>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

export function CockpitView() {
  const queryClient = useQueryClient()
  const [command, setCommand] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [commandStatus, setCommandStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  const { data: approvals = [], isLoading: approvalsLoading, refetch: refetchApprovals } = useQuery({
    queryKey: ['approvals'],
    queryFn: paperclipApi.approvals,
    refetchInterval: 15_000,
  })

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: paperclipApi.agents,
  })

  const { data: conversations = [], isLoading: convsLoading, refetch: refetchConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: paperclipApi.conversations,
    refetchInterval: 20_000,
  })

  const sendCommandMutation = useMutation({
    mutationFn: ({ agentId, agentName, message }: { agentId: string; agentName: string; message: string }) =>
      paperclipApi.sendCommand(agentId, agentName, message),
    onSuccess: (result) => {
      setCommandStatus({ text: result.message, type: 'success' })
      setCommand('')
      setTimeout(() => setCommandStatus(null), 4000)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => {
      setCommandStatus({ text: 'Failed to send command', type: 'error' })
      setTimeout(() => setCommandStatus(null), 4000)
    },
  })

  async function handleResolve(approvalId: string, action: 'approve' | 'reject') {
    setResolvingId(approvalId)
    try {
      await paperclipApi.resolveApproval(approvalId, action)
      setResolvedIds((prev) => new Set(prev).add(approvalId))
      refetchApprovals()
    } catch {
      // Silently fail — approval may not support this action yet
    } finally {
      setResolvingId(null)
    }
  }

  function handleSendCommand() {
    const agent = agents.find((a) => a.id === selectedAgentId)
    if (!command.trim() || !agent) return
    sendCommandMutation.mutate({ agentId: agent.id, agentName: agent.name, message: command.trim() })
  }

  const visibleApprovals = approvals.filter((a) => !resolvedIds.has(a.id))
  const selectedAgent = agents.find((a) => a.id === selectedAgentId)

  return (
    <div className="space-y-8 animate-slide-in-up">
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            title="Approval Queue"
            subtitle={approvalsLoading ? 'Loading…' : visibleApprovals.length === 0 ? 'No pending decisions' : `${visibleApprovals.length} pending decision${visibleApprovals.length !== 1 ? 's' : ''}`}
            icon={Crosshair}
            accent="blue"
          />
          <button
            onClick={() => refetchApprovals()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-glass-border text-xs text-text-secondary hover:text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {approvalsLoading ? (
          <div className="glass-card p-8 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 text-text-muted animate-spin" />
            <span className="text-sm text-text-secondary">Loading approvals…</span>
          </div>
        ) : visibleApprovals.length === 0 ? (
          <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
            <CheckSquare className="w-8 h-8 text-accent-green mb-3" />
            <p className="text-sm text-text-secondary">All clear — no pending approvals</p>
            <p className="text-xs text-text-tertiary mt-1">New approval requests from agents will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleApprovals.map((a) => (
              <ApprovalRow key={a.id} approval={a} onResolve={handleResolve} resolving={resolvingId} />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <SectionHeader title="Direct Command" subtitle="Issue a directive to any agent" icon={Send} accent="purple" />
          <div className="glass-card p-5 space-y-4">
            <div>
              <label className="metric-label block mb-2">Target Agent</label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue/50"
              >
                <option value="" style={{ background: '#0f0f18' }}>— Select agent —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id} style={{ background: '#0f0f18' }}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="metric-label block mb-2">Command</label>
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Type your directive..."
                rows={3}
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-blue/50 resize-none"
              />
            </div>
            {commandStatus && (
              <div className={cn(
                'text-xs px-3 py-2 rounded-lg border',
                commandStatus.type === 'success'
                  ? 'bg-accent-green/10 border-accent-green/20 text-accent-green'
                  : 'bg-accent-red/10 border-accent-red/20 text-accent-red'
              )}>
                {commandStatus.text}
              </div>
            )}
            <button
              onClick={handleSendCommand}
              disabled={!command.trim() || !selectedAgentId || sendCommandMutation.isPending}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                command.trim() && selectedAgentId && !sendCommandMutation.isPending
                  ? 'bg-accent-blue text-white hover:bg-accent-blue/90 shadow-glow-blue'
                  : 'bg-glass text-text-muted cursor-not-allowed'
              )}
            >
              {sendCommandMutation.isPending
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</>
                : <><Send className="w-4 h-4" /> Send{selectedAgent ? ` to ${selectedAgent.name}` : ''}</>
              }
            </button>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Agent Conversations" subtitle="Live feed from active issue comments" icon={MessageSquare} accent="green" />
            <button
              onClick={() => refetchConvs()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-glass-border text-xs text-text-secondary hover:text-white transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
          <ConversationFeed conversations={conversations} isLoading={convsLoading} />
        </section>
      </div>
    </div>
  )
}
