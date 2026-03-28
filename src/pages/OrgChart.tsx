import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'motion/react'
import { AGENTS, UTILITY_AGENTS, type AgentData } from '@/data/agents'
import { api } from '@/lib/api'
import AgentProfileCard from '@/components/shared/AgentProfileCard'
import InfoIcon from '@/components/shared/InfoIcon'

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ children, info }: { children: React.ReactNode; info?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary">{children}</div>
      {info && <InfoIcon text={info} />}
    </div>
  )
}

function countAgents(agents: AgentData[]): { total: number; running: number } {
  let total = 0
  let running = 0
  for (const a of agents) {
    total++
    if (a.status === 'running') running++
    if (a.subAgents) {
      const sub = countAgents(a.subAgents)
      total += sub.total
      running += sub.running
    }
  }
  return { total, running }
}

function flattenAll(agents: AgentData[]): AgentData[] {
  const result: AgentData[] = []
  for (const a of agents) {
    result.push(a)
    if (a.subAgents) result.push(...flattenAll(a.subAgents))
  }
  return result
}

function matchesSearch(agent: AgentData, query: string): boolean {
  const q = query.toLowerCase()
  return agent.name.toLowerCase().includes(q) || agent.title.toLowerCase().includes(q)
}

// ─── Tree Node ───────────────────────────────────────────────────────────────

function AgentTreeNode({
  agent,
  depth,
  compact,
  searchQuery,
  onAgentUpdate,
}: {
  agent: AgentData
  depth: number
  compact: boolean
  searchQuery: string
  onAgentUpdate: (updated: AgentData) => void
}) {
  // If searching, check if this agent or any descendant matches
  const allDescendants = flattenAll([agent])
  const anyMatch = searchQuery === '' || allDescendants.some(a => matchesSearch(a, searchQuery))
  if (!anyMatch) return null

  const selfMatch = searchQuery === '' || matchesSearch(agent, searchQuery)

  return (
    <div
      className={depth > 0 ? 'relative ml-8' : 'relative'}
      style={depth > 0 ? { borderLeft: '1px solid rgba(230,230,250,0.06)', paddingLeft: 24 } : {}}
    >
      {/* Horizontal connector tick */}
      {depth > 0 && (
        <div
          className="absolute"
          style={{
            left: -1,
            top: compact ? 20 : 28,
            width: 24,
            height: 1,
            background: 'rgba(230,230,250,0.06)',
          }}
        />
      )}

      {selfMatch && (
        <motion.div variants={itemVariants} className="mb-3">
          <AgentProfileCard agent={agent} compact={compact} onAgentUpdate={onAgentUpdate} />
        </motion.div>
      )}

      {agent.subAgents?.map(sub => (
        <AgentTreeNode
          key={sub.id}
          agent={sub}
          depth={depth + 1}
          compact={compact}
          searchQuery={searchQuery}
          onAgentUpdate={onAgentUpdate}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrgChart() {
  const [searchQuery, setSearchQuery] = useState('')
  const [compact, setCompact] = useState(false)
  const [agents, setAgents] = useState<AgentData[]>(AGENTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.agents.list() as any[]
        if (data.length > 0) {
          // Map backend agent data to AgentData shape, preserving hierarchy
          const mapped: AgentData[] = data.map((a: any) => ({
            id: a.id,
            name: a.name || a.id.toUpperCase(),
            title: a.title || '',
            emoji: a.emoji || '🤖',
            model: a.model || '',
            status: a.status || 'idle',
            description: a.description || '',
            personality: a.personality || '',
            skills: a.skills || [],
            telegramBot: a.telegram_bot || null,
            avatar: a.avatar || null,
            heartbeatInterval: a.heartbeat_interval || 300,
            monthlyCost: a.monthly_cost || 0,
            lastActive: a.last_active || null,
            memorySnippets: a.memory_snippets || [],
            tasksAssigned: a.tasks_assigned || 0,
            tasksInProgress: a.tasks_in_progress || 0,
            subAgents: a.sub_agents?.map((s: any) => ({
              id: s.id,
              name: s.name || s.id.toUpperCase(),
              title: s.title || '',
              emoji: s.emoji || '🤖',
              model: s.model || '',
              status: s.status || 'idle',
              description: s.description || '',
              personality: s.personality || '',
              skills: s.skills || [],
              telegramBot: s.telegram_bot || null,
              avatar: s.avatar || null,
              heartbeatInterval: s.heartbeat_interval || 300,
              monthlyCost: s.monthly_cost || 0,
              lastActive: s.last_active || null,
              memorySnippets: s.memory_snippets || [],
              tasksAssigned: s.tasks_assigned || 0,
              tasksInProgress: s.tasks_in_progress || 0,
            })) || undefined,
          }))
          setAgents(mapped)
        }
      } catch {
        setError('Backend offline — showing local data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const { total, running } = useMemo(() => {
    const agentCounts = countAgents(agents)
    return { total: agentCounts.total + UTILITY_AGENTS.length, running: agentCounts.running + UTILITY_AGENTS.filter(u => u.status === 'running').length }
  }, [agents])

  const handleAgentUpdate = useCallback((updated: AgentData) => {
    function updateInTree(list: AgentData[]): AgentData[] {
      return list.map(a => {
        if (a.id === updated.id) return { ...updated, subAgents: a.subAgents }
        if (a.subAgents) return { ...a, subAgents: updateInTree(a.subAgents) }
        return a
      })
    }
    setAgents(prev => updateInTree(prev))
    // Persist to backend
    api.agents.update(updated.id, {
      name: updated.name,
      title: updated.title,
      model: updated.model,
      status: updated.status,
      description: updated.description,
      personality: updated.personality,
      skills: updated.skills,
    }).catch(() => {})
  }, [])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-16"
    >
      {loading && (
        <motion.div variants={itemVariants} className="glass-card p-8 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-secondary/30 border-t-secondary animate-spin" />
          <span className="ml-3 text-sm text-on-surface-variant">Loading agents...</span>
        </motion.div>
      )}
      {error && (
        <motion.div variants={itemVariants} className="glass-card p-4 border border-amber-500/20">
          <span className="text-xs text-amber-400">{error}</span>
        </motion.div>
      )}
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
          Agents &amp; OS
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-primary text-glow">Organization</h1>
            <p className="text-sm text-on-surface-variant mt-2">
              <span className="text-primary font-semibold">{total} agents</span> · {running} running
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter agents..."
                className="w-56 pl-9 pr-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all"
              />
            </div>
            {/* Compact toggle */}
            <button
              onClick={() => setCompact(!compact)}
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all',
                compact
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-surface-container-high text-on-surface-variant border-primary/[0.08] hover:text-primary hover:border-primary/20',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[16px]">
                {compact ? 'view_agenda' : 'view_list'}
              </span>
              {compact ? 'Full View' : 'Compact'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Agent Hierarchy */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Full agent hierarchy — DCEO orchestrates all chiefs, who manage their own sub-agents.">
          Hierarchy
        </SectionHeader>
        <div className={compact ? 'max-w-xl' : 'max-w-2xl'}>
          {agents.map(agent => (
            <AgentTreeNode
              key={agent.id}
              agent={agent}
              depth={0}
              compact={compact}
              searchQuery={searchQuery}
              onAgentUpdate={handleAgentUpdate}
            />
          ))}
        </div>
      </motion.div>

      {/* Utility Agents */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Background utility agents that run on a fixed schedule for maintenance tasks.">
          Utility Agents
        </SectionHeader>
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          {UTILITY_AGENTS.map(u => (
            <div key={u.id} className="glass-card p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/[0.08] flex items-center justify-center text-xl shrink-0">
                  🔁
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">{u.name}</span>
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  </div>
                  <div className="font-mono text-[10px] text-on-surface-variant/60 mt-0.5">{u.model}</div>
                  <div className="text-[11px] text-on-surface-variant mt-0.5">Runs {u.schedule}</div>
                  {u.personality && (
                    <p className="text-[10px] text-on-surface-variant/70 mt-1 italic leading-relaxed line-clamp-1">
                      &ldquo;{u.personality}&rdquo;
                    </p>
                  )}
                  {u.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {u.skills.map(skill => (
                        <span key={skill} className="text-[8px] font-bold tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-bold tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-full border bg-secondary/10 text-secondary border-secondary/20 shrink-0">
                  Running
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
