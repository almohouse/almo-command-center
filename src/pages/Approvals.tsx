import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type ApprovalType = 'GATE' | 'STANDARD'

interface Approval {
  id: string
  title: string
  status: ApprovalStatus
  type: ApprovalType
  requestedBy: string
  decidedBy?: string
  decisionNote?: string
  timeAgo: string
  timestamp: string
  description: string
  impact: string
  recommendation: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_APPROVALS: Approval[] = [
  {
    id: 'APR-0042',
    title: 'Agent Deployment Strategy',
    status: 'PENDING',
    type: 'GATE',
    requestedBy: 'DCEO',
    timeAgo: '2h ago',
    timestamp: 'Mar 27, 2026 · 11:34 AM',
    description:
      'The DCEO has submitted a comprehensive deployment strategy for the remaining agent roster including CFO, CMO, CXO, CGO, COO, and CSCO agents. This gate file requires founder review before any deployment actions are taken. The phased rollout plan has been prepared with risk assessments for each agent.',
    impact:
      'Deploying all remaining agents will significantly increase operational automation coverage. Each agent will require model allocation, Airtable access, and integration with existing workflows. Estimated cost impact: +340 SAR/month in API usage. Total system load will increase by approximately 40%.',
    recommendation:
      'DCEO recommends a phased rollout: CFO first for financial data access, followed by CMO for marketing automation. The remaining chiefs can be deployed in Q2 after validating the initial cohort performance over 2 weeks.',
  },
  {
    id: 'APR-0041',
    title: 'Budget Override — Aramco Deal',
    status: 'APPROVED',
    type: 'STANDARD',
    requestedBy: 'CFO',
    decidedBy: 'Moe',
    decisionNote: 'Approved for Q1 push',
    timeAgo: '1d ago',
    timestamp: 'Mar 26, 2026 · 09:15 AM',
    description:
      'CFO submitted a budget override request for the Aramco corporate gifting deal. The deal requires custom packaging and expedited shipping, pushing the unit cost above the standard margin floor set in the CFO model.',
    impact:
      'The override authorizes an additional 12,000 SAR in procurement budget for the Q1 close. Gross margin on this deal will be 24%, below the standard 30% floor, but the strategic value of landing Aramco as a B2B anchor client justifies the exception.',
    recommendation:
      'CFO recommends approving the override and flagging this as a strategic investment. The Aramco relationship is expected to yield 3–4 repeat orders per year at standard margin once onboarded.',
  },
  {
    id: 'APR-0040',
    title: 'Scope Change — MC Build',
    status: 'REJECTED',
    type: 'STANDARD',
    requestedBy: 'CTO',
    decidedBy: 'Alaa',
    decisionNote: 'Scope too broad',
    timeAgo: '3d ago',
    timestamp: 'Mar 24, 2026 · 04:22 PM',
    description:
      'CTO proposed expanding the Mission Control build scope to include a full ERP integration layer, real-time inventory sync with Salla, and a native mobile companion app within the current sprint.',
    impact:
      'Scope expansion would add approximately 6–8 weeks of development effort, delaying the Phase 2 page build and pushing the full MC launch from April to June. Infrastructure costs would increase by an estimated 1,800 SAR/month.',
    recommendation:
      'CTO recommended accepting the expanded scope to reduce technical debt later. However, the change was rejected citing the critical need to launch core functionality first before expanding scope.',
  },
  {
    id: 'APR-0039',
    title: 'New Agent: CMO Deployment',
    status: 'PENDING',
    type: 'GATE',
    requestedBy: 'DCEO',
    timeAgo: '5d ago',
    timestamp: 'Mar 22, 2026 · 10:00 AM',
    description:
      'DCEO has flagged the deployment of the CMO agent as a high-priority action item. The CMO will handle TikTok content strategy, paid media briefings, and influencer coordination for the Saudi market.',
    impact:
      'CMO deployment will automate 80% of marketing planning tasks currently handled manually. Expected to reduce marketing decision latency from 3 days to same-day. API cost: +85 SAR/month.',
    recommendation:
      'DCEO recommends immediate deployment with a 2-week observation period before granting autonomous action capabilities. Initial scope limited to recommendations only.',
  },
  {
    id: 'APR-0038',
    title: 'Keyboard Tray B2B Pricing',
    status: 'APPROVED',
    type: 'STANDARD',
    requestedBy: 'CRDO',
    decidedBy: 'Moe',
    timeAgo: '6d ago',
    timestamp: 'Mar 21, 2026 · 02:45 PM',
    description:
      'CRDO submitted updated B2B pricing for the keyboard tray product targeting corporate bulk orders. The new tier structure enables volume discounts starting at 10 units.',
    impact:
      'New pricing tiers: 1–9 units at standard MSRP, 10–49 units at 12% discount, 50+ units at 18% discount. Margin floor maintained at 30% across all tiers based on landed cost analysis.',
    recommendation:
      'CRDO recommends implementing the pricing structure immediately to support active B2B pipeline conversations with 3 prospects currently in negotiation.',
  },
  {
    id: 'APR-0037',
    title: 'Supplier Contract Sign',
    status: 'PENDING',
    type: 'STANDARD',
    requestedBy: 'CSCO',
    timeAgo: '7d ago',
    timestamp: 'Mar 20, 2026 · 11:10 AM',
    description:
      'CSCO has prepared a 12-month supply agreement with the Guangzhou manufacturer for Cocoon Pro components. Contract includes net-60 payment terms and a minimum order commitment of 200 units per quarter.',
    impact:
      'Signing locks in current pricing for 12 months, protecting against a projected 8–12% component cost increase in H2 2026. Minimum commitment represents 120,000 SAR in annualized orders.',
    recommendation:
      'CSCO recommends signing before April 1 to secure the locked-in pricing. Legal review completed; contract is favorable with no unusual risk clauses.',
  },
  {
    id: 'APR-0036',
    title: 'Marketing Budget Q2',
    status: 'APPROVED',
    type: 'STANDARD',
    requestedBy: 'CMO',
    decidedBy: 'Alaa',
    timeAgo: '8d ago',
    timestamp: 'Mar 19, 2026 · 09:00 AM',
    description:
      'CMO submitted the Q2 marketing budget allocation covering TikTok paid ads, influencer partnerships, and content production for the Saudi and UAE markets.',
    impact:
      'Total Q2 marketing budget: 48,000 SAR. Allocation: TikTok ads (22,000 SAR), influencer seeding (14,000 SAR), content production (8,000 SAR), miscellaneous (4,000 SAR). Projected ROAS: 3.2x based on Q1 benchmarks.',
    recommendation:
      'CMO recommends front-loading spend in April to capitalize on Ramadan shopping season, with a planned burst campaign during the Eid week.',
  },
]

const HISTORY = [
  { id: 'APR-0035', title: 'Reorder: Cocoon Pro Mesh', decided: 'APPROVED', by: 'Moe', when: '9d ago' },
  { id: 'APR-0034', title: 'New Channel: Noon.com', decided: 'APPROVED', by: 'Alaa', when: '11d ago' },
  { id: 'APR-0033', title: 'Headcount: Part-Time Packer', decided: 'REJECTED', by: 'Moe', when: '13d ago' },
  { id: 'APR-0032', title: 'Tool Subscription: Notion AI', decided: 'APPROVED', by: 'Moe', when: '15d ago' },
  { id: 'APR-0031', title: 'Price Increase: Cocoon Pro +5%', decided: 'APPROVED', by: 'Alaa', when: '18d ago' },
]

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

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const classes: Record<ApprovalStatus, string> = {
    PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    APPROVED: 'bg-secondary/10 text-secondary border-secondary/20',
    REJECTED: 'bg-error/10 text-error border-error/20',
  }
  return (
    <span
      className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border ${classes[status]}`}
    >
      {status}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Approvals() {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [selectedId, setSelectedId] = useState<string>('APR-0042')
  const [approvals, setApprovals] = useState<Approval[]>(INITIAL_APPROVALS)
  const [rejectMode, setRejectMode] = useState(false)
  const [amendMode, setAmendMode] = useState(false)
  const [actionNote, setActionNote] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.approvals.list() as any[]
        if (data.length > 0) {
          const mapped: Approval[] = data.map((a: any) => ({
            id: a.id,
            title: a.title,
            status: a.status as ApprovalStatus,
            type: (a.type || 'STANDARD') as ApprovalType,
            requestedBy: a.requested_by || a.requestedBy || '',
            decidedBy: a.decided_by || a.decidedBy || undefined,
            decisionNote: a.decision_note || a.decisionNote || undefined,
            timeAgo: a.time_ago || a.timeAgo || '',
            timestamp: a.timestamp || a.created_at || '',
            description: a.description || '',
            impact: a.impact || '',
            recommendation: a.recommendation || '',
          }))
          setApprovals(mapped)
          if (mapped.length > 0) setSelectedId(mapped[0].id)
        }
      } catch {
        setError('Backend offline — showing local data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered =
    filter === 'pending' ? approvals.filter((a) => a.status === 'PENDING') : approvals

  const selected = approvals.find((a) => a.id === selectedId) ?? approvals[0]

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleApprove() {
    try {
      await api.approvals.decide(selected.id, {
        status: 'APPROVED',
        decided_by_user_id: 'moe',
        decision_note: actionNote || undefined,
      })
    } catch {
      // fallback to local
    }
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === selected.id ? { ...a, status: 'APPROVED', decidedBy: 'Moe', timeAgo: 'just now' } : a
      )
    )
    setActionNote('')
    setRejectMode(false)
    setAmendMode(false)
    showToast('Approved ✓')
  }

  async function handleReject() {
    if (!rejectMode) {
      setRejectMode(true)
      setAmendMode(false)
      return
    }
    try {
      await api.approvals.decide(selected.id, {
        status: 'REJECTED',
        decided_by_user_id: 'moe',
        decision_note: actionNote,
      })
    } catch {
      // fallback to local
    }
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === selected.id
          ? { ...a, status: 'REJECTED', decidedBy: 'Moe', decisionNote: actionNote, timeAgo: 'just now' }
          : a
      )
    )
    setActionNote('')
    setRejectMode(false)
    showToast('Rejected ✗')
  }

  async function handleAmend() {
    if (!amendMode) {
      setAmendMode(true)
      setRejectMode(false)
      return
    }
    try {
      await api.approvals.decide(selected.id, {
        status: 'AMENDED',
        decided_by_user_id: 'moe',
        decision_note: actionNote,
      })
    } catch {
      // fallback to local
    }
    setActionNote('')
    setAmendMode(false)
    showToast('Amendment sent ✏')
  }

  return (
    <>
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-secondary/30 border-t-secondary animate-spin" />
          <span className="ml-3 text-sm text-on-surface-variant">Loading approvals...</span>
        </div>
      )}
      {error && (
        <div className="glass-card p-4 border border-amber-500/20 mb-4">
          <span className="text-xs text-amber-400">{error}</span>
        </div>
      )}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex overflow-hidden"
        style={{ height: 'calc(100vh - 64px)', marginTop: '-2rem', marginLeft: '-2rem', marginRight: '-2rem' }}
      >
      {/* ── Left Panel ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col border-r border-primary/[0.08] overflow-hidden"
        style={{ width: 320, minWidth: 320 }}
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-primary/[0.08]">
          <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary mb-4">
            Approvals
          </div>
          <div className="flex gap-2">
            {(['pending', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold tracking-[0.1em] uppercase transition-all ${
                  filter === f
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-on-surface-variant border border-primary/[0.06] hover:text-primary'
                }`}
              >
                {f === 'pending' ? 'Pending' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((apr) => {
            const isSelected = selectedId === apr.id
            const leftBorderColor =
              apr.type === 'GATE'
                ? 'rgba(234,179,8,0.55)'
                : isSelected
                ? '#e6e6fa'
                : 'transparent'
            return (
              <button
                key={apr.id}
                onClick={() => {
                  setSelectedId(apr.id)
                  setRejectMode(false)
                  setAmendMode(false)
                  setActionNote('')
                }}
                className={`w-full text-left px-5 py-4 border-b border-primary/[0.06] transition-all ${
                  isSelected ? 'bg-primary/[0.06]' : 'hover:bg-primary/[0.03]'
                }`}
                style={{ borderLeft: `3px solid ${leftBorderColor}` }}
              >
                <div className="text-sm font-semibold text-primary leading-snug">{apr.title}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-on-surface-variant">{apr.requestedBy}</span>
                  <span className="text-[10px] text-on-surface-variant/40">·</span>
                  <span className="font-mono text-[10px] text-on-surface-variant">{apr.id}</span>
                  <span className="ml-auto text-[10px] text-on-surface-variant">{apr.timeAgo}</span>
                </div>
                <div className="mt-2">
                  <StatusBadge status={apr.status} />
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-on-surface-variant">
              No pending approvals
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Right Panel ────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex-1 overflow-y-auto px-10 py-8">
        {selected && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-black text-primary leading-tight">{selected.title}</h1>
                <StatusBadge status={selected.status} />
              </div>
              <div className="flex flex-wrap gap-8 mt-5">
                {[
                  { label: 'Request ID', value: selected.id, mono: true },
                  { label: 'Requested By', value: selected.requestedBy },
                  { label: 'Date & Time', value: selected.timestamp },
                  {
                    label: 'Type',
                    value: selected.type,
                    colored: selected.type === 'GATE',
                  },
                ].map(({ label, value, mono, colored }) => (
                  <div key={label}>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
                      {label}
                    </div>
                    <div
                      className={`text-sm ${mono ? 'font-mono' : ''} ${
                        colored ? 'text-yellow-400 font-bold' : 'text-on-surface'
                      }`}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="glass-card p-6 space-y-6">
              {[
                { heading: 'The Decision', body: selected.description },
                { heading: 'Impact', body: selected.impact },
                { heading: 'Recommendation', body: selected.recommendation },
              ].map(({ heading, body }, i) => (
                <div key={heading} className={i > 0 ? 'border-t border-primary/[0.08] pt-6' : ''}>
                  <div className="text-base font-bold text-primary mb-2">{heading}</div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{body}</p>
                </div>
              ))}
            </div>

            {/* Actions — PENDING */}
            {selected.status === 'PENDING' && (
              <div className="glass-card p-6">
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-4">
                  Your Decision
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-all font-semibold text-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-all font-semibold text-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    {rejectMode ? 'Confirm Reject' : 'Reject'}
                  </button>
                  <button
                    onClick={handleAmend}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all font-semibold text-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    {amendMode ? 'Send Amendment' : 'Amend'}
                  </button>
                </div>
                {(rejectMode || amendMode) && (
                  <div className="mt-4">
                    <textarea
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder={rejectMode ? 'Reason for rejection...' : 'Amendment instructions...'}
                      className="w-full bg-surface-container-high border border-primary/[0.08] rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/30 resize-none"
                      rows={3}
                    />
                    <button
                      onClick={() => {
                        setRejectMode(false)
                        setAmendMode(false)
                        setActionNote('')
                      }}
                      className="mt-2 text-xs text-on-surface-variant hover:text-primary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Decision record — DECIDED */}
            {selected.status !== 'PENDING' && (
              <div
                className={`glass-card p-6 border ${
                  selected.status === 'APPROVED' ? 'border-secondary/20' : 'border-error/20'
                }`}
              >
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">
                  Decision Record
                </div>
                <div className="flex items-start gap-3">
                  <span
                    className={`material-symbols-outlined text-[20px] mt-0.5 ${
                      selected.status === 'APPROVED' ? 'text-secondary' : 'text-error'
                    }`}
                  >
                    {selected.status === 'APPROVED' ? 'check_circle' : 'cancel'}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-on-surface">
                      {selected.status} by {selected.decidedBy} · {selected.timeAgo}
                    </div>
                    {selected.decisionNote && (
                      <div className="text-sm text-on-surface-variant mt-1">
                        "{selected.decisionNote}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* History */}
            <div>
              <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary mb-4">
                Recent History
              </div>
              <div className="glass-card divide-y divide-primary/[0.06]">
                {HISTORY.map((h) => (
                  <div key={h.id} className="flex items-center gap-4 px-5 py-3">
                    <span
                      className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border ${
                        h.decided === 'APPROVED'
                          ? 'bg-secondary/10 text-secondary border-secondary/20'
                          : 'bg-error/10 text-error border-error/20'
                      }`}
                    >
                      {h.decided}
                    </span>
                    <span className="text-sm text-on-surface flex-1">{h.title}</span>
                    <span className="text-xs text-on-surface-variant">{h.by}</span>
                    <span className="text-xs text-on-surface-variant/60">{h.when}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8 px-5 py-3 glass-card border border-primary/20 text-sm font-semibold text-primary z-50"
        >
          {toast}
        </motion.div>
      )}
    </motion.div>
    </>
  )
}
