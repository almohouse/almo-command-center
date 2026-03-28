import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { AGENTS as AGENT_DATA, UTILITY_AGENTS, type AgentData, type AgentStatus } from '@/data/agents'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatAgent {
  id: string
  name: string
  status: AgentStatus
  model: string
  subAgents?: ChatAgent[]
}

interface Message {
  id: string
  role: 'user' | 'agent'
  sender: string
  text: string
  time: string
}

// ─── Build chat agent list from shared roster ────────────────────────────────

function toChatAgent(a: AgentData): ChatAgent {
  return {
    id: a.id,
    name: a.name,
    status: a.status,
    model: a.model,
    subAgents: a.subAgents?.map(toChatAgent),
  }
}

const AGENTS: ChatAgent[] = [
  ...AGENT_DATA.flatMap(a => {
    const root: ChatAgent = { id: a.id, name: a.name, status: a.status, model: a.model }
    const subs: ChatAgent[] = []
    if (a.subAgents) {
      for (const sub of a.subAgents) {
        if (sub.subAgents && sub.subAgents.length > 0) {
          subs.push(toChatAgent(sub))
        } else {
          subs.push({ id: sub.id, name: sub.name, status: sub.status, model: sub.model })
        }
      }
      root.subAgents = subs
    }
    return [root]
  }),
  ...UTILITY_AGENTS.map(u => ({ id: u.id, name: u.name, status: u.status, model: u.model })),
]

const MOCK_CONVERSATIONS: Record<string, Message[]> = {
  dceo: [
    {
      id: 'm1',
      role: 'user',
      sender: 'Moe',
      text: "What's the status of the Mission Control build?",
      time: '11:32 AM',
    },
    {
      id: 'm2',
      role: 'agent',
      sender: 'DCEO',
      text: "The CTO has completed the core navigation and layout. We're now in Phase 2 building all 21 pages. ETA: 2-3 days for full build completion. CTO reports the tech stack is solid.",
      time: '11:32 AM',
    },
    {
      id: 'm3',
      role: 'user',
      sender: 'Moe',
      text: 'Any blockers?',
      time: '11:34 AM',
    },
    {
      id: 'm4',
      role: 'agent',
      sender: 'DCEO',
      text: "One blocker: the Airtable integration needs API key configuration. CFO deployment is also pending — recommend activating for financial data access.",
      time: '11:34 AM',
    },
    {
      id: 'm5',
      role: 'user',
      sender: 'Moe',
      text: 'Got it. Proceed.',
      time: '11:35 AM',
    },
    {
      id: 'm6',
      role: 'agent',
      sender: 'DCEO',
      text: "Acknowledged. CTO will continue the build. I'll brief CFO on the integration requirements upon deployment.",
      time: '11:35 AM',
    },
  ],
  cto: [
    {
      id: 'c1',
      role: 'user',
      sender: 'Moe',
      text: 'How many pages are left to build?',
      time: '10:15 AM',
    },
    {
      id: 'c2',
      role: 'agent',
      sender: 'CTO',
      text: '16 pages remain after the current sprint. CTO-Builder is on track. No critical blockers on my end.',
      time: '10:15 AM',
    },
  ],
  scout: [
    {
      id: 's1',
      role: 'user',
      sender: 'Moe',
      text: 'What are the trending products in Saudi right now?',
      time: 'Yesterday',
    },
    {
      id: 's2',
      role: 'agent',
      sender: 'Scout',
      text: 'TikTok data shows strong velocity for ergonomic desk accessories, especially keyboard trays and monitor arms. The keyboard tray category is up 38% MoM on TikTok SA.',
      time: 'Yesterday',
    },
  ],
  crdo: [],
  'memory-janitor': [],
}

const MOCK_RESPONSES: Record<string, string> = {
  dceo: "Understood. I'll escalate this to the relevant chiefs and report back within the hour.",
  cto: 'Processing your request. I have the full technical context — will respond shortly.',
  scout: "Noted. I'll run a market scan and surface the relevant data points.",
  crdo: "Received. I'll analyze the research landscape and get back to you with findings.",
  'memory-janitor': 'Memory operations acknowledged. Running maintenance cycle.',
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
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

const STATUS_DOT: Record<AgentStatus, string> = {
  running: 'bg-secondary animate-pulse',
  idle: 'bg-on-surface-variant/30',
  'not-deployed': '',
}

function StatusDot({ status }: { status: AgentStatus }) {
  if (status === 'not-deployed') {
    return (
      <span className="w-2 h-2 rounded-full border border-on-surface-variant/30 shrink-0 inline-block" />
    )
  }
  return <span className={`w-2 h-2 rounded-full shrink-0 inline-block ${STATUS_DOT[status]}`} />
}

function StatusLabel({ status }: { status: AgentStatus }) {
  const map: Record<AgentStatus, { text: string; cls: string }> = {
    running: { text: 'Running', cls: 'bg-secondary/10 text-secondary border-secondary/20' },
    idle: { text: 'Idle', cls: 'bg-surface-container-high text-on-surface-variant border-primary/[0.06]' },
    'not-deployed': { text: 'Not Deployed', cls: 'bg-surface-container-high text-on-surface-variant/50 border-primary/[0.04]' },
  }
  const { text, cls } = map[status]
  return (
    <span className={`text-[9px] font-bold tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-full border ${cls}`}>
      {text}
    </span>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Chat() {
  const [searchParams] = useSearchParams()
  const initialAgent = searchParams.get('agent') ?? 'dceo'

  const [selectedAgent, setSelectedAgent] = useState<string>(initialAgent)
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set(['cto']))
  const [conversations, setConversations] = useState<Record<string, Message[]>>(MOCK_CONVERSATIONS)
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const agent = AGENTS.find((a) => a.id === selectedAgent) ??
    AGENTS.flatMap((a) => a.subAgents ?? []).find((s) => s.id === selectedAgent)

  const messages = conversations[selectedAgent] ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function toggleExpand(agentId: string) {
    setExpandedAgents((prev) => {
      const next = new Set(prev)
      if (next.has(agentId)) next.delete(agentId)
      else next.add(agentId)
      return next
    })
  }

  function sendMessage() {
    const text = inputText.trim()
    if (!text || !agent || agent.status === 'not-deployed') return

    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      sender: 'Moe',
      text,
      time: now,
    }

    setConversations((prev) => ({
      ...prev,
      [selectedAgent]: [...(prev[selectedAgent] ?? []), userMsg],
    }))
    setInputText('')
    setIsTyping(true)

    setTimeout(() => {
      const response =
        MOCK_RESPONSES[selectedAgent] ??
        "I've received your message and will process it shortly."
      const agentMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'agent',
        sender: agent.name,
        text: response,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }
      setConversations((prev) => ({
        ...prev,
        [selectedAgent]: [...(prev[selectedAgent] ?? []), agentMsg],
      }))
      setIsTyping(false)
    }, 1000)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isNotDeployed = agent?.status === 'not-deployed'

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex overflow-hidden"
      style={{ height: 'calc(100vh - 64px)', marginTop: '-2rem', marginLeft: '-2rem', marginRight: '-2rem' }}
    >
      {/* ── Agent List ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col border-r border-primary/[0.08] overflow-hidden"
        style={{ width: 320, minWidth: 320 }}
      >
        <div className="px-5 pt-6 pb-4 border-b border-primary/[0.08]">
          <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary">Chat</div>
          <div className="text-[11px] text-on-surface-variant mt-1">Select an agent to message</div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {AGENTS.map((a) => {
            const isSelected = selectedAgent === a.id
            const isExpanded = expandedAgents.has(a.id)
            return (
              <div key={a.id}>
                {/* Main agent row */}
                <div
                  className="relative"
                  onMouseEnter={() => a.status === 'not-deployed' ? setHoveredAgent(a.id) : undefined}
                  onMouseLeave={() => setHoveredAgent(null)}
                >
                  <button
                    onClick={() => {
                      if (a.status !== 'not-deployed') setSelectedAgent(a.id)
                    }}
                    disabled={a.status === 'not-deployed'}
                    className={`w-full flex items-center gap-3 px-5 py-3 transition-all text-left ${
                      isSelected
                        ? 'bg-primary/[0.08]'
                        : a.status === 'not-deployed'
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-primary/[0.04]'
                    }`}
                  >
                    <StatusDot status={a.status} />
                    <span className={`text-sm font-semibold flex-1 ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                      {a.name}
                    </span>
                    <span className="text-[9px] font-mono text-on-surface-variant/50 shrink-0 hidden sm:inline">{a.model.split('-').slice(1, 3).join('-')}</span>
                    <StatusLabel status={a.status} />
                    {a.subAgents && a.subAgents.length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(a.id) }}
                        className="text-on-surface-variant hover:text-primary transition-colors ml-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                    )}
                  </button>
                  {/* Not deployed tooltip */}
                  {hoveredAgent === a.id && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 glass-card border border-primary/[0.08] text-xs text-on-surface-variant whitespace-nowrap z-10">
                      Agent not deployed
                    </div>
                  )}
                </div>

                {/* Sub-agents */}
                {a.subAgents && isExpanded && (
                  <div className="ml-6 border-l border-primary/[0.08]">
                    {a.subAgents.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedAgent(sub.id)}
                        className={`w-full flex items-center gap-3 pl-4 pr-5 py-2.5 transition-all text-left ${
                          selectedAgent === sub.id ? 'bg-primary/[0.08]' : 'hover:bg-primary/[0.04]'
                        }`}
                      >
                        <StatusDot status={sub.status} />
                        <span className={`text-xs font-semibold flex-1 ${selectedAgent === sub.id ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {sub.name}
                        </span>
                        <span className="text-[8px] font-mono text-on-surface-variant/40 shrink-0 hidden sm:inline">{sub.model.split('-').slice(1, 3).join('-')}</span>
                        <StatusLabel status={sub.status} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Chat Area ──────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex-1 flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-primary/[0.08] shrink-0">
          <StatusDot status={agent?.status ?? 'idle'} />
          <div>
            <div className="text-sm font-bold text-primary">{agent?.name ?? 'Select Agent'}</div>
            <div className="text-[11px] text-on-surface-variant capitalize">{agent?.status?.replace('-', ' ')}</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-3">forum</span>
              <div className="text-sm text-on-surface-variant">
                {isNotDeployed
                  ? 'This agent is not deployed yet.'
                  : 'No messages yet. Start a conversation.'}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className="text-[10px] font-bold tracking-[0.1em] text-on-surface-variant uppercase mb-1 px-1">
                  {msg.sender} · {msg.time}
                </div>
                <div
                  className={`max-w-xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-primary/10 border border-primary/20 text-on-surface text-right'
                      : 'glass-panel-purple text-on-surface'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            )
          })}

          {isTyping && (
            <div className="flex flex-col items-start">
              <div className="text-[10px] font-bold tracking-[0.1em] text-on-surface-variant uppercase mb-1 px-1">
                {agent?.name}
              </div>
              <div className="glass-panel-purple rounded-2xl">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-primary/[0.08] shrink-0">
          {isNotDeployed ? (
            <div className="glass-card px-4 py-3 text-sm text-on-surface-variant text-center border border-yellow-500/20">
              <span className="text-yellow-400 font-semibold">Not Deployed</span> — Deploy this agent from the{' '}
              <button
                onClick={() => window.location.assign('/org')}
                className="text-secondary hover:text-primary underline underline-offset-2 transition-colors"
              >
                Org Chart
              </button>{' '}
              to start a conversation.
            </div>
          ) : (
            <div className="flex gap-3 items-end">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${agent?.name ?? ''}...`}
                rows={1}
                className="flex-1 bg-surface-container-high border border-primary/[0.08] rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/30 resize-none"
                style={{ maxHeight: 120, overflowY: 'auto' }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isTyping}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                Send
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
