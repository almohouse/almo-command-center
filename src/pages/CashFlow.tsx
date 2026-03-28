import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { api } from '@/lib/api'
import { useAudioPlayer } from '@/data/audio-player'
import { useToast } from '@/data/toast'
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

function fmtK(n: number) {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(0)}K`
  return String(n)
}

// ---------------------------------------------------------------------------
// Cash flow monthly data — realistic ALMO figures in SAR
// Supplier batch payments from China create lumpy outflows
// ---------------------------------------------------------------------------
interface CashMonth {
  month: string
  cashIn: number
  cashOut: number
  net: number
  cumulative: number
}

const CASH_DATA: CashMonth[] = [
  { month: 'Oct 2025', cashIn: 70600, cashOut: 55880, net: 14720, cumulative: 64720 },
  { month: 'Nov 2025', cashIn: 81900, cashOut: 62100, net: 19800, cumulative: 84520 },
  { month: 'Dec 2025', cashIn: 114500, cashOut: 91750, net: 22750, cumulative: 107270 },
  { month: 'Jan 2026', cashIn: 90700, cashOut: 65330, net: 25370, cumulative: 132640 },
  { month: 'Feb 2026', cashIn: 110500, cashOut: 76470, net: 34030, cumulative: 166670 },
  { month: 'Mar 2026', cashIn: 131300, cashOut: 95230, net: 36070, cumulative: 202740 },
]

const CRITICAL_THRESHOLD = 50000

// ---------------------------------------------------------------------------
// 30/60/90-day forecast data
// ---------------------------------------------------------------------------
const FORECAST_DATA = (() => {
  const last = CASH_DATA[CASH_DATA.length - 1]
  const base = last.cumulative
  const dailyNet = (last.cashIn - last.cashOut) / 30
  const points: { day: string; projected: number; optimistic: number; pessimistic: number }[] = []
  for (let d = 0; d <= 90; d += 5) {
    const projected = base + dailyNet * d
    points.push({
      day: d === 0 ? 'Today' : `Day ${d}`,
      projected: Math.round(projected),
      optimistic: Math.round(projected * 1.12),
      pessimistic: Math.round(projected * 0.85),
    })
  }
  return points
})()

// ---------------------------------------------------------------------------
// Upcoming payments
// ---------------------------------------------------------------------------
interface UpcomingPayment {
  id: string
  description: string
  amount: number
  date: string
  direction: 'in' | 'out'
  recurring: boolean
}

const DEFAULT_PAYMENTS: UpcomingPayment[] = [
  { id: '1', description: 'China supplier batch — Cocoon Pillows (500 units)', amount: 18500, date: '2026-04-15', direction: 'out', recurring: false },
  { id: '2', description: 'Salla payout — March sales', amount: 42800, date: '2026-04-02', direction: 'in', recurring: false },
  { id: '3', description: 'Shipping partner — DHL monthly', amount: 4200, date: '2026-04-05', direction: 'out', recurring: true },
  { id: '4', description: 'Software subscriptions — monthly', amount: 4250, date: '2026-04-01', direction: 'out', recurring: true },
  { id: '5', description: 'B2B wholesale order — Al Nahdi', amount: 12400, date: '2026-04-10', direction: 'in', recurring: false },
]

// ---------------------------------------------------------------------------
// Cash Flow Statement data
// ---------------------------------------------------------------------------
interface StatementSection {
  label: string
  items: { label: string; amount: number }[]
  total: number
}

const STATEMENT: StatementSection[] = [
  {
    label: 'Operating Activities',
    items: [
      { label: 'Sales revenue received', amount: 131300 },
      { label: 'Supplier payments', amount: -45200 },
      { label: 'Marketing & advertising', amount: -14500 },
      { label: 'Shipping & fulfillment', amount: -9200 },
      { label: 'Software subscriptions', amount: -4250 },
      { label: 'AI/Agent costs', amount: -480 },
      { label: 'Salaries & general admin', amount: -5800 },
    ],
    total: 51870,
  },
  {
    label: 'Investing Activities',
    items: [
      { label: 'Warehouse equipment', amount: -8500 },
      { label: 'Product photography studio', amount: -3200 },
    ],
    total: -11700,
  },
  {
    label: 'Financing Activities',
    items: [
      { label: 'Owner investment', amount: 0 },
      { label: 'Loan repayment', amount: -4100 },
    ],
    total: -4100,
  },
]

// ---------------------------------------------------------------------------
// CashFlow Page
// ---------------------------------------------------------------------------
export default function CashFlow() {
  const audioPlayer = useAudioPlayer()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [_backendOffline, setBackendOffline] = useState(false)
  const [cashflowData, setCashflowData] = useState<any>(null)
  const [forecastData, setForecastData] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [cf, forecast] = await Promise.all([
          api.cashflow.get(),
          api.cashflow.forecast(),
        ])
        setCashflowData(cf)
        setForecastData(forecast)
        setBackendOffline(false)
      } catch {
        setBackendOffline(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Derive data with API fallback to mock constants
  const cashData: typeof CASH_DATA = (cashflowData as any)?.months ?? (cashflowData as any)?.data ?? CASH_DATA
  const currentMonth = cashData[cashData.length - 1] ?? CASH_DATA[CASH_DATA.length - 1]
  const prevMonth = cashData[cashData.length - 2] ?? CASH_DATA[CASH_DATA.length - 2]

  const chartData = cashData.map(d => ({
    month: d.month.replace(' 20', "'"),
    cashIn: d.cashIn,
    cashOut: -d.cashOut,
    cumulative: d.cumulative,
    net: d.net,
  }))

  const forecastPoints = (forecastData as any)?.points ?? (forecastData as any)?.data ?? FORECAST_DATA

  const statementSections: typeof STATEMENT = (cashflowData as any)?.statement ?? STATEMENT
  const netChange = statementSections.reduce((sum: number, s: any) => sum + s.total, 0)
  const closingBalance = currentMonth.cumulative
  const openingBalance = closingBalance - netChange

  const [audioGenerating, setAudioGenerating] = useState(false)
  const [payments, setPayments] = useState<UpcomingPayment[]>(DEFAULT_PAYMENTS)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({
    description: '',
    amount: '',
    date: '',
    direction: 'out' as 'in' | 'out',
    recurring: false,
  })

  const netFlow = currentMonth.cashIn - currentMonth.cashOut
  const prevNetFlow = prevMonth.cashIn - prevMonth.cashOut
  const netFlowChange = prevNetFlow !== 0 ? ((netFlow - prevNetFlow) / Math.abs(prevNetFlow)) * 100 : 0

  function addPayment() {
    if (!newPayment.description || !newPayment.amount || !newPayment.date) return
    const payment: UpcomingPayment = {
      id: String(Date.now()),
      description: newPayment.description,
      amount: Number(newPayment.amount),
      date: newPayment.date,
      direction: newPayment.direction,
      recurring: newPayment.recurring,
    }
    setPayments(prev => [...prev, payment])
    setNewPayment({ description: '', amount: '', date: '', direction: 'out', recurring: false })
    setShowAddPayment(false)
    toast.show('Payment added to forecast', 'success')
  }

  function removePayment(id: string) {
    setPayments(prev => prev.filter(p => p.id !== id))
    toast.show('Payment removed', 'success')
  }

  async function handleAudioSummary() {
    setAudioGenerating(true)
    try {
      await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'cashflow' }),
      })
    } catch { /* dev: no backend */ }
    setAudioGenerating(false)
    audioPlayer.play({
      title: 'Cash Flow Summary',
      subtitle: 'March 2026 · AI Generated',
      duration: '2:20',
    })
  }

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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-16">

      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">Financials</div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-primary text-glow">Cash Flow</h1>
            <p className="text-sm text-on-surface-variant mt-2">Money in vs money out — track liquidity and plan ahead</p>
          </div>
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
      </motion.div>

      {/* Section 1: Cash Position KPI Cards */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Current cash position and monthly cash movement.">Cash Position</SectionHeader>
        <div className="grid grid-cols-3 gap-6">
          {/* Current Cash Position */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Current Cash Position</div>
              <InfoIcon text="Bank balance + any held payment processor funds." />
            </div>
            <div className="text-3xl font-black text-primary mt-3">{fmtSAR(currentMonth.cumulative)}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="material-symbols-outlined text-[14px] text-green-400">trending_up</span>
              <span className="text-[11px] font-bold text-green-400">
                {((currentMonth.cumulative - prevMonth.cumulative) / prevMonth.cumulative * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-on-surface-variant">vs last month</span>
            </div>
          </div>

          {/* Cash In */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Cash In (This Month)</div>
              <InfoIcon text="All incoming cash: sales revenue, refunds received, investments." />
            </div>
            <div className="text-3xl font-black text-green-400 mt-3">{fmtSAR(currentMonth.cashIn)}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="material-symbols-outlined text-[14px] text-green-400">trending_up</span>
              <span className="text-[11px] font-bold text-green-400">
                {((currentMonth.cashIn - prevMonth.cashIn) / prevMonth.cashIn * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-on-surface-variant">vs last month</span>
            </div>
          </div>

          {/* Cash Out */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Cash Out (This Month)</div>
              <InfoIcon text="All outgoing cash: supplier payments, expenses, subscriptions." />
            </div>
            <div className="text-3xl font-black text-error mt-3">{fmtSAR(currentMonth.cashOut)}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`material-symbols-outlined text-[14px] ${currentMonth.cashOut > prevMonth.cashOut ? 'text-error' : 'text-green-400'}`}>
                {currentMonth.cashOut > prevMonth.cashOut ? 'trending_up' : 'trending_down'}
              </span>
              <span className={`text-[11px] font-bold ${currentMonth.cashOut > prevMonth.cashOut ? 'text-error' : 'text-green-400'}`}>
                {Math.abs((currentMonth.cashOut - prevMonth.cashOut) / prevMonth.cashOut * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-on-surface-variant">vs last month</span>
            </div>
          </div>
        </div>

        {/* Net Flow Indicator */}
        <div className="mt-4 glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined text-[20px] ${netFlow >= 0 ? 'text-green-400' : 'text-error'}`}>
              {netFlow >= 0 ? 'arrow_upward' : 'arrow_downward'}
            </span>
            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Net Cash Flow</div>
              <div className={`text-xl font-black ${netFlow >= 0 ? 'text-green-400' : 'text-error'}`}>
                {netFlow >= 0 ? '+' : ''}{fmtSAR(netFlow)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`material-symbols-outlined text-[14px] ${netFlowChange >= 0 ? 'text-green-400' : 'text-error'}`}>
              {netFlowChange >= 0 ? 'trending_up' : 'trending_down'}
            </span>
            <span className={`text-[11px] font-bold ${netFlowChange >= 0 ? 'text-green-400' : 'text-error'}`}>
              {Math.abs(netFlowChange).toFixed(1)}%
            </span>
            <span className="text-[11px] text-on-surface-variant">vs last month</span>
          </div>
        </div>
      </motion.div>

      {/* AI Insights */}
      <motion.div variants={itemVariants}>
        <AIInsightCard
          text="Cash position is healthy at 4,783 SAR but your next supplier batch payment (~12,000 SAR est. April 15) will create a temporary dip. Consider timing your next Salla payout withdrawal to bridge."
        />
      </motion.div>

      {/* Section 2: Cash Flow Chart */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Cash flow shows actual money movement, not accrual accounting. Batch supplier payments create large outflows visible as red spikes.">
          Cash Flow Chart
        </SectionHeader>
        <div className="glass-card p-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(230,230,250,0.04)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#acaaae', fontSize: 11, fontWeight: 700 }}
                  axisLine={{ stroke: 'rgba(230,230,250,0.06)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#acaaae', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => fmtK(v)}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div style={{ ...tooltipStyle.contentStyle }}>
                        <div style={{ color: '#acaaae', marginBottom: 4, fontSize: 11 }}>{label}</div>
                        {payload.map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                            <span style={{ color: String(p.color), fontSize: 11 }}>{p.name}</span>
                            <span style={{ color: '#e6e6fa', fontWeight: 700, fontSize: 11 }}>
                              {fmtSAR(Math.abs(Number(p.value)))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                  cursor={{ stroke: 'rgba(230,230,250,0.1)', strokeWidth: 1 }}
                />
                <ReferenceLine y={0} stroke="rgba(230,230,250,0.15)" strokeWidth={1} />
                <ReferenceLine
                  y={CRITICAL_THRESHOLD}
                  stroke="#ff6e84"
                  strokeDasharray="6 4"
                  label={{ value: 'Min Cash', position: 'right', fill: '#ff6e84', fontSize: 10 }}
                />
                <Bar dataKey="cashIn" name="Cash In" fill="#4ade80" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="cashOut" name="Cash Out" fill="#ff6e84" radius={[0, 0, 4, 4]} barSize={28} />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative"
                  stroke="#cacafe"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#cacafe', stroke: '#0e0e11', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Section 3: Cash Flow Forecast */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="30/60/90-day forward projection based on recurring expenses, average daily revenue, and upcoming known payments.">
          Cash Flow Forecast
        </SectionHeader>
        <div className="glass-card p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastPoints} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="cfConfidence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cacafe" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#cacafe" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(230,230,250,0.04)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#acaaae', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(230,230,250,0.06)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#acaaae', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => fmtK(v)}
                />
                <RechartsTooltip
                  {...tooltipStyle}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div style={{ ...tooltipStyle.contentStyle }}>
                        <div style={{ color: '#acaaae', marginBottom: 4, fontSize: 11 }}>{label}</div>
                        {payload.map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                            <span style={{ color: String(p.color), fontSize: 11 }}>{p.name}</span>
                            <span style={{ color: '#e6e6fa', fontWeight: 700, fontSize: 11 }}>{fmtSAR(Number(p.value))}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
                <ReferenceLine y={CRITICAL_THRESHOLD} stroke="#ff6e84" strokeDasharray="6 4" />
                <Area type="monotone" dataKey="optimistic" stroke="none" fill="url(#cfConfidence)" />
                <Area type="monotone" dataKey="pessimistic" stroke="none" fill="transparent" />
                <Line type="monotone" dataKey="projected" stroke="#cacafe" strokeWidth={2} dot={false} name="Projected" />
                <Line type="monotone" dataKey="optimistic" stroke="#4ade80" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Optimistic" />
                <Line type="monotone" dataKey="pessimistic" stroke="#ff6e84" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Pessimistic" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Payment Callout Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {payments.map(p => (
            <div key={p.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`material-symbols-outlined text-[20px] shrink-0 ${p.direction === 'in' ? 'text-green-400' : 'text-error'}`}>
                  {p.direction === 'in' ? 'south_west' : 'north_east'}
                </span>
                <div className="min-w-0">
                  <div className="text-sm text-on-surface font-semibold truncate">{p.description}</div>
                  <div className="text-[11px] text-on-surface-variant mt-0.5">
                    {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {p.recurring && <span className="ml-2 text-secondary">↻ Recurring</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-sm font-black ${p.direction === 'in' ? 'text-green-400' : 'text-error'}`}>
                  {p.direction === 'in' ? '+' : '−'}{fmtSAR(p.amount)}
                </span>
                <button
                  onClick={() => removePayment(p.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Expected Payment */}
        <div className="mt-4">
          {!showAddPayment ? (
            <button
              onClick={() => setShowAddPayment(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary font-semibold hover:bg-secondary/20 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add Expected Payment
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card p-5"
              >
                <div className="grid grid-cols-6 gap-3">
                  <div className="col-span-2">
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Description</div>
                    <input
                      type="text"
                      value={newPayment.description}
                      onChange={e => setNewPayment(p => ({ ...p, description: e.target.value }))}
                      placeholder="e.g. Supplier batch payment"
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Amount (SAR)</div>
                    <input
                      type="number"
                      value={newPayment.amount}
                      onChange={e => setNewPayment(p => ({ ...p, amount: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Date</div>
                    <input
                      type="date"
                      value={newPayment.date}
                      onChange={e => setNewPayment(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Direction</div>
                    <select
                      value={newPayment.direction}
                      onChange={e => setNewPayment(p => ({ ...p, direction: e.target.value as 'in' | 'out' }))}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
                    >
                      <option value="out">Cash Out</option>
                      <option value="in">Cash In</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPayment.recurring}
                        onChange={e => setNewPayment(p => ({ ...p, recurring: e.target.checked }))}
                        className="accent-secondary"
                      />
                      <span className="text-[10px] text-on-surface-variant">Recurring</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={addPayment}
                    className="px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold hover:bg-primary/20 transition-all"
                  >
                    Add Payment
                  </button>
                  <button
                    onClick={() => setShowAddPayment(false)}
                    className="px-4 py-2 rounded-xl text-on-surface-variant hover:text-primary transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Section 4: Cash Flow Statement */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Classic cash flow statement format: Operating, Investing, and Financing activities with net change.">
          Cash Flow Statement
        </SectionHeader>
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/[0.06]">
                <th className="text-left text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-5 py-3 w-2/3">
                  Category
                </th>
                <th className="text-right text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-5 py-3">
                  March 2026
                </th>
              </tr>
            </thead>
            <tbody>
              {statementSections.map(section => (
                <StatementSectionRows key={section.label} section={section} />
              ))}
              {/* Net Change */}
              <tr className="border-t-2 border-primary/[0.12] bg-primary/[0.04]">
                <td className="px-5 py-4">
                  <span className="text-sm font-bold text-primary uppercase tracking-[0.1em]">Net Cash Change</span>
                </td>
                <td className={`text-right px-5 py-4 text-base font-black font-mono ${netChange >= 0 ? 'text-green-400' : 'text-error'}`}>
                  {netChange >= 0 ? '+' : ''}{fmtSAR(netChange)}
                </td>
              </tr>
              {/* Opening & Closing */}
              <tr className="border-b border-primary/[0.04]">
                <td className="px-5 py-3">
                  <span className="text-sm text-on-surface-variant">Opening Balance</span>
                </td>
                <td className="text-right px-5 py-3 text-sm font-mono text-on-surface-variant">{fmtSAR(openingBalance)}</td>
              </tr>
              <tr className="bg-primary/[0.04]">
                <td className="px-5 py-4">
                  <span className="text-sm font-bold text-primary uppercase tracking-[0.1em]">Closing Balance</span>
                </td>
                <td className="text-right px-5 py-4 text-base font-black font-mono text-primary">{fmtSAR(closingBalance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Statement Section Rows
// ---------------------------------------------------------------------------
function StatementSectionRows({ section }: { section: StatementSection }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <>
      <tr
        className="border-b border-primary/[0.06] cursor-pointer hover:bg-primary/[0.02] transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-[16px] text-on-surface-variant transition-transform"
              style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              chevron_right
            </span>
            <span className="text-sm font-bold text-on-surface">{section.label}</span>
          </div>
        </td>
        <td className={`text-right px-5 py-3.5 text-sm font-bold font-mono ${section.total >= 0 ? 'text-green-400' : 'text-error'}`}>
          {section.total >= 0 ? '+' : ''}{fmtSAR(section.total)}
        </td>
      </tr>
      <AnimatePresence>
        {expanded && section.items.map(item => (
          <motion.tr
            key={item.label}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all"
          >
            <td className="px-5 py-3">
              <div style={{ paddingLeft: 40 }}>
                <span className="text-sm text-on-surface-variant">{item.label}</span>
              </div>
            </td>
            <td className={`text-right px-5 py-3 text-sm font-mono ${item.amount < 0 ? 'text-error/80' : 'text-on-surface-variant'}`}>
              {item.amount >= 0 ? '+' : ''}{fmtSAR(item.amount)}
            </td>
          </motion.tr>
        ))}
      </AnimatePresence>
    </>
  )
}
