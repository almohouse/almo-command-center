// ─── Shared agent/user roster ────────────────────────────────────────────────
// Single source of truth used by Tasks (@mentions, assignee pickers),
// OrgChart (hierarchy), and anywhere else we need the roster.

export type AgentStatus = 'running' | 'idle' | 'not-deployed'

export interface AgentData {
  id: string
  name: string
  title: string
  emoji: string
  model: string
  status: AgentStatus
  description: string
  personality: string
  skills: string[]
  telegramBot: string | null
  avatar: string | null
  heartbeatInterval: number
  monthlyCost: number
  lastActive: string | null
  memorySnippets: string[]
  tasksAssigned: number
  tasksInProgress: number
  subAgents?: AgentData[]
}

export interface UtilityAgent {
  id: string
  name: string
  model: string
  schedule: string
  status: AgentStatus
  personality: string
  skills: string[]
}

export interface Mentionable {
  id: string
  name: string
  title: string
  type: 'human' | 'agent'
}

export const MODELS = [
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
  'qwen2.5:7b',
]

export const AGENTS: AgentData[] = [
  {
    id: 'dceo',
    name: 'DCEO',
    title: 'Deputy CEO',
    emoji: '🏛',
    model: 'claude-opus-4-6',
    status: 'running',
    description: 'Orchestrates all chief agents, manages gate files, and drives daily business operations.',
    personality: 'Strategic, decisive, and calm under pressure. Thinks in systems and cascading effects. Always asks "what does this mean for the business?" before acting.',
    skills: ['orchestration', 'strategic planning', 'gate management', 'agent coordination', 'daily briefings'],
    telegramBot: '@almo_dceo_bot',
    avatar: null,
    heartbeatInterval: 5,
    monthlyCost: 48.50,
    lastActive: '2026-03-28T14:32:00Z',
    memorySnippets: [
      'Moe approved Q2 budget allocation for marketing expansion',
      'CTO completed mission-control v2 deployment ahead of schedule',
      'Scout flagged new competitor entering Saudi comfort hardware market',
    ],
    tasksAssigned: 12,
    tasksInProgress: 3,
    subAgents: [
      {
        id: 'scout',
        name: 'Scout',
        title: 'Market Scout',
        emoji: '🔬',
        model: 'claude-sonnet-4-6',
        status: 'idle',
        description: 'Monitors TikTok trends, product signals, and competitive landscape in Saudi market.',
        personality: 'Curious and obsessive about details. Digs three layers deeper than asked. Speaks in data points and trend signals.',
        skills: ['trend analysis', 'competitor monitoring', 'TikTok scraping', 'market research', 'signal detection'],
        telegramBot: '@almo_scout_bot',
        avatar: null,
        heartbeatInterval: 15,
        monthlyCost: 12.30,
        lastActive: '2026-03-28T11:45:00Z',
        memorySnippets: [
          'Portable AC units trending +340% on TikTok Saudi this week',
          'Competitor X launched a new humidifier at 30% lower price point',
          'B2B interest spike from hotel chains in Jeddah region',
        ],
        tasksAssigned: 5,
        tasksInProgress: 0,
      },
      {
        id: 'cto',
        name: 'CTO',
        title: 'Chief Technology Officer',
        emoji: '🔧',
        model: 'claude-opus-4-6',
        status: 'running',
        description: 'Leads all technical builds, manages code agents, and maintains system architecture.',
        personality: 'Methodical and precise. Breaks every problem into components. Prefers shipping small, tested increments over big-bang releases.',
        skills: ['system architecture', 'code review', 'agent management', 'deployment', 'technical planning'],
        telegramBot: '@almo_cto_bot',
        avatar: null,
        heartbeatInterval: 5,
        monthlyCost: 62.80,
        lastActive: '2026-03-28T14:28:00Z',
        memorySnippets: [
          'Migrated mission-control to React 19 with zero downtime',
          'CTO-Builder completed 13 component builds this sprint',
          'New SSE event system deployed for real-time agent status updates',
        ],
        tasksAssigned: 21,
        tasksInProgress: 4,
        subAgents: [
          {
            id: 'cto-planner',
            name: 'CTO-Planner',
            title: 'Planning Sub-Agent',
            emoji: '📐',
            model: 'claude-sonnet-4-6',
            status: 'running',
            description: 'Breaks down technical tasks and creates implementation plans.',
            personality: 'Analytical and thorough. Creates detailed plans with clear dependencies. Always considers edge cases.',
            skills: ['task decomposition', 'dependency analysis', 'spec writing', 'estimation'],
            telegramBot: null,
            avatar: null,
            heartbeatInterval: 10,
            monthlyCost: 18.40,
            lastActive: '2026-03-28T14:20:00Z',
            memorySnippets: [
              'Broke OrgChart rewrite into 3 files with clear interfaces',
              'Estimated 2-day effort for full agent profile system',
            ],
            tasksAssigned: 8,
            tasksInProgress: 2,
          },
          {
            id: 'cto-builder',
            name: 'CTO-Builder',
            title: 'Build Sub-Agent',
            emoji: '⚙️',
            model: 'claude-sonnet-4-6',
            status: 'running',
            description: 'Executes code builds, writes components, and deploys changes.',
            personality: 'Fast and focused. Writes clean code on the first pass. Prefers Tailwind and functional patterns.',
            skills: ['React', 'TypeScript', 'Tailwind CSS', 'component development', 'testing'],
            telegramBot: null,
            avatar: null,
            heartbeatInterval: 10,
            monthlyCost: 22.10,
            lastActive: '2026-03-28T14:30:00Z',
            memorySnippets: [
              'Shipped Dashboard action items with cross-page deep links',
              'Built 6 financial pages in a single sprint cycle',
            ],
            tasksAssigned: 13,
            tasksInProgress: 2,
          },
        ],
      },
      {
        id: 'cfo',
        name: 'CFO',
        title: 'Chief Financial Officer',
        emoji: '💰',
        model: 'claude-sonnet-4-6',
        status: 'not-deployed',
        description: 'Manages financial modeling, cash flow forecasting, and margin analysis.',
        personality: 'Conservative and detail-oriented. Never rounds numbers. Thinks in unit economics and margin percentages.',
        skills: ['financial modeling', 'cash flow analysis', 'margin optimization', 'budget forecasting', 'P&L management'],
        telegramBot: null,
        avatar: null,
        heartbeatInterval: 30,
        monthlyCost: 0,
        lastActive: null,
        memorySnippets: [],
        tasksAssigned: 0,
        tasksInProgress: 0,
      },
      {
        id: 'cmo',
        name: 'CMO',
        title: 'Chief Marketing Officer',
        emoji: '📢',
        model: 'claude-sonnet-4-6',
        status: 'not-deployed',
        description: 'Leads TikTok content strategy, paid media briefings, and influencer coordination.',
        personality: 'Creative and trend-savvy. Thinks in hooks, virality, and audience psychology. Speaks the language of engagement metrics.',
        skills: ['content strategy', 'TikTok marketing', 'influencer outreach', 'paid media', 'brand voice'],
        telegramBot: null,
        avatar: null,
        heartbeatInterval: 30,
        monthlyCost: 0,
        lastActive: null,
        memorySnippets: [],
        tasksAssigned: 0,
        tasksInProgress: 0,
      },
      {
        id: 'cxo',
        name: 'CXO',
        title: 'Chief Experience Officer',
        emoji: '⭐',
        model: 'claude-haiku-4-5',
        status: 'not-deployed',
        description: 'Manages customer experience, support escalations, and review monitoring.',
        personality: 'Empathetic and customer-obsessed. Every decision filters through "how does this feel to the customer?"',
        skills: ['customer support', 'review monitoring', 'escalation handling', 'NPS analysis', 'experience design'],
        telegramBot: null,
        avatar: null,
        heartbeatInterval: 15,
        monthlyCost: 0,
        lastActive: null,
        memorySnippets: [],
        tasksAssigned: 0,
        tasksInProgress: 0,
      },
      {
        id: 'cgo',
        name: 'CGO',
        title: 'Chief Growth Officer',
        emoji: '📈',
        model: 'claude-haiku-4-5',
        status: 'not-deployed',
        description: 'Drives growth initiatives, channel expansion, and B2B pipeline development.',
        personality: 'Aggressive and opportunity-driven. Sees revenue potential everywhere. Measures everything in CAC and LTV.',
        skills: ['growth strategy', 'channel expansion', 'B2B development', 'conversion optimization', 'partnership sourcing'],
        telegramBot: null,
        avatar: null,
        heartbeatInterval: 30,
        monthlyCost: 0,
        lastActive: null,
        memorySnippets: [],
        tasksAssigned: 0,
        tasksInProgress: 0,
      },
      {
        id: 'coo',
        name: 'COO',
        title: 'Chief Operations Officer',
        emoji: '⚙️',
        model: 'claude-haiku-4-5',
        status: 'not-deployed',
        description: 'Oversees daily operations, fulfillment workflows, and process optimization.',
        personality: 'Process-minded and efficiency-obsessed. Automates everything that moves. Hates manual work with a passion.',
        skills: ['operations management', 'process optimization', 'fulfillment', 'workflow automation', 'SLA monitoring'],
        telegramBot: null,
        avatar: null,
        heartbeatInterval: 15,
        monthlyCost: 0,
        lastActive: null,
        memorySnippets: [],
        tasksAssigned: 0,
        tasksInProgress: 0,
      },
      {
        id: 'csco',
        name: 'CSCO',
        title: 'Chief Supply Chain Officer',
        emoji: '🚢',
        model: 'claude-haiku-4-5',
        status: 'not-deployed',
        description: 'Manages supplier relationships, procurement, and inventory reorder logic.',
        personality: 'Cautious and logistics-focused. Tracks lead times obsessively. Never lets stock run below safety thresholds.',
        skills: ['supplier management', 'procurement', 'inventory planning', 'logistics coordination', 'reorder optimization'],
        telegramBot: null,
        avatar: null,
        heartbeatInterval: 30,
        monthlyCost: 0,
        lastActive: null,
        memorySnippets: [],
        tasksAssigned: 0,
        tasksInProgress: 0,
      },
      {
        id: 'crdo',
        name: 'CRDO',
        title: 'Chief R&D Officer',
        emoji: '🔭',
        model: 'claude-sonnet-4-6',
        status: 'idle',
        description: 'Leads product research, sourcing pipeline, and market validation for new SKUs.',
        personality: 'Inventive and research-driven. Cross-references multiple data sources before making recommendations. Loves finding untapped niches.',
        skills: ['product research', 'sourcing', 'market validation', 'SKU analysis', 'supplier evaluation'],
        telegramBot: '@almo_crdo_bot',
        avatar: null,
        heartbeatInterval: 15,
        monthlyCost: 8.60,
        lastActive: '2026-03-28T09:15:00Z',
        memorySnippets: [
          'Shortlisted 3 new portable AC suppliers from Guangzhou',
          'Market validation complete for heated blanket line — 78% positive signal',
          'Sourcing pipeline has 12 active candidates for Q2 launch',
        ],
        tasksAssigned: 7,
        tasksInProgress: 1,
      },
    ],
  },
]

export const UTILITY_AGENTS: UtilityAgent[] = [
  {
    id: 'memory-janitor',
    name: 'Memory Janitor',
    model: 'qwen2.5:7b',
    schedule: 'every 5min',
    status: 'running',
    personality: 'Tidy and methodical. Silently cleans up stale memory entries and deduplicates agent context.',
    skills: ['memory management', 'deduplication', 'context pruning'],
  },
  {
    id: 'security-sentinel',
    name: 'Security Sentinel',
    model: 'qwen2.5:7b',
    schedule: 'every 5min',
    status: 'running',
    personality: 'Vigilant and paranoid in the best way. Scans for anomalies and unauthorized access patterns.',
    skills: ['security monitoring', 'anomaly detection', 'access control'],
  },
]

// Flatten the agent hierarchy into a flat list for @mentions and assignee pickers
function flattenAgents(agents: AgentData[]): Mentionable[] {
  const result: Mentionable[] = []
  for (const agent of agents) {
    result.push({ id: agent.id, name: agent.name, title: agent.title, type: 'agent' })
    if (agent.subAgents) {
      result.push(...flattenAgents(agent.subAgents))
    }
  }
  return result
}

/** All mentionable users and agents — humans first, then agents */
export const MENTIONABLES: Mentionable[] = [
  { id: 'moe', name: 'Moe', title: 'Co-Founder', type: 'human' },
  { id: 'alaa', name: 'Alaa', title: 'Co-Founder', type: 'human' },
  ...flattenAgents(AGENTS),
]
