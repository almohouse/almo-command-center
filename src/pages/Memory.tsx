import { useState } from 'react'
import { motion } from 'motion/react'
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
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentFilter = 'All' | 'DCEO' | 'CTO' | 'Scout' | 'System'

interface Digest {
  id: string
  agent: AgentFilter
  date: string
  dateFormatted: string
  summary: string
  tokens?: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const DIGESTS: Digest[] = [
  {
    id: '1', agent: 'DCEO', date: '2026-03-26', dateFormatted: 'Thursday, March 26, 2026',
    summary: 'Daily briefing. Reviewed 3 pending approvals. Coordinated with CTO on MC build Phase 2. Flagged Aramco deal for Moe review. Sent weekly summary to inbox.',
    tokens: 4090,
  },
  {
    id: '2', agent: 'CTO', date: '2026-03-26', dateFormatted: 'Thursday, March 26, 2026',
    summary: 'Mission Control Phase 2 build started. Building 21 pages using React+Vite+Tailwind. Architecture: lazy-loaded routes, glass-card design system. Pages in progress: Logs, B2B, Inbox, Content, Social, Vault, Memory, Discovery, CRDO, Factory.',
    tokens: 18200,
  },
  {
    id: '3', agent: 'System', date: '2026-03-26', dateFormatted: 'Thursday, March 26, 2026',
    summary: 'Memory Janitor: pruned 0 stale sessions. DB size: 3.2 MB. All agents healthy. Gateway uptime 99.9%. Airtable sync failed at 06:00 (API key issue).',
  },
  {
    id: '4', agent: 'DCEO', date: '2026-03-25', dateFormatted: 'Wednesday, March 25, 2026',
    summary: 'Weekly council planning. Identified keyboard tray as Stage 4 candidate. Budget review with CFO — MTD at 74% of target. Confirmed CTO Phase 1 deliverables.',
    tokens: 3240,
  },
  {
    id: '5', agent: 'CTO', date: '2026-03-25', dateFormatted: 'Wednesday, March 25, 2026',
    summary: 'Phase 1 complete: Dashboard, layout, design system tokens. Build passes — 0 TypeScript errors, 0 Vite warnings. Committed to main. Glass-card pattern established as base component.',
    tokens: 22400,
  },
  {
    id: '6', agent: 'System', date: '2026-03-25', dateFormatted: 'Wednesday, March 25, 2026',
    summary: 'Security Sentinel: no threats detected. Gateway uptime 99.9%. All cron jobs executed successfully. Airtable sync completed at 06:00.',
  },
  {
    id: '7', agent: 'Scout', date: '2026-03-25', dateFormatted: 'Wednesday, March 25, 2026',
    summary: 'Research: Keyboard tray ergonomic market in KSA. Found 4 potential suppliers in Guangzhou and Yiwu. TikTok trend analysis shows growing demand — 847 videos in 30 days. Price opportunity: 149-199 SAR.',
    tokens: 9800,
  },
  {
    id: '8', agent: 'Scout', date: '2026-03-24', dateFormatted: 'Tuesday, March 24, 2026',
    summary: 'Competitor analysis: 3 new ergonomic brands entering KSA market in Q2. ALMO price point competitive. Local brand advantage is key differentiator. Recommend "Crafted for Saudi" positioning.',
    tokens: 7200,
  },
  {
    id: '9', agent: 'DCEO', date: '2026-03-22', dateFormatted: 'Sunday, March 22, 2026',
    summary: 'Quarterly planning session. Set Q2 priorities: MC V2 launch (April), B2B expansion to 10 deals, CMO deployment for content engine. Council alignment confirmed.',
    tokens: 5600,
  },
  {
    id: '10', agent: 'System', date: '2026-03-22', dateFormatted: 'Sunday, March 22, 2026',
    summary: 'Weekly system report: Total sessions this week — 42. Total tokens: 84,200. Estimated cost: $0.64. All agents operational. Scout flagged for rate limit proximity.',
  },
]

const AGENT_TABS: AgentFilter[] = ['All', 'DCEO', 'CTO', 'Scout', 'System']

const AGENT_ICON: Record<AgentFilter, string> = {
  All:    'group',
  DCEO:   'account_balance',
  CTO:    'code',
  Scout:  'travel_explore',
  System: 'settings',
}

const AGENT_COLOR: Record<AgentFilter, string> = {
  All:    'text-primary',
  DCEO:   'text-[#cacafe]',
  CTO:    'text-[#ff9fe3]',
  Scout:  'text-secondary',
  System: 'text-on-surface-variant',
}

// ─── Memory Page ──────────────────────────────────────────────────────────────

export default function Memory() {
  const [activeAgent, setActiveAgent] = useState<AgentFilter>('All')
  const [expanded, setExpanded]       = useState<Set<string>>(new Set())

  const filtered = activeAgent === 'All'
    ? DIGESTS
    : DIGESTS.filter((d) => d.agent === activeAgent)

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-16"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
          Session Archives
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-black text-primary">Memory Browser</h1>
          <InfoIcon text="Session digests capture decisions, actions, and learnings from each agent session." />
        </div>
        <p className="text-sm text-on-surface-variant mt-1">Agent session digests, indexed by date</p>
      </motion.div>

      {/* Agent filter tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-2 flex-wrap">
          {AGENT_TABS.map((agent) => (
            <button
              key={agent}
              onClick={() => setActiveAgent(agent)}
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
                activeAgent === agent
                  ? `bg-primary/10 border-primary/20 ${AGENT_COLOR[agent]}`
                  : 'bg-surface-container-high/60 border-primary/[0.08] text-on-surface-variant hover:text-primary',
              ].join(' ')}
            >
              <span className={`material-symbols-outlined text-[15px] ${activeAgent === agent ? AGENT_COLOR[agent] : ''}`}>
                {AGENT_ICON[agent]}
              </span>
              {agent}
              <span className="text-[10px] opacity-60">
                ({agent === 'All' ? DIGESTS.length : DIGESTS.filter((d) => d.agent === agent).length})
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Digest cards */}
      <motion.div variants={itemVariants} className="space-y-4">
        {filtered.map((digest) => {
          const isExpanded = expanded.has(digest.id)
          const shouldTruncate = digest.summary.length > 180

          return (
            <motion.div key={digest.id} variants={itemVariants} className="glass-card p-5">
              {/* Card header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Agent icon */}
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className={`material-symbols-outlined text-[16px] ${AGENT_COLOR[digest.agent]}`}>
                      {AGENT_ICON[digest.agent]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${AGENT_COLOR[digest.agent]}`}>
                        {digest.agent}
                      </span>
                      <span className="text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border bg-surface-container-high border-primary/[0.08] text-on-surface-variant/60">
                        {digest.dateFormatted}
                      </span>
                      {digest.tokens && (
                        <span className="text-[10px] text-on-surface-variant/50 font-mono">
                          {digest.tokens.toLocaleString()} tokens
                        </span>
                      )}
                    </div>

                    <p className={`text-sm text-on-surface-variant mt-2 leading-relaxed ${!isExpanded && shouldTruncate ? 'line-clamp-3' : ''}`}>
                      {digest.summary}
                    </p>

                    {shouldTruncate && (
                      <button
                        onClick={() => toggleExpand(digest.id)}
                        className="mt-1.5 text-[11px] text-secondary hover:text-primary transition-colors font-semibold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                        {isExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
