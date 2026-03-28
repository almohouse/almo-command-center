import { useState } from 'react'
import { motion } from 'motion/react'

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

type RequestCategory = 'New Feature' | 'Bug Fix' | 'Integration' | 'Infrastructure' | 'UI/Design'
type TabKey          = 'request' | 'ba' | 'pipeline'

interface ChatMessage {
  role: 'moe' | 'ba'
  text: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_CHAT: ChatMessage[] = [
  { role: 'moe', text: 'I need a feature to export all sales data to Excel' },
  { role: 'ba',  text: 'I\'ll help document this requirement. What data fields are needed? (orders, revenue, customers, products?)' },
  { role: 'moe', text: 'All of them. Monthly and weekly views.' },
  { role: 'ba',  text: 'Understood. I\'ll create ticket ALMO-102: Data Export — CSV/Excel with configurable date range and field selection. Story points: 5. Ready for sprint?' },
]

const PIPELINE_ITEMS = [
  {
    id: '1',
    title: 'MC-V2 Frontend Build',
    status: 'In Progress' as const,
    progress: 65,
    lastCommit: 'CTO committed 2h ago: Add Tasks page',
  },
  {
    id: '2',
    title: 'Airtable Integration',
    status: 'Blocked' as const,
    progress: 30,
    lastCommit: 'CTO committed 1d ago: Partial sync logic',
  },
  {
    id: '3',
    title: 'B2B Pipeline Tool',
    status: 'Planned' as const,
    progress: 10,
    lastCommit: 'CTO committed 3d ago: Initial schema',
  },
  {
    id: '4',
    title: 'CMO Deployment',
    status: 'Planned' as const,
    progress: 0,
    lastCommit: 'Not started',
  },
]

const STATUS_BADGE: Record<string, string> = {
  'In Progress': 'bg-secondary/10 text-secondary border-secondary/20',
  'Blocked':     'bg-[#ff6e84]/10 text-[#ff6e84] border-[#ff6e84]/20',
  'Planned':     'bg-[#acaaae]/10 text-[#acaaae] border-[#acaaae]/20',
}

const PROJECTS = ['MC-V2', 'B2B Tool', 'Salla Integration', 'Airtable Sync', 'Mobile App']

// ─── Factory Page ─────────────────────────────────────────────────────────────

export default function Factory() {
  const [activeTab, setActiveTab] = useState<TabKey>('request')

  // Submit Request form state
  const [reqCategory, setReqCategory] = useState<RequestCategory>('New Feature')
  const [reqTitle,    setReqTitle]    = useState('')
  const [reqDesc,     setReqDesc]     = useState('')
  const [reqPriority, setReqPriority] = useState('Medium')
  const [reqProject,  setReqProject]  = useState('MC-V2')
  const [toast, setToast]             = useState('')

  // BA Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT)
  const [chatInput,    setChatInput]    = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleSubmitRequest() {
    if (!reqTitle.trim()) return
    try {
      await fetch('/api/factory/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: reqCategory, title: reqTitle, description: reqDesc, priority: reqPriority, project: reqProject }),
      })
    } catch { /* dev */ }
    showToast(`Request submitted to CTO: "${reqTitle}"`)
    setReqTitle('')
    setReqDesc('')
  }

  function handleChatSend() {
    if (!chatInput.trim()) return
    const userMsg: ChatMessage = { role: 'moe', text: chatInput }
    const baReply: ChatMessage = {
      role: 'ba',
      text: `Got it. I'll document this requirement and create a structured ticket for the CTO sprint. Can you confirm the expected behavior when the data is empty?`,
    }
    setChatMessages((prev) => [...prev, userMsg, baReply])
    setChatInput('')
  }

  const tabs = [
    { key: 'request',  label: 'Submit Request' },
    { key: 'ba',       label: 'BA Chat' },
    { key: 'pipeline', label: 'Pipeline Overview' },
  ] as const

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-16"
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-secondary/20 border border-secondary/30 text-secondary text-sm font-semibold backdrop-blur-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
          CTO Build System
        </div>
        <h1 className="text-4xl font-black text-primary">Software Factory</h1>
        <p className="text-sm text-on-surface-variant mt-1">Submit requests, gather requirements, and track build pipeline</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-1 bg-surface-container-high/60 backdrop-blur-xl border border-primary/[0.08] rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={[
                'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                activeTab === t.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:text-primary',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Submit Request tab */}
      {activeTab === 'request' && (
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6">
          <div className="col-span-2 glass-card p-6 space-y-5">
            <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary">New Request</div>

            {/* Category */}
            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
                Category
              </div>
              <div className="flex flex-wrap gap-2">
                {(['New Feature', 'Bug Fix', 'Integration', 'Infrastructure', 'UI/Design'] as RequestCategory[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setReqCategory(c)}
                    className={[
                      'px-3.5 py-1.5 rounded-xl text-[12px] font-bold border transition-all',
                      reqCategory === c
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'bg-surface-container-high/60 border-primary/[0.08] text-on-surface-variant hover:text-primary',
                    ].join(' ')}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
                Title
              </div>
              <input
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                placeholder="e.g. Add CSV export to Orders page"
                className="w-full bg-surface-container-high/60 border border-primary/[0.08] rounded-xl px-4 py-2.5 text-sm text-primary placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/30"
              />
            </div>

            {/* Description */}
            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
                Detailed Description
              </div>
              <textarea
                value={reqDesc}
                onChange={(e) => setReqDesc(e.target.value)}
                rows={5}
                placeholder="Describe the feature, use case, acceptance criteria, and any edge cases..."
                className="w-full bg-surface-container-high/60 border border-primary/[0.08] rounded-xl px-4 py-3 text-sm text-primary placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/30 resize-none"
              />
            </div>

            {/* Priority + Project row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
                  Priority
                </div>
                <select
                  value={reqPriority}
                  onChange={(e) => setReqPriority(e.target.value)}
                  className="w-full bg-surface-container-high/60 border border-primary/[0.08] rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary/30"
                >
                  {['High', 'Medium', 'Low'].map((p) => (
                    <option key={p} value={p} className="bg-[#0e0e11]">{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
                  Attach to Project
                </div>
                <select
                  value={reqProject}
                  onChange={(e) => setReqProject(e.target.value)}
                  className="w-full bg-surface-container-high/60 border border-primary/[0.08] rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary/30"
                >
                  {PROJECTS.map((p) => (
                    <option key={p} value={p} className="bg-[#0e0e11]">{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSubmitRequest}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/15 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              Submit to CTO
            </button>
          </div>

          {/* Sprint info card */}
          <div className="glass-card p-5 h-fit">
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-4">
              Current Sprint
            </div>
            <div className="text-lg font-black text-primary mb-1">MC-V2 Phase 2</div>
            <div className="text-[11px] text-on-surface-variant mb-4">Mar 26 – Apr 5, 2026</div>
            {[
              { label: 'Velocity',  value: '8 pts/day' },
              { label: 'Team',      value: 'CTO · Planner · Builder' },
              { label: 'Open Tickets', value: '14' },
              { label: 'Completed',    value: '6' },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-2 border-b border-primary/[0.04] last:border-0">
                <span className="text-[11px] text-on-surface-variant">{row.label}</span>
                <span className="text-[12px] font-semibold text-primary">{row.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* BA Chat tab */}
      {activeTab === 'ba' && (
        <motion.div variants={itemVariants} className="glass-card overflow-hidden flex flex-col" style={{ height: 520 }}>
          <div className="px-5 py-3.5 border-b border-primary/[0.08] flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#ff9fe3]/10 border border-[#ff9fe3]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[15px] text-[#ff9fe3]">psychology</span>
            </div>
            <div>
              <div className="text-sm font-bold text-primary">CTO Business Analyst</div>
              <div className="text-[10px] text-on-surface-variant/60">Requirements gathering · Active</div>
            </div>
            <span className="ml-auto w-2 h-2 rounded-full bg-secondary animate-pulse" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'moe' ? 'justify-end' : 'justify-start'}`}>
                <div className={[
                  'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                  msg.role === 'moe'
                    ? 'bg-primary/10 border border-primary/20 text-primary rounded-br-sm'
                    : 'bg-surface-container-high border border-primary/[0.08] text-on-surface-variant rounded-bl-sm',
                ].join(' ')}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-primary/[0.08] flex gap-3">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleChatSend()
                }
              }}
              placeholder="Ask the BA..."
              rows={2}
              className="flex-1 bg-surface-container-high/60 border border-primary/[0.08] rounded-xl px-4 py-2.5 text-sm text-primary placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/30 resize-none"
            />
            <button
              onClick={handleChatSend}
              className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/15 transition-all self-end"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Pipeline Overview tab */}
      {activeTab === 'pipeline' && (
        <motion.div variants={itemVariants} className="space-y-4">
          {PIPELINE_ITEMS.map((item) => (
            <div key={item.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-primary">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border ${STATUS_BADGE[item.status]}`}>
                      {item.status}
                    </span>
                    {item.status === 'Blocked' && (
                      <span className="text-[11px] text-[#ff6e84] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">warning</span>
                        Needs API key
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-3xl font-black text-primary">{item.progress}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${item.progress}%`,
                    background: item.status === 'Blocked' ? '#ff6e84' : item.status === 'In Progress' ? '#cacafe' : '#acaaae',
                    boxShadow: item.status === 'In Progress' ? '0 0 6px #cacafe' : 'none',
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/60">
                  <span className="material-symbols-outlined text-[12px]">commit</span>
                  {item.lastCommit}
                </div>
                <button
                  onClick={() => showToast('GitHub integration not connected')}
                  className="flex items-center gap-1.5 text-[11px] text-on-surface-variant hover:text-primary transition-colors font-semibold"
                >
                  <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  View on GitHub
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
