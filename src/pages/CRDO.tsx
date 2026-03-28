import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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

type RequestType = 'Product Research' | 'Supplier Research' | 'Market Analysis' | 'Competitor Analysis'
type Priority    = 'High' | 'Medium' | 'Low'
type ActiveTab   = 'request' | 'active' | 'ledger'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const ACTIVE_RESEARCH = [
  {
    id: 'RD-005',
    title: 'Keyboard Tray Supplier Identification',
    status: 'In Progress' as const,
    started: '2d ago',
    progress: 60,
    update: 'Identified 5 suppliers in Guangzhou and Yiwu. Requesting MOQ and pricing for 3 shortlisted factories.',
  },
  {
    id: 'RD-006',
    title: 'Weighted Blanket Market Sizing',
    status: 'In Progress' as const,
    started: '5d ago',
    progress: 80,
    update: 'Market size estimated at 42M SAR annually in KSA. Finalizing demographics breakdown by region.',
  },
  {
    id: 'RD-007',
    title: 'Ergonomic Chair Competitor Landscape',
    status: 'Pending' as const,
    started: '1h ago',
    progress: 5,
    update: 'Queued for Scout processing. Estimated start: next session cycle.',
  },
]

const LEDGER = [
  { id: 'RD-001', title: 'Cocoon Pro Market Analysis',    type: 'Market',       completed: 'Mar 10', outcome: 'Launched',       agent: 'Scout' },
  { id: 'RD-002', title: 'B2B Pricing Study',              type: 'Market',       completed: 'Mar 15', outcome: 'Applied',        agent: 'CRDO'  },
  { id: 'RD-003', title: 'Aramco RFQ Analysis',            type: 'Business Dev', completed: 'Mar 20', outcome: 'Submitted',      agent: 'DCEO'  },
  { id: 'RD-004', title: 'Saudi TikTok Strategy',          type: 'Marketing',    completed: 'Mar 22', outcome: 'Sent to CMO',    agent: 'Scout' },
]

// ─── CRDO Page ────────────────────────────────────────────────────────────────

export default function CRDO() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<ActiveTab>('request')

  const [reqType,    setReqType]    = useState<RequestType>('Product Research')
  const [reqTitle,   setReqTitle]   = useState('')
  const [reqDesc,    setReqDesc]    = useState('')
  const [reqPriority, setReqPriority] = useState<Priority>('Medium')
  const [reqDeadline, setReqDeadline] = useState('')
  const [toast, setToast]           = useState('')

  // Accept pre-fill from Goals page deep research
  useEffect(() => {
    const prefill = (location.state as { prefill?: { reqType?: string; reqTitle?: string; reqDesc?: string; reqPriority?: string } } | null)?.prefill
    if (prefill) {
      if (prefill.reqType) setReqType(prefill.reqType as RequestType)
      if (prefill.reqTitle) setReqTitle(prefill.reqTitle)
      if (prefill.reqDesc) setReqDesc(prefill.reqDesc)
      if (prefill.reqPriority) setReqPriority(prefill.reqPriority as Priority)
      setActiveTab('request')
      // Clear navigation state to prevent re-filling on back
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const [pausedItems, setPausedItems] = useState<Set<string>>(new Set())

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleSubmit() {
    if (!reqTitle.trim()) return
    try {
      await fetch('/api/crdo/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reqType, title: reqTitle, description: reqDesc, priority: reqPriority, deadline: reqDeadline }),
      })
    } catch { /* dev */ }
    showToast(`Request submitted: "${reqTitle}"`)
    setReqTitle('')
    setReqDesc('')
  }

  const tabs = [
    { key: 'request', label: 'New Request' },
    { key: 'active',  label: 'Active Research' },
    { key: 'ledger',  label: 'R&D Ledger' },
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
          Research & Development
        </div>
        <h1 className="text-4xl font-black text-primary">CRDO</h1>
        <p className="text-sm text-on-surface-variant mt-1">Chief Research & Development Officer department</p>
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

      {/* New Request tab */}
      {activeTab === 'request' && (
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="glass-card p-6 space-y-5">
              <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary">
                Submit Research Request
              </div>

              {/* Request type */}
              <div>
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
                  Request Type
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['Product Research', 'Supplier Research', 'Market Analysis', 'Competitor Analysis'] as RequestType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setReqType(t)}
                      className={[
                        'px-3.5 py-1.5 rounded-xl text-[12px] font-bold border transition-all',
                        reqType === t
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : 'bg-surface-container-high/60 border-primary/[0.08] text-on-surface-variant hover:text-primary',
                      ].join(' ')}
                    >
                      {t}
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
                  placeholder="e.g. Keyboard Tray Supplier Search — Guangzhou"
                  className="w-full bg-surface-container-high/60 border border-primary/[0.08] rounded-xl px-4 py-2.5 text-sm text-primary placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/30"
                />
              </div>

              {/* Description */}
              <div>
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
                  Brief Description
                </div>
                <textarea
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  rows={4}
                  placeholder="Describe the research objective, target outcome, and any specific constraints..."
                  className="w-full bg-surface-container-high/60 border border-primary/[0.08] rounded-xl px-4 py-3 text-sm text-primary placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/30 resize-none"
                />
              </div>

              {/* Priority + Deadline row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
                    Priority
                  </div>
                  <div className="flex gap-2">
                    {(['High', 'Medium', 'Low'] as Priority[]).map((p) => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="priority"
                          checked={reqPriority === p}
                          onChange={() => setReqPriority(p)}
                          className="accent-primary"
                        />
                        <span className={`text-sm font-semibold ${
                          p === 'High' ? 'text-[#ff6e84]' :
                          p === 'Medium' ? 'text-yellow-400' : 'text-on-surface-variant'
                        }`}>
                          {p}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
                    Deadline (Optional)
                  </div>
                  <input
                    type="date"
                    value={reqDeadline}
                    onChange={(e) => setReqDeadline(e.target.value)}
                    className="w-full bg-surface-container-high/60 border border-primary/[0.08] rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary/30"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/15 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                Submit Request
              </button>
            </div>
          </div>

          {/* Side info */}
          <div className="space-y-4">
            <div className="glass-card p-5">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">
                Active Agents
              </div>
              {[
                { name: 'Scout',  status: 'running', task: 'Keyboard Tray research' },
                { name: 'CRDO',   status: 'idle',    task: 'Awaiting requests' },
              ].map((a) => (
                <div key={a.name} className="flex items-center gap-3 py-2">
                  <span className={`w-2 h-2 rounded-full ${a.status === 'running' ? 'bg-secondary animate-pulse' : 'bg-on-surface-variant/30'}`} />
                  <span className="text-sm font-semibold text-primary">{a.name}</span>
                  <span className="text-[11px] text-on-surface-variant ml-auto">{a.task}</span>
                </div>
              ))}
            </div>
            <div className="glass-card p-5">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">
                Queue Stats
              </div>
              {[
                { label: 'Active',    value: '3' },
                { label: 'Completed', value: '4' },
                { label: 'Avg Time',  value: '3.2 days' },
              ].map((s) => (
                <div key={s.label} className="flex justify-between py-1.5 border-b border-primary/[0.04] last:border-0">
                  <span className="text-[11px] text-on-surface-variant">{s.label}</span>
                  <span className="text-sm font-semibold text-primary">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Research tab */}
      {activeTab === 'active' && (
        <motion.div variants={itemVariants} className="space-y-4">
          {ACTIVE_RESEARCH.map((item) => {
            const isPaused = pausedItems.has(item.id)
            return (
              <div key={item.id} className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${item.status === 'In Progress' ? 'bg-secondary animate-pulse' : 'bg-on-surface-variant/30'}`} />
                      <span className={`text-[10px] font-bold tracking-[0.08em] uppercase ${item.status === 'In Progress' ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        {isPaused ? 'Paused' : item.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-primary">{item.title}</h3>
                    <span className="text-[11px] text-on-surface-variant">Started {item.started}</span>
                  </div>
                  <span className="text-[11px] font-mono text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded-lg">
                    {item.id}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] text-on-surface-variant mb-1.5">
                    <span>Progress</span>
                    <span className="font-semibold text-primary">{item.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all"
                      style={{ width: `${item.progress}%`, boxShadow: '0 0 6px #cacafe' }}
                    />
                  </div>
                </div>

                <p className="text-[12px] text-on-surface-variant mb-4 italic">
                  Last update: {item.update}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try { await fetch(`/api/crdo/requests/${item.id}`) } catch { /* dev */ }
                      showToast(`Viewing details: ${item.title}`)
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high/60 border border-primary/[0.08] text-on-surface-variant text-[12px] font-semibold hover:text-primary transition-all"
                  >
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    View Details
                  </button>
                  {item.status !== 'Pending' && (
                    <button
                      onClick={() => {
                        setPausedItems((prev) => {
                          const next = new Set(prev)
                          if (next.has(item.id)) next.delete(item.id)
                          else next.add(item.id)
                          return next
                        })
                        showToast(isPaused ? `Resumed: ${item.title}` : `Paused: ${item.title}`)
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-400/[0.06] border border-yellow-400/20 text-yellow-400 text-[12px] font-semibold hover:bg-yellow-400/10 transition-all"
                    >
                      <span className="material-symbols-outlined text-[13px]">{isPaused ? 'play_arrow' : 'pause'}</span>
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                  )}
                  {item.status === 'Pending' && (
                    <button
                      onClick={() => showToast(`Cancelled: ${item.title}`)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff6e84]/[0.06] border border-[#ff6e84]/20 text-[#ff6e84] text-[12px] font-semibold hover:bg-[#ff6e84]/10 transition-all"
                    >
                      <span className="material-symbols-outlined text-[13px]">cancel</span>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </motion.div>
      )}

      {/* R&D Ledger tab */}
      {activeTab === 'ledger' && (
        <motion.div variants={itemVariants} className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/[0.08]">
                  {['Research ID', 'Title', 'Type', 'Completed', 'Outcome', 'Agent'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase px-5 py-3.5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LEDGER.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b border-primary/[0.04] last:border-0 hover:bg-primary/[0.02] transition-all ${
                      i % 2 === 0 ? '' : 'bg-primary/[0.01]'
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded-lg">
                        {row.id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-primary">{row.title}</td>
                    <td className="px-5 py-3.5 text-on-surface-variant">{row.type}</td>
                    <td className="px-5 py-3.5 text-on-surface-variant">{row.completed}</td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-secondary">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        {row.outcome}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-on-surface-variant">{row.agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
