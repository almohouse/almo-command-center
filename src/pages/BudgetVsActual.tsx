import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import { useAudioPlayer } from '@/data/audio-player'
import { useToast } from '@/data/toast'
import { api, patchJSON } from '@/lib/api'
import InfoIcon from '@/components/shared/InfoIcon'
import AIInsightCard from '@/components/shared/AIInsightCard'

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

// ---------------------------------------------------------------------------
// SectionHeader
// ---------------------------------------------------------------------------
function SectionHeader({ children, info }: { children: React.ReactNode; info?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary">{children}</div>
      {info && <InfoIcon text={info} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared tooltip style
// ---------------------------------------------------------------------------
const tooltipStyle = {
  contentStyle: {
    background: 'rgba(31,31,35,0.92)',
    border: '1px solid rgba(230,230,250,0.08)',
    borderRadius: 8,
    fontSize: 11,
    color: '#e6e6fa',
    padding: '6px 10px',
  },
  labelStyle: { color: '#acaaae', marginBottom: 2 },
  cursor: { stroke: 'rgba(230,230,250,0.1)', strokeWidth: 1 },
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
function fmtSAR(n: number) {
  return n.toLocaleString('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 })
}

// ---------------------------------------------------------------------------
// Budget categories with data
// ---------------------------------------------------------------------------
interface BudgetCategory {
  id: string
  name: string
  icon: string
  budget: number
  actual: number
  sparkline: number[] // daily spend for 30 days
}

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  {
    id: 'marketing',
    name: 'Marketing',
    icon: 'campaign',
    budget: 15000,
    actual: 14500,
    sparkline: [380, 520, 450, 380, 620, 480, 350, 510, 440, 380, 520, 480, 450, 380, 620, 480, 350, 510, 440, 520, 480, 450, 380, 620, 480, 350, 510, 440, 380, 520],
  },
  {
    id: 'cogs',
    name: 'COGS',
    icon: 'inventory_2',
    budget: 50000,
    actual: 45200,
    sparkline: [1200, 1400, 1600, 1200, 1800, 1500, 1200, 1400, 2200, 1200, 1400, 1600, 1200, 1800, 1500, 1200, 1400, 2200, 1400, 1600, 1200, 1800, 1500, 1200, 1400, 2200, 1200, 1400, 1600, 1200],
  },
  {
    id: 'shipping',
    name: 'Shipping',
    icon: 'local_shipping',
    budget: 10000,
    actual: 9200,
    sparkline: [280, 320, 340, 280, 350, 300, 280, 320, 340, 280, 350, 300, 280, 320, 340, 280, 350, 300, 320, 340, 280, 350, 300, 280, 320, 340, 280, 350, 300, 280],
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    icon: 'subscriptions',
    budget: 4500,
    actual: 4250,
    sparkline: [140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140],
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: 'settings',
    budget: 6000,
    actual: 5800,
    sparkline: [180, 200, 190, 180, 210, 200, 180, 200, 190, 180, 210, 200, 180, 200, 190, 180, 210, 200, 200, 190, 180, 210, 200, 180, 200, 190, 180, 210, 200, 180],
  },
  {
    id: 'ai',
    name: 'AI/Agent Costs',
    icon: 'smart_toy',
    budget: 600,
    actual: 480,
    sparkline: [14, 16, 18, 14, 20, 16, 14, 16, 18, 14, 20, 16, 14, 16, 18, 14, 20, 16, 16, 18, 14, 20, 16, 14, 16, 18, 14, 20, 16, 14],
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'more_horiz',
    budget: 3000,
    actual: 2400,
    sparkline: [60, 80, 100, 60, 120, 80, 60, 80, 100, 60, 120, 80, 60, 80, 100, 60, 120, 80, 80, 100, 60, 120, 80, 60, 80, 100, 60, 120, 80, 60],
  },
]

// Budget setup wizard suggested defaults
const WIZARD_DEFAULTS: Record<string, number> = {
  marketing: 15000,
  cogs: 50000,
  shipping: 10000,
  subscriptions: 4500,
  operations: 6000,
  ai: 600,
  other: 3000,
}

function progressColor(pct: number) {
  if (pct > 100) return '#ff6e84'
  if (pct >= 80) return '#fbbf24'
  return '#4ade80'
}

function varianceColor(variance: number) {
  if (variance > 0) return 'text-green-400'
  if (variance < -500) return 'text-error'
  return 'text-amber-400'
}

// ---------------------------------------------------------------------------
// BudgetVsActual Page
// ---------------------------------------------------------------------------
export default function BudgetVsActual() {
  const audioPlayer = useAudioPlayer()
  const toast = useToast()

  const [audioGenerating, setAudioGenerating] = useState(false)
  const [categories, setCategories] = useState<BudgetCategory[]>(DEFAULT_CATEGORIES)
  const [budgetSet, setBudgetSet] = useState(true) // set to false for wizard
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [wizardBudgets, setWizardBudgets] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [_backendOffline, setBackendOffline] = useState(false)
  const [budgetsData, setBudgetsData] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.budgets.list()
        setBudgetsData(data)
        setBackendOffline(false)
      } catch {
        setBackendOffline(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (budgetsData) {
      const items = (budgetsData as any)?.items ?? budgetsData
      if (Array.isArray(items) && items.length > 0) {
        setCategories(items.map((b: any) => ({
          id: b.id ?? b.name?.toLowerCase(),
          name: b.name ?? b.category,
          icon: b.icon ?? DEFAULT_CATEGORIES.find(d => d.id === (b.id ?? b.name?.toLowerCase()))?.icon ?? 'more_horiz',
          budget: b.budget ?? 0,
          actual: b.actual ?? 0,
          sparkline: b.sparkline ?? DEFAULT_CATEGORIES.find(d => d.id === (b.id ?? b.name?.toLowerCase()))?.sparkline ?? Array(30).fill(0),
        })))
      }
    }
  }, [budgetsData])

  // Totals
  const totalBudget = categories.reduce((s, c) => s + c.budget, 0)
  const totalActual = categories.reduce((s, c) => s + c.actual, 0)
  const totalVariance = totalBudget - totalActual
  const overallPct = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0

  // Chart data
  const chartData = categories.map(c => ({
    name: c.name,
    budget: c.budget,
    actual: c.actual,
    isOver: c.actual > c.budget,
  }))

  // Edit budget inline
  function startEditBudget(catId: string, current: number) {
    setEditingBudget(catId)
    setEditValue(String(current))
  }

  async function saveBudget() {
    if (!editingBudget) return
    const val = Number(editValue)
    if (isNaN(val) || val < 0) return
    setCategories(prev => prev.map(c =>
      c.id === editingBudget ? { ...c, budget: val } : c
    ))
    try {
      await patchJSON('/budgets/' + editingBudget, { budget: val })
    } catch { /* continue with local state */ }
    setEditingBudget(null)
    toast.show('Budget updated', 'success')
  }

  function handleBudgetKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveBudget()
    if (e.key === 'Escape') setEditingBudget(null)
  }

  // Wizard
  function initWizard() {
    const initial: Record<string, string> = {}
    for (const c of categories) {
      initial[c.id] = String(WIZARD_DEFAULTS[c.id] || c.budget)
    }
    setWizardBudgets(initial)
    setBudgetSet(false)
  }

  function saveWizard() {
    setCategories(prev => prev.map(c => ({
      ...c,
      budget: Number(wizardBudgets[c.id]) || c.budget,
    })))
    setBudgetSet(true)
    toast.show('Budget targets saved!', 'success')
  }

  async function handleAudioSummary() {
    setAudioGenerating(true)
    try {
      await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'budget' }),
      })
    } catch { /* dev: no backend */ }
    setAudioGenerating(false)
    audioPlayer.play({
      title: 'Budget Summary',
      subtitle: 'March 2026 · AI Generated',
      duration: '2:00',
    })
  }

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-8 pb-16">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 animate-pulse">
            <div className="h-4 bg-primary/10 rounded w-1/3 mb-4" />
            <div className="h-8 bg-primary/10 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Budget Setup Wizard
  // ---------------------------------------------------------------------------
  if (!budgetSet) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-16">
        <motion.div variants={itemVariants}>
          <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">Financials</div>
          <h1 className="text-4xl font-black text-primary text-glow">Budget Setup</h1>
          <p className="text-sm text-on-surface-variant mt-2">Set your monthly budget for each category. Suggested defaults based on industry benchmarks.</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="glass-card p-8">
            <div className="grid grid-cols-2 gap-6">
              {categories.map(c => (
                <div key={c.id} className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[24px] text-on-surface-variant">{c.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-on-surface mb-1.5">{c.name}</div>
                    <input
                      type="number"
                      value={wizardBudgets[c.id] || ''}
                      onChange={e => setWizardBudgets(prev => ({ ...prev, [c.id]: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all"
                      placeholder="SAR amount"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={saveWizard}
                className="px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold hover:bg-primary/20 transition-all"
              >
                Save Budget
              </button>
              <button
                onClick={() => setBudgetSet(true)}
                className="px-4 py-2 rounded-xl text-on-surface-variant hover:text-primary transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // ---------------------------------------------------------------------------
  // Main View
  // ---------------------------------------------------------------------------
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-16">

      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">Financials</div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-primary text-glow">Budget vs Actual</h1>
            <p className="text-sm text-on-surface-variant mt-2">Compare planned budgets against actual spending — are we on track?</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={initWizard}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Set Budgets
            </button>
            <button
              onClick={handleAudioSummary}
              disabled={audioGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">
                {audioGenerating ? 'hourglass_empty' : 'play_arrow'}
              </span>
              {audioGenerating ? 'Generating...' : 'Audio Summary'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Section 1: Budget Health Summary */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Overall budget health showing total planned vs actual spending.">Budget Health</SectionHeader>
        <div className="glass-card p-6">
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Total Budget</div>
              <div className="text-2xl font-black text-primary mt-2">{fmtSAR(totalBudget)}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Total Actual</div>
              <div className="text-2xl font-black text-on-surface mt-2">{fmtSAR(totalActual)}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Variance</div>
              <div className={`text-2xl font-black mt-2 ${totalVariance >= 0 ? 'text-green-400' : 'text-error'}`}>
                {totalVariance >= 0 ? '+' : ''}{fmtSAR(totalVariance)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Utilization</div>
              <div className="text-2xl font-black text-primary mt-2">{overallPct.toFixed(1)}%</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(overallPct, 100)}%`,
                background: progressColor(overallPct),
                boxShadow: `0 0 8px ${progressColor(overallPct)}50`,
              }}
            />
          </div>
          <div className="text-[11px] text-on-surface-variant mt-2">March 2026</div>
        </div>
      </motion.div>

      {/* AI Insights */}
      <motion.div variants={itemVariants}>
        <AIInsightCard
          text="Marketing is 12% over budget this month. The Ramadan campaign drove the overspend — but if ROAS holds at 3.2x, the investment is justified."
        />
      </motion.div>

      {/* Section 2: Category Budget Cards Grid */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Click the budget number to set or adjust. Actual spend pulls from Expenses page.">
          Category Budgets
        </SectionHeader>
        <div className="grid grid-cols-3 gap-4">
          {categories.map(cat => {
            const pct = cat.budget > 0 ? (cat.actual / cat.budget) * 100 : 0
            const variance = cat.budget - cat.actual
            const sparkData = cat.sparkline.map((v, i) => ({ d: i, v }))

            return (
              <div key={cat.id} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{cat.icon}</span>
                    <span className="text-sm font-bold text-on-surface">{cat.name}</span>
                  </div>
                  <InfoIcon text="Click the budget number to set or adjust. Actual spend pulls from Expenses page." />
                </div>

                {/* Budget */}
                <div className="mb-2">
                  <div className="text-[10px] text-on-surface-variant uppercase tracking-[0.1em]">Budget</div>
                  {editingBudget === cat.id ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={saveBudget}
                      onKeyDown={handleBudgetKeyDown}
                      autoFocus
                      className="w-28 px-2 py-1 rounded-lg bg-surface-container border border-primary/[0.06] text-sm text-on-surface font-bold focus:border-primary/30 focus:outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-black text-primary">{fmtSAR(cat.budget)}</span>
                      <button
                        onClick={() => startEditBudget(cat.id, cat.budget)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                        style={{ opacity: 0.5 }}
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Actual + Variance */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[10px] text-on-surface-variant uppercase tracking-[0.1em]">Actual</div>
                    <span className="text-sm font-bold text-on-surface">{fmtSAR(cat.actual)}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-on-surface-variant uppercase tracking-[0.1em]">Variance</div>
                    <span className={`text-sm font-bold ${varianceColor(variance)}`}>
                      {variance >= 0 ? '+' : ''}{fmtSAR(variance)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      background: progressColor(pct),
                      boxShadow: `0 0 6px ${progressColor(pct)}40`,
                    }}
                  />
                </div>

                {/* Sparkline */}
                <div className="h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`spark-${cat.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#cacafe" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#cacafe" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke="#cacafe" strokeWidth={1} fill={`url(#spark-${cat.id})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[10px] text-on-surface-variant mt-1">{pct.toFixed(0)}% of budget used</div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Section 3: Variance Analysis Chart */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Grouped bar chart comparing budget vs actual for each category. Red bars indicate overspending.">
          Variance Analysis
        </SectionHeader>
        <div className="glass-card p-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(230,230,250,0.04)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#acaaae', fontSize: 11, fontWeight: 700 }}
                  axisLine={{ stroke: 'rgba(230,230,250,0.06)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#acaaae', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const budget = Number(payload[0]?.value) || 0
                    const actual = Number(payload[1]?.value) || 0
                    const variance = budget - actual
                    return (
                      <div style={{ ...tooltipStyle.contentStyle }}>
                        <div style={{ color: '#acaaae', marginBottom: 4, fontSize: 11 }}>{label}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                          <span style={{ color: '#cacafe', fontSize: 11 }}>Budget</span>
                          <span style={{ color: '#e6e6fa', fontWeight: 700, fontSize: 11 }}>{fmtSAR(budget)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                          <span style={{ color: actual > budget ? '#ff6e84' : '#4ade80', fontSize: 11 }}>Actual</span>
                          <span style={{ color: '#e6e6fa', fontWeight: 700, fontSize: 11 }}>{fmtSAR(actual)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderTop: '1px solid rgba(230,230,250,0.08)', paddingTop: 4, marginTop: 4 }}>
                          <span style={{ color: '#acaaae', fontSize: 11 }}>Variance</span>
                          <span style={{ color: variance >= 0 ? '#4ade80' : '#ff6e84', fontWeight: 700, fontSize: 11 }}>
                            {variance >= 0 ? '+' : ''}{fmtSAR(variance)}
                          </span>
                        </div>
                      </div>
                    )
                  }}
                  cursor={{ stroke: 'rgba(230,230,250,0.1)', strokeWidth: 1 }}
                />
                <Bar dataKey="budget" name="Budget" fill="transparent" stroke="#cacafe" strokeWidth={2} radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]} barSize={24}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.isOver ? '#ff6e84' : '#4ade80'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

    </motion.div>
  )
}
