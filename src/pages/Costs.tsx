import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAudioPlayer } from '@/data/audio-player'
import InfoIcon from '@/components/shared/InfoIcon'
import { api } from '@/lib/api'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts'

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const DAILY_SPEND = [
  { day: 'Mar 1', cost: 0.038 }, { day: 'Mar 2', cost: 0.051 }, { day: 'Mar 3', cost: 0.029 },
  { day: 'Mar 4', cost: 0.062 }, { day: 'Mar 5', cost: 0.044 }, { day: 'Mar 6', cost: 0.033 },
  { day: 'Mar 7', cost: 0.071 }, { day: 'Mar 8', cost: 0.028 }, { day: 'Mar 9', cost: 0.055 },
  { day: 'Mar 10', cost: 0.078 }, { day: 'Mar 11', cost: 0.023 }, { day: 'Mar 12', cost: 0.041 },
  { day: 'Mar 13', cost: 0.036 }, { day: 'Mar 14', cost: 0.068 }, { day: 'Mar 15', cost: 0.025 },
  { day: 'Mar 16', cost: 0.047 }, { day: 'Mar 17', cost: 0.031 }, { day: 'Mar 18', cost: 0.059 },
  { day: 'Mar 19', cost: 0.042 }, { day: 'Mar 20', cost: 0.053 }, { day: 'Mar 21', cost: 0.038 },
  { day: 'Mar 22', cost: 0.067 }, { day: 'Mar 23', cost: 0.027 }, { day: 'Mar 24', cost: 0.049 },
  { day: 'Mar 25', cost: 0.061 }, { day: 'Mar 26', cost: 0.044 }, { day: 'Mar 27', cost: 0.021 },
  { day: 'Mar 28', cost: 0 }, { day: 'Mar 29', cost: 0 }, { day: 'Mar 30', cost: 0 },
]

const AGENT_COSTS = [
  { agent: 'DCEO', model: 'claude-opus-4-6', cost: 0.52, pct: 42 },
  { agent: 'CTO', model: 'claude-sonnet-4-6', cost: 0.31, pct: 25 },
  { agent: 'Scout', model: 'claude-sonnet-4-6', cost: 0.24, pct: 19 },
  { agent: 'CFO', model: 'claude-haiku-4-5', cost: 0.09, pct: 7 },
  { agent: 'Utilities', model: 'qwen2.5:7b', cost: 0.08, pct: 7 },
]

const EFFICIENCY_TABLE = [
  { agent: 'DCEO', model: 'claude-opus-4-6', costPer1k: '$0.075', totalTokens: '6,900', rating: 'HIGH' as const },
  { agent: 'CTO', model: 'claude-sonnet-4-6', costPer1k: '$0.021', totalTokens: '14,700', rating: 'OK' as const },
  { agent: 'Scout', model: 'claude-sonnet-4-6', costPer1k: '$0.021', totalTokens: '11,400', rating: 'OK' as const },
  { agent: 'CFO', model: 'claude-haiku-4-5', costPer1k: '$0.004', totalTokens: '22,500', rating: 'OK' as const },
  { agent: 'Utilities', model: 'qwen2.5:7b', costPer1k: '$0.000', totalTokens: '~', rating: 'OK' as const },
]

const RATING_CLASSES = {
  OK: 'text-green-400',
  HIGH: 'text-amber-400',
  CRITICAL: 'text-error',
}

const RATING_ICONS = {
  OK: '✅',
  HIGH: '⚠',
  CRITICAL: '🔴',
}

const SUGGESTIONS = [
  {
    icon: 'psychology',
    title: 'DCEO is on claude-opus-4-6',
    body: 'Consider switching DCEO to claude-sonnet-4-6 for routine summarization and status tasks. Reserve Opus for complex strategic reasoning only.',
    saving: '~$0.30/mo',
  },
  {
    icon: 'memory',
    title: 'Deploy Qwen local for free record-keeping',
    body: 'Route CFO\'s simple bookkeeping and ledger tasks to the local Qwen2.5:7b model. Zero API cost for structured data operations.',
    saving: '~$0.07/mo',
  },
]

// ─── Subscription / API Cost Data ─────────────────────────────────────────────

type SubType = 'monthly' | 'api'

interface Subscription {
  id: string
  provider: string
  website: string
  type: SubType
  purposes: string[]
  startDate: string | null
  monthsSubscribed: number | null
  monthlyCost: number
  totalSpent: number
}

const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 's1', provider: 'Anthropic', website: 'anthropic.com', type: 'api',
    purposes: ['Operations', 'Research', 'Development'],
    startDate: null, monthsSubscribed: null, monthlyCost: 0, totalSpent: 87.40,
  },
  {
    id: 's2', provider: 'OpenAI', website: 'openai.com', type: 'monthly',
    purposes: ['Research', 'Marketing'],
    startDate: '2025-11-01', monthsSubscribed: 5, monthlyCost: 20.00, totalSpent: 100.00,
  },
  {
    id: 's3', provider: 'Midjourney', website: 'midjourney.com', type: 'monthly',
    purposes: ['Marketing', 'Design'],
    startDate: '2026-01-01', monthsSubscribed: 3, monthlyCost: 30.00, totalSpent: 90.00,
  },
  {
    id: 's4', provider: 'ElevenLabs', website: 'elevenlabs.io', type: 'monthly',
    purposes: ['Marketing'],
    startDate: '2026-02-01', monthsSubscribed: 2, monthlyCost: 22.00, totalSpent: 44.00,
  },
  {
    id: 's5', provider: 'Perplexity', website: 'perplexity.ai', type: 'monthly',
    purposes: ['Research'],
    startDate: '2025-12-01', monthsSubscribed: 4, monthlyCost: 20.00, totalSpent: 80.00,
  },
  {
    id: 's6', provider: 'Google AI Studio', website: 'aistudio.google.com', type: 'api',
    purposes: ['Development', 'Operations'],
    startDate: null, monthsSubscribed: null, monthlyCost: 0, totalSpent: 12.50,
  },
  {
    id: 's7', provider: 'Replicate', website: 'replicate.com', type: 'api',
    purposes: ['Research', 'Design'],
    startDate: null, monthsSubscribed: null, monthlyCost: 0, totalSpent: 8.20,
  },
]

const PURPOSE_COLORS: Record<string, string> = {
  Marketing: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  Operations: 'bg-secondary/15 text-secondary border-secondary/20',
  Research: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  Development: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Design: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Financial: 'bg-green-500/15 text-green-400 border-green-500/20',
}

const ALL_PURPOSES = ['Marketing', 'Operations', 'Research', 'Development', 'Design', 'Financial']

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TOTAL_MONTHLY = 1.24
const DAILY_AVG = 0.041
const PROJECTED = 1.23

const CARD_INFO: Record<string, string> = {
  'Monthly Token Spend': 'Total API tokens consumed across all agents this billing period. Track this to catch runaway agents or unexpected usage spikes before they impact your budget.',
  'Daily Average': 'Average daily API spend calculated over active days this month. Use this to forecast end-of-month costs and identify usage trends early.',
  'Projected EOM': 'End-of-month cost projection based on current daily average. If this exceeds your budget cap, consider switching high-cost agents to cheaper models.',
  'Budget Cap': 'Monthly budget limit for AI agent costs. Click pencil to adjust. When actual spend approaches this cap, you\'ll receive an alert.',
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary mb-4">
      {children}
    </div>
  )
}

function CostInfoIcon({ label }: { label: string }) {
  const info = CARD_INFO[label]
  if (!info) return null
  return <InfoIcon text={info} />
}

function fmtSubDate(d: string | null) {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// ─── Costs Page ───────────────────────────────────────────────────────────────

export default function Costs() {
  const navigate = useNavigate()
  const [budgetCap, setBudgetCap] = useState(50.0)
  const [editingCap, setEditingCap] = useState(false)
  const [capInput, setCapInput] = useState('50.00')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS)
  const [showAddSub, setShowAddSub] = useState(false)
  const [newSub, setNewSub] = useState({
    provider: '', website: '', type: 'monthly' as SubType,
    purposes: [] as string[], startDate: '', monthlyCost: '', apiBalance: '',
  })
  const audioPlayer = useAudioPlayer()
  const [analysisText, setAnalysisText] = useState<string | null>(null)
  const [analysisGenerating, setAnalysisGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agentCosts, setAgentCosts] = useState(AGENT_COSTS)
  const [totalMonthly, setTotalMonthly] = useState(TOTAL_MONTHLY)
  const [dailyAvg, setDailyAvg] = useState(DAILY_AVG)
  const [projected, setProjected] = useState(PROJECTED)
  const [audioGenerating, setAudioGenerating] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsData] = await Promise.all([
          api.agents.list() as Promise<any[]>,
          api.dashboard.summary() as Promise<any>,
        ])
        if (agentsData.length > 0) {
          const totalCost = agentsData.reduce((s: number, a: any) => s + (a.monthly_cost || a.monthlyCost || 0), 0)
          const mapped = agentsData
            .filter((a: any) => (a.monthly_cost || a.monthlyCost || 0) > 0)
            .map((a: any) => ({
              agent: a.name || a.id,
              model: a.model || '',
              cost: a.monthly_cost || a.monthlyCost || 0,
              pct: totalCost > 0 ? Math.round(((a.monthly_cost || a.monthlyCost || 0) / totalCost) * 100) : 0,
            }))
            .sort((a: any, b: any) => b.cost - a.cost)
          if (mapped.length > 0) setAgentCosts(mapped)
          if (totalCost > 0) {
            setTotalMonthly(totalCost)
            setDailyAvg(totalCost / 27)
            setProjected(totalCost * (30 / 27))
          }
        }
      } catch {
        setError('Backend offline — showing local data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function saveCap() {
    const val = parseFloat(capInput)
    if (!isNaN(val) && val > 0) {
      setBudgetCap(val)
      fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetCap: val }),
      }).catch(() => {})
    }
    setEditingCap(false)
  }

  function handleAddSub() {
    if (!newSub.provider.trim()) return
    const isApi = newSub.type === 'api'
    const monthly = isApi ? 0 : parseFloat(newSub.monthlyCost) || 0
    const total = isApi ? (parseFloat(newSub.apiBalance) || 0) : monthly
    const sub: Subscription = {
      id: `s-${Date.now()}`,
      provider: newSub.provider,
      website: newSub.website,
      type: newSub.type,
      purposes: newSub.purposes,
      startDate: isApi ? null : (newSub.startDate || null),
      monthsSubscribed: isApi ? null : 1,
      monthlyCost: monthly,
      totalSpent: total,
    }
    setSubscriptions(prev => [...prev, sub])
    setNewSub({ provider: '', website: '', type: 'monthly', purposes: [], startDate: '', monthlyCost: '', apiBalance: '' })
    setShowAddSub(false)
  }

  function togglePurpose(p: string) {
    setNewSub(prev => ({
      ...prev,
      purposes: prev.purposes.includes(p) ? prev.purposes.filter(x => x !== p) : [...prev.purposes, p],
    }))
  }

  const budgetUsedPct = Math.round((totalMonthly / budgetCap) * 100)
  const subTotal = subscriptions.reduce((s, sub) => s + sub.totalSpent, 0)

  async function handleGenerateAudio() {
    setAudioGenerating(true)
    try {
      await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'agent-costs', month: 'march-2026' }),
      })
    } catch { /* dev: no backend */ }
    setAudioGenerating(false)
    audioPlayer.play({ title: 'Agent Costs Summary', subtitle: 'March 2026 · AI Generated', duration: '2:01' })
  }

  async function handleGenerateAnalysis() {
    setAnalysisGenerating(true)
    // Simulate AI generation delay
    await new Promise(r => setTimeout(r, 1500))
    const topAgent = agentCosts[0]
    const totalSubs = subscriptions.reduce((s, sub) => s + sub.totalSpent, 0)
    setAnalysisText(
      `March 2026 cost analysis: Your total LLM token spend is $${totalMonthly.toFixed(2)}, well within the $${budgetCap.toFixed(2)} budget cap (${budgetUsedPct}% utilized). ` +
      `${topAgent.agent} accounts for ${topAgent.pct}% of token costs at $${topAgent.cost.toFixed(2)}, running on ${topAgent.model} — consider downgrading to Sonnet for routine tasks to save ~$0.30/mo. ` +
      `Daily average spend is $${dailyAvg.toFixed(3)} with a projected EOM of $${projected.toFixed(2)}. ` +
      `On the subscription side, you're spending $${totalSubs.toFixed(2)} total across ${subscriptions.length} AI providers. ` +
      `OpenAI ($100.00) and Midjourney ($90.00) are your largest subscription costs. ` +
      `Recommendation: Audit Perplexity usage — if primarily used for quick searches, the free tier may suffice, saving $20/mo. ` +
      `Combined AI infrastructure cost (tokens + subscriptions): $${(totalMonthly + totalSubs).toFixed(2)} for March.`
    )
    setAnalysisGenerating(false)
  }

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
          <span className="ml-3 text-sm text-on-surface-variant">Loading cost data...</span>
        </motion.div>
      )}
      {error && (
        <motion.div variants={itemVariants} className="glass-card p-4 border border-amber-500/20">
          <span className="text-xs text-amber-400">{error}</span>
        </motion.div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
          Agents & OS
        </div>
        <h1 className="text-4xl font-black text-primary text-glow">Agent Costs</h1>
        <p className="text-sm text-on-surface-variant mt-2">March 2026 · LLM API spend tracking</p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleGenerateAudio}
            disabled={audioGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">
              {audioGenerating ? 'hourglass_empty' : 'play_arrow'}
            </span>
            {audioGenerating ? 'Generating...' : 'Audio Summary'}
          </button>
          <button
            onClick={handleGenerateAnalysis}
            disabled={analysisGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">
              {analysisGenerating ? 'hourglass_empty' : 'auto_awesome'}
            </span>
            {analysisGenerating ? 'Analyzing...' : 'AI Analysis'}
          </button>
        </div>
      </motion.div>

      {/* ── AI Analysis Card ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {analysisText && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">auto_awesome</span>
                <div className="text-[11px] font-bold tracking-[0.15em] text-secondary uppercase">AI Cost Analysis</div>
              </div>
              <button onClick={() => setAnalysisText(null)} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <p className="text-sm text-on-surface leading-relaxed">{analysisText}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Metric Cards ──────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SectionHeader>Spend Overview</SectionHeader>
        <div className="grid grid-cols-4 gap-4">
          {/* Monthly Token Spend */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Monthly Token Spend</div>
              <CostInfoIcon label="Monthly Token Spend" />
            </div>
            <div className="text-3xl font-black text-primary mt-3">${totalMonthly.toFixed(2)}</div>
            <div className="text-[11px] text-on-surface-variant mt-1">March 2026</div>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-on-surface-variant mb-1">
                <span>vs. budget cap</span>
                <span>{budgetUsedPct}%</span>
              </div>
              <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(budgetUsedPct, 100)}%`,
                    background: budgetUsedPct < 60 ? '#cacafe' : budgetUsedPct < 85 ? '#f59e0b' : '#ff6e84',
                    boxShadow: `0 0 6px #cacafe40`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Daily Average */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Daily Average</div>
              <CostInfoIcon label="Daily Average" />
            </div>
            <div className="text-3xl font-black text-primary mt-3">${dailyAvg.toFixed(3)}</div>
            <div className="text-[11px] text-on-surface-variant mt-1">last 27 days</div>
          </div>

          {/* Projected EOM */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Projected EOM</div>
              <CostInfoIcon label="Projected EOM" />
            </div>
            <div className="text-3xl font-black text-primary mt-3">${projected.toFixed(2)}</div>
            <div className="text-[11px] text-secondary mt-1">on track ✓</div>
          </div>

          {/* Budget Cap */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Budget Cap</div>
                <CostInfoIcon label="Budget Cap" />
              </div>
              {!editingCap && (
                <button
                  onClick={() => { setCapInput(budgetCap.toFixed(2)); setEditingCap(true) }}
                  className="text-on-surface-variant hover:text-primary transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              )}
            </div>
            {editingCap ? (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg font-black text-on-surface-variant">$</span>
                <input
                  type="number"
                  value={capInput}
                  onChange={(e) => setCapInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveCap(); if (e.key === 'Escape') setEditingCap(false) }}
                  className="w-24 px-3 py-1.5 rounded-lg bg-surface-container-high border border-primary/20 text-primary font-bold text-lg focus:outline-none focus:border-primary/40 transition-all"
                  autoFocus
                />
                <button onClick={saveCap} className="text-secondary hover:text-primary transition-all text-sm font-semibold">Save</button>
              </div>
            ) : (
              <div className="text-3xl font-black text-primary mt-3">${budgetCap.toFixed(2)}</div>
            )}
            <div className="text-[11px] text-on-surface-variant mt-1">monthly limit</div>
          </div>
        </div>
      </motion.div>

      {/* ── 30-day Spend Chart ────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
          Daily Spend — March 2026
        </div>
        <div className="text-3xl font-black text-primary mb-6">$1.24 MTD</div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DAILY_SPEND} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff9fe3" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ff9fe3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#acaaae', fontSize: 9 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: '#acaaae', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(2)}`} width={40} />
              <RechartsTooltip
                contentStyle={{ background: 'rgba(31,31,35,0.92)', border: '1px solid rgba(230,230,250,0.08)', borderRadius: 8, fontSize: 11, color: '#e6e6fa', padding: '6px 10px' }}
                formatter={(v: unknown) => [`$${(v as number).toFixed(4)}`, 'Spend']}
                labelStyle={{ color: '#acaaae', marginBottom: 2 }}
                cursor={{ stroke: 'rgba(230,230,250,0.1)', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="cost" stroke="#ff9fe3" strokeWidth={2} fill="url(#costGrad)" dot={false} activeDot={{ r: 4, fill: '#ff9fe3', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Per-agent Bars ────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SectionHeader>Cost by Agent</SectionHeader>
        <div className="glass-card p-6 space-y-5">
          {agentCosts.map((a) => (
            <div key={a.agent} className="cursor-pointer" onClick={() => navigate(`/org?agent=${a.agent.toLowerCase()}`)}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-primary w-16 hover:underline">{a.agent}</span>
                  <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-lg border border-primary/[0.06]">{a.model}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-on-surface-variant font-semibold">${a.cost.toFixed(2)}</span>
                  <span className="text-[11px] text-on-surface-variant w-8 text-right">{a.pct}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${a.pct}%`,
                  background: a.pct > 35 ? '#ff9fe3' : '#cacafe',
                  boxShadow: `0 0 6px ${a.pct > 35 ? '#ff9fe350' : '#cacafe40'}`,
                }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Model Efficiency Scorecard ────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SectionHeader>Model Efficiency Scorecard</SectionHeader>
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/[0.06]">
                {['Agent', 'Model', '$/1K Tokens', 'Total Tokens', 'Rating'].map((h) => (
                  <th key={h} className="text-left text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EFFICIENCY_TABLE.map((row, i) => (
                <tr key={i} className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all">
                  <td className="px-5 py-3.5 text-sm font-semibold text-primary">{row.agent}</td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-on-surface-variant">{row.model}</td>
                  <td className="px-5 py-3.5 text-sm text-on-surface">{row.costPer1k}</td>
                  <td className="px-5 py-3.5 text-sm text-on-surface">{row.totalTokens}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm ${RATING_CLASSES[row.rating]}`}>{RATING_ICONS[row.rating]} {row.rating}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Subscription / API Costs ──────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader>Subscription / API Costs</SectionHeader>
          <button
            onClick={() => setShowAddSub(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm font-semibold hover:bg-secondary/20 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>Add Provider
          </button>
        </div>

        {/* Add form */}
        {showAddSub && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase">Add Provider</div>
              <button onClick={() => setShowAddSub(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Provider Name</div>
                <input type="text" placeholder="e.g. Anthropic" value={newSub.provider}
                  onChange={e => setNewSub(p => ({ ...p, provider: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
              </div>
              <div>
                <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Website</div>
                <input type="text" placeholder="e.g. anthropic.com" value={newSub.website}
                  onChange={e => setNewSub(p => ({ ...p, website: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
              </div>
              <div>
                <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Type</div>
                <select value={newSub.type} onChange={e => setNewSub(p => ({ ...p, type: e.target.value as SubType }))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
                >
                  <option value="monthly">Monthly Subscription</option>
                  <option value="api">API Balance / Pay-as-you-go</option>
                </select>
              </div>
            </div>
            {newSub.type === 'monthly' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Start Date</div>
                  <input type="date" value={newSub.startDate}
                    onChange={e => setNewSub(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Monthly Cost ($)</div>
                  <input type="number" step="0.01" placeholder="20.00" value={newSub.monthlyCost}
                    onChange={e => setNewSub(p => ({ ...p, monthlyCost: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Total Spent to Date ($)</div>
                  <input type="number" step="0.01" placeholder="50.00" value={newSub.apiBalance}
                    onChange={e => setNewSub(p => ({ ...p, apiBalance: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
                </div>
              </div>
            )}
            <div>
              <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-2">Purpose Tags</div>
              <div className="flex flex-wrap gap-2">
                {ALL_PURPOSES.map(p => (
                  <button key={p} onClick={() => togglePurpose(p)}
                    className={[
                      'px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.05em] border transition-all',
                      newSub.purposes.includes(p)
                        ? (PURPOSE_COLORS[p] ?? 'bg-primary/10 text-primary border-primary/20')
                        : 'text-on-surface-variant/50 border-primary/[0.06] hover:border-primary/20',
                    ].join(' ')}
                  >{p}</button>
                ))}
              </div>
            </div>
            <button onClick={handleAddSub}
              className="px-5 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm font-semibold hover:bg-secondary/20 transition-all"
            >Add Provider</button>
          </motion.div>
        )}

        {/* Subscriptions table */}
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/[0.06]">
                {['Provider', 'Type', 'Purpose', 'Start Date', 'Months', 'Monthly', 'Total Spent'].map(h => (
                  <th key={h} className="text-left text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(sub => (
                <tr key={sub.id} className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all">
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-semibold text-primary">{sub.provider}</div>
                    <div className="text-[10px] text-on-surface-variant/60">{sub.website}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={[
                      'text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border',
                      sub.type === 'api' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-secondary/10 text-secondary border-secondary/20',
                    ].join(' ')}>{sub.type === 'api' ? 'API' : 'Sub'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {sub.purposes.map(p => (
                        <span key={p} className={`text-[9px] font-bold tracking-[0.05em] px-2 py-0.5 rounded-full border ${PURPOSE_COLORS[p] ?? 'bg-surface-container-high text-on-surface-variant border-primary/[0.06]'}`}>{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-on-surface">{fmtSubDate(sub.startDate)}</td>
                  <td className="px-5 py-3.5 text-sm text-on-surface">{sub.monthsSubscribed ?? 'N/A'}</td>
                  <td className="px-5 py-3.5 text-sm text-on-surface">{sub.type === 'api' ? 'N/A' : `$${sub.monthlyCost.toFixed(2)}`}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-primary">${sub.totalSpent.toFixed(2)}</td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="border-t border-primary/[0.08] bg-primary/[0.02]">
                <td colSpan={6} className="px-5 py-3 text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase text-right">Total</td>
                <td className="px-5 py-3 text-sm font-black text-primary">${subTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Cost Action Plan ──────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SectionHeader>Cost Action Plan</SectionHeader>
        <div className="glass-card p-6 space-y-4">
          <p className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
            AI Recommendations
          </p>
          {SUGGESTIONS.map((s, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl bg-surface-container-high border border-primary/[0.06] hover:border-primary/[0.12] transition-all">
              <span className="material-symbols-outlined text-[22px] text-secondary shrink-0 mt-0.5">{s.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-primary mb-1">{s.title}</div>
                <div className="text-[12px] text-on-surface-variant leading-relaxed">{s.body}</div>
              </div>
              <div className="text-[11px] font-bold text-secondary shrink-0 mt-0.5">saves {s.saving}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
