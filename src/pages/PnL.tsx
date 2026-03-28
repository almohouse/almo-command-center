import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '@/lib/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { useAudioPlayer } from '@/data/audio-player'
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

function fmtParens(n: number) {
  if (n < 0) return `(${Math.abs(n).toLocaleString('en-SA')} SAR)`
  return `${n.toLocaleString('en-SA')} SAR`
}

function fmtK(n: number) {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(0)}K`
  return String(n)
}

// ---------------------------------------------------------------------------
// Period types
// ---------------------------------------------------------------------------
const VIEW_MODES = ['Monthly', 'Quarterly', 'Annual'] as const
type ViewMode = (typeof VIEW_MODES)[number]


// ---------------------------------------------------------------------------
// P&L Data by month — realistic ALMO figures in SAR
// ---------------------------------------------------------------------------
interface MonthData {
  // Revenue
  sallaSales: number
  b2bSales: number
  // COGS
  productCosts: number
  freightCustoms: number
  packaging: number
  // Operating Expenses
  marketingAdvertising: number
  shippingFulfillment: number
  softwareSubscriptions: number
  aiAgentCosts: number
  generalAdmin: number
}

const MONTHLY_DATA: Record<string, MonthData> = {
  'Jan 2026': {
    sallaSales: 78200, b2bSales: 12500,
    productCosts: 32400, freightCustoms: 8200, packaging: 3100,
    marketingAdvertising: 9800, shippingFulfillment: 6200, softwareSubscriptions: 4050, aiAgentCosts: 380, generalAdmin: 5200,
  },
  'Feb 2026': {
    sallaSales: 92100, b2bSales: 18400,
    productCosts: 38600, freightCustoms: 9500, packaging: 3600,
    marketingAdvertising: 12400, shippingFulfillment: 7800, softwareSubscriptions: 4150, aiAgentCosts: 420, generalAdmin: 5500,
  },
  'Mar 2026': {
    sallaSales: 108500, b2bSales: 22800,
    productCosts: 45200, freightCustoms: 11800, packaging: 4200,
    marketingAdvertising: 14500, shippingFulfillment: 9200, softwareSubscriptions: 4250, aiAgentCosts: 480, generalAdmin: 5800,
  },
  'Oct 2025': {
    sallaSales: 62400, b2bSales: 8200,
    productCosts: 26800, freightCustoms: 6400, packaging: 2400,
    marketingAdvertising: 7200, shippingFulfillment: 4800, softwareSubscriptions: 3800, aiAgentCosts: 280, generalAdmin: 4500,
  },
  'Nov 2025': {
    sallaSales: 71300, b2bSales: 10600,
    productCosts: 29500, freightCustoms: 7200, packaging: 2800,
    marketingAdvertising: 8500, shippingFulfillment: 5400, softwareSubscriptions: 3900, aiAgentCosts: 320, generalAdmin: 4800,
  },
  'Dec 2025': {
    sallaSales: 98700, b2bSales: 15800,
    productCosts: 41200, freightCustoms: 10200, packaging: 3800,
    marketingAdvertising: 18200, shippingFulfillment: 8400, softwareSubscriptions: 4000, aiAgentCosts: 350, generalAdmin: 5600,
  },
}

// Ordered keys for navigation
const MONTH_KEYS = ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'] as const

function computeFromData(d: MonthData) {
  const totalRevenue = d.sallaSales + d.b2bSales
  const totalCOGS = d.productCosts + d.freightCustoms + d.packaging
  const grossProfit = totalRevenue - totalCOGS
  const totalOpex = d.marketingAdvertising + d.shippingFulfillment + d.softwareSubscriptions + d.aiAgentCosts + d.generalAdmin
  const netProfit = grossProfit - totalOpex
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
  return { totalRevenue, totalCOGS, grossProfit, totalOpex, netProfit, grossMargin, netMargin }
}

function aggregateMonths(keys: string[]) {
  const base: MonthData = {
    sallaSales: 0, b2bSales: 0,
    productCosts: 0, freightCustoms: 0, packaging: 0,
    marketingAdvertising: 0, shippingFulfillment: 0, softwareSubscriptions: 0, aiAgentCosts: 0, generalAdmin: 0,
  }
  for (const k of keys) {
    const d = MONTHLY_DATA[k]
    if (!d) continue
    base.sallaSales += d.sallaSales
    base.b2bSales += d.b2bSales
    base.productCosts += d.productCosts
    base.freightCustoms += d.freightCustoms
    base.packaging += d.packaging
    base.marketingAdvertising += d.marketingAdvertising
    base.shippingFulfillment += d.shippingFulfillment
    base.softwareSubscriptions += d.softwareSubscriptions
    base.aiAgentCosts += d.aiAgentCosts
    base.generalAdmin += d.generalAdmin
  }
  return base
}

// ---------------------------------------------------------------------------
// Waterfall helpers
// ---------------------------------------------------------------------------
interface WaterfallItem {
  name: string
  value: number
  start: number
  fill: string
}

function buildWaterfall(data: MonthData): WaterfallItem[] {
  const c = computeFromData(data)
  let running = c.totalRevenue
  const items: WaterfallItem[] = [
    { name: 'Revenue', value: c.totalRevenue, start: 0, fill: '#4ade80' },
  ]
  const expenses: [string, number][] = [
    ['COGS', c.totalCOGS],
    ['Marketing', data.marketingAdvertising],
    ['Shipping', data.shippingFulfillment],
    ['Subscriptions', data.softwareSubscriptions],
    ['Operations', data.aiAgentCosts + data.generalAdmin],
  ]
  for (const [name, value] of expenses) {
    items.push({ name, value, start: running - value, fill: '#ff6e84' })
    running -= value
  }
  items.push({
    name: 'Net Profit',
    value: c.netProfit,
    start: c.netProfit >= 0 ? 0 : Math.abs(c.netProfit),
    fill: c.netProfit >= 0 ? '#4ade80' : '#ff6e84',
  })
  return items
}

// ---------------------------------------------------------------------------
// P&L Statement row types
// ---------------------------------------------------------------------------
interface StatementRow {
  label: string
  amount: number
  indent: number
  bold?: boolean
  highlight?: boolean
  margin?: number
  infoText?: string
  expandable?: boolean
  children?: StatementRow[]
}

function buildStatement(data: MonthData): StatementRow[] {
  const c = computeFromData(data)
  return [
    {
      label: 'Revenue', amount: c.totalRevenue, indent: 0, bold: true, expandable: true,
      children: [
        { label: 'Salla Sales', amount: data.sallaSales, indent: 1 },
        { label: 'B2B Sales', amount: data.b2bSales, indent: 1 },
      ],
    },
    {
      label: 'Cost of Goods Sold', amount: -c.totalCOGS, indent: 0, bold: true, expandable: true,
      infoText: 'Cost of Goods Sold — direct costs to acquire/produce the products you sell.',
      children: [
        { label: 'Product Costs', amount: -data.productCosts, indent: 1 },
        { label: 'Freight & Customs', amount: -data.freightCustoms, indent: 1 },
        { label: 'Packaging', amount: -data.packaging, indent: 1 },
      ],
    },
    {
      label: 'GROSS PROFIT', amount: c.grossProfit, indent: 0, bold: true, highlight: true,
      margin: c.grossMargin,
      infoText: 'Revenue minus COGS. Shows if your products are priced profitably before overhead.',
    },
    {
      label: 'Operating Expenses', amount: -c.totalOpex, indent: 0, bold: true, expandable: true,
      infoText: 'All costs of running the business that aren\'t directly tied to producing products.',
      children: [
        { label: 'Marketing & Advertising', amount: -data.marketingAdvertising, indent: 1 },
        { label: 'Shipping & Fulfillment', amount: -data.shippingFulfillment, indent: 1 },
        { label: 'Software & Subscriptions', amount: -data.softwareSubscriptions, indent: 1 },
        { label: 'AI Agent Costs', amount: -data.aiAgentCosts, indent: 1 },
        { label: 'General & Administrative', amount: -data.generalAdmin, indent: 1 },
      ],
    },
    {
      label: 'NET PROFIT', amount: c.netProfit, indent: 0, bold: true, highlight: true,
      margin: c.netMargin,
    },
  ]
}

// ---------------------------------------------------------------------------
// Custom waterfall bar shape
// ---------------------------------------------------------------------------
function WaterfallBar(props: Record<string, unknown>) {
  const { x, y, width, height, fill } = props as { x: number; y: number; width: number; height: number; fill: string }
  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} />
}

// ---------------------------------------------------------------------------
// PnL Page
// ---------------------------------------------------------------------------
export default function PnL() {
  const audioPlayer = useAudioPlayer()

  const [loading, setLoading] = useState(true)
  const [_backendOffline, setBackendOffline] = useState(false)
  const [pnlData, setPnlData] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.pnl.get('monthly', 'all')
        setPnlData(data)
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
    if (pnlData && typeof pnlData === 'object') {
      // If backend returns monthly breakdown, merge into local data
      const months = (pnlData as any).months ?? (pnlData as any).data
      if (months && typeof months === 'object') {
        for (const [key, val] of Object.entries(months)) {
          if (MONTHLY_DATA[key] && typeof val === 'object') {
            Object.assign(MONTHLY_DATA[key], val)
          }
        }
      }
    }
  }, [pnlData])

  const [audioGenerating, setAudioGenerating] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('Monthly')
  const [monthIdx, setMonthIdx] = useState(5) // Mar 2026
  const [compare, setCompare] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Current period data
  const currentPeriodData = useMemo(() => {
    if (viewMode === 'Monthly') {
      return MONTHLY_DATA[MONTH_KEYS[monthIdx]] || MONTHLY_DATA['Mar 2026']
    }
    if (viewMode === 'Quarterly') {
      // Q1 2026 = Jan-Mar, Q4 2025 = Oct-Dec
      const qIdx = monthIdx >= 3 ? 0 : 1 // 0 = Q1 2026, 1 = Q4 2025
      const keys = qIdx === 0 ? ['Jan 2026', 'Feb 2026', 'Mar 2026'] : ['Oct 2025', 'Nov 2025', 'Dec 2025']
      return aggregateMonths(keys)
    }
    // Annual — all available
    return aggregateMonths([...MONTH_KEYS])
  }, [viewMode, monthIdx])

  const previousPeriodData = useMemo(() => {
    if (viewMode === 'Monthly') {
      const prevIdx = Math.max(0, monthIdx - 1)
      return MONTHLY_DATA[MONTH_KEYS[prevIdx]] || MONTHLY_DATA['Feb 2026']
    }
    if (viewMode === 'Quarterly') {
      const qIdx = monthIdx >= 3 ? 0 : 1
      const keys = qIdx === 0 ? ['Oct 2025', 'Nov 2025', 'Dec 2025'] : ['Oct 2025', 'Nov 2025', 'Dec 2025']
      return aggregateMonths(keys)
    }
    return aggregateMonths(['Oct 2025', 'Nov 2025', 'Dec 2025'])
  }, [viewMode, monthIdx])

  const current = computeFromData(currentPeriodData)
  const previous = computeFromData(previousPeriodData)

  const periodLabel = useMemo(() => {
    if (viewMode === 'Monthly') return MONTH_KEYS[monthIdx]
    if (viewMode === 'Quarterly') return monthIdx >= 3 ? 'Q1 2026' : 'Q4 2025'
    return 'FY 2025-2026'
  }, [viewMode, monthIdx])

  // Waterfall data
  const waterfallData = useMemo(() => buildWaterfall(currentPeriodData), [currentPeriodData])

  // Statement data
  const statementRows = useMemo(() => buildStatement(currentPeriodData), [currentPeriodData])
  const prevStatementRows = useMemo(() => buildStatement(previousPeriodData), [previousPeriodData])

  function toggleExpand(label: string) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  // Period navigation
  function navPrev() {
    if (viewMode === 'Monthly') setMonthIdx(i => Math.max(0, i - 1))
    else if (viewMode === 'Quarterly') setMonthIdx(i => (i >= 3 ? 0 : 0))
    // Annual: no nav
  }

  function navNext() {
    if (viewMode === 'Monthly') setMonthIdx(i => Math.min(MONTH_KEYS.length - 1, i + 1))
    else if (viewMode === 'Quarterly') setMonthIdx(i => (i < 3 ? 5 : 5))
    // Annual: no nav
  }

  async function handleAudioSummary() {
    setAudioGenerating(true)
    try {
      await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'pnl' }),
      })
    } catch { /* dev: no backend */ }
    setAudioGenerating(false)
    audioPlayer.play({
      title: 'P&L Summary',
      subtitle: `${periodLabel} · AI Generated`,
      duration: '2:15',
    })
  }

  // ---------------------------------------------------------------------------
  // Render
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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-16">

      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">Financials</div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-primary text-glow">Profit & Loss</h1>
            <p className="text-sm text-on-surface-variant mt-2">Complete P&L statement — monthly, quarterly, and annual views</p>
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

      {/* Section 4: Period Selector (placed near top for usability) */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-4 flex-wrap">
          {/* View mode toggle */}
          <div className="flex rounded-xl border border-primary/[0.08] overflow-hidden">
            {VIEW_MODES.map(mode => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode)
                  if (mode === 'Monthly') setMonthIdx(5)
                  else if (mode === 'Quarterly') setMonthIdx(5)
                }}
                className={[
                  'px-4 py-2 text-xs font-bold tracking-[0.08em] uppercase transition-all',
                  viewMode === mode
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:text-primary hover:bg-primary/[0.05]',
                ].join(' ')}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Period navigator */}
          {viewMode !== 'Annual' && (
            <div className="flex items-center gap-2">
              <button
                onClick={navPrev}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/[0.05] hover:text-primary transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <div className="px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm font-semibold text-primary min-w-[120px] text-center">
                {periodLabel}
              </div>
              <button
                onClick={navNext}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/[0.05] hover:text-primary transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          )}

          {/* Compare toggle */}
          <button
            onClick={() => setCompare(!compare)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-[0.08em] uppercase border transition-all',
              compare
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'text-on-surface-variant border-primary/[0.06] hover:text-primary',
            ].join(' ')}
          >
            <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
            Compare
          </button>
        </div>
      </motion.div>

      {/* Section 1: P&L Summary Cards */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Key profitability metrics for the selected period.">P&L Summary</SectionHeader>
        <div className="grid grid-cols-3 gap-6">
          {/* Gross Profit */}
          <SummaryCard
            label="Gross Profit"
            value={current.grossProfit}
            prevValue={previous.grossProfit}
            info="Revenue minus direct product costs. Shows product profitability before overhead."
          />
          {/* Net Profit */}
          <SummaryCard
            label="Net Profit"
            value={current.netProfit}
            prevValue={previous.netProfit}
            info="Bottom line after ALL costs. This is what ALMO actually earns."
          />
          {/* Net Margin */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
                Net Margin
              </div>
              <InfoIcon text="Net profit as a percentage of revenue. Higher = more profitable. Target: >20% for DTC." />
            </div>
            <div className={`text-3xl font-black mt-3 ${current.netMargin >= 0 ? 'text-green-400' : 'text-error'}`}>
              {current.netMargin.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <TrendBadge current={current.netMargin} previous={previous.netMargin} suffix="pp" />
              <span className="text-[11px] text-on-surface-variant">vs previous</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Insights */}
      <motion.div variants={itemVariants}>
        <AIInsightCard
          text="Net margin improved from 18% to 22% this quarter. Main driver: shipping cost reduction from bulk batch ordering."
        />
      </motion.div>

      {/* Section 2: Waterfall Chart */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Waterfall chart shows how revenue flows down to net profit after each expense category is subtracted.">
          P&L Waterfall
        </SectionHeader>
        <div className="glass-card p-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
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
                  tickFormatter={(v: number) => `${fmtK(v)}`}
                />
                <RechartsTooltip
                  {...tooltipStyle}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const item = payload[0]?.payload as WaterfallItem
                    if (!item) return null
                    return (
                      <div style={{ ...tooltipStyle.contentStyle }}>
                        <div style={{ color: '#acaaae', marginBottom: 2, fontSize: 11 }}>{item.name}</div>
                        <div style={{ color: '#e6e6fa', fontWeight: 700, fontSize: 12 }}>{fmtSAR(item.value)}</div>
                      </div>
                    )
                  }}
                />
                <ReferenceLine y={0} stroke="rgba(230,230,250,0.1)" />
                {/* Invisible spacer bar */}
                <Bar dataKey="start" stackId="waterfall" fill="transparent" shape={<></>} />
                {/* Visible bar */}
                <Bar dataKey="value" stackId="waterfall" shape={<WaterfallBar />}>
                  {waterfallData.map((item, idx) => (
                    <Cell key={idx} fill={item.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Section 3: P&L Statement Table */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Classic accounting-style profit and loss statement with expandable categories.">
          P&L Statement
        </SectionHeader>
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/[0.06]">
                <th className="text-left text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-5 py-3 w-1/2">
                  Category
                </th>
                <th className="text-right text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-5 py-3">
                  {periodLabel}
                </th>
                {compare && (
                  <th className="text-right text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-5 py-3">
                    Previous
                  </th>
                )}
                <th className="text-right text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-5 py-3 w-24">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody>
              {statementRows.map((row, rIdx) => {
                const prevRow = prevStatementRows[rIdx]
                return (
                  <StatementRowComponent
                    key={row.label}
                    row={row}
                    prevRow={compare ? prevRow : undefined}
                    expanded={expandedRows.has(row.label)}
                    onToggle={() => toggleExpand(row.label)}
                    compare={compare}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Summary Card component
// ---------------------------------------------------------------------------
function SummaryCard({ label, value, prevValue, info }: {
  label: string
  value: number
  prevValue: number
  info: string
}) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2">
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
          {label}
        </div>
        <InfoIcon text={info} />
      </div>
      <div className={`text-3xl font-black mt-3 ${value >= 0 ? 'text-green-400' : 'text-error'}`}>
        {fmtSAR(value)}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <TrendBadge current={value} previous={prevValue} />
        <span className="text-[11px] text-on-surface-variant">vs previous</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Trend Badge
// ---------------------------------------------------------------------------
function TrendBadge({ current, previous, suffix = '%' }: { current: number; previous: number; suffix?: string }) {
  const change = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0
  const isUp = change > 0
  const isDown = change < 0
  const color = isUp ? 'text-green-400' : isDown ? 'text-error' : 'text-on-surface-variant'
  const icon = isUp ? 'trending_up' : isDown ? 'trending_down' : 'trending_flat'
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-bold ${color}`}>
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {Math.abs(change).toFixed(1)}{suffix}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Statement Row Component
// ---------------------------------------------------------------------------
function StatementRowComponent({ row, prevRow, expanded, onToggle, compare }: {
  row: StatementRow
  prevRow?: StatementRow
  expanded: boolean
  onToggle: () => void
  compare: boolean
}) {
  const isNegative = row.amount < 0
  const isSeparator = row.highlight

  return (
    <>
      <tr
        className={[
          'border-b transition-all',
          isSeparator
            ? 'border-primary/[0.08] bg-primary/[0.04]'
            : 'border-primary/[0.04] hover:bg-primary/[0.02]',
          row.expandable ? 'cursor-pointer' : '',
        ].join(' ')}
        onClick={row.expandable ? onToggle : undefined}
      >
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2" style={{ paddingLeft: row.indent * 24 }}>
            {row.expandable && (
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant transition-transform" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                chevron_right
              </span>
            )}
            <span className={`text-sm ${row.bold ? 'font-bold' : ''} ${isSeparator ? 'text-primary uppercase tracking-[0.1em]' : 'text-on-surface'}`}>
              {row.label}
            </span>
            {row.infoText && <InfoIcon text={row.infoText} />}
          </div>
        </td>
        <td className={`text-right px-5 py-3.5 text-sm font-mono ${row.bold ? 'font-bold' : ''} ${isSeparator ? 'text-primary text-base' : ''} ${isNegative ? 'text-error' : isSeparator ? 'text-primary' : 'text-on-surface'}`}>
          {fmtParens(row.amount)}
        </td>
        {compare && prevRow && (
          <td className={`text-right px-5 py-3.5 text-sm font-mono ${prevRow.amount < 0 ? 'text-error/60' : 'text-on-surface-variant'}`}>
            {fmtParens(prevRow.amount)}
          </td>
        )}
        <td className="text-right px-5 py-3.5 text-sm text-on-surface-variant">
          {row.margin !== undefined && (
            <span className={`font-mono ${row.margin >= 0 ? 'text-green-400/80' : 'text-error/80'}`}>
              {row.margin.toFixed(1)}%
            </span>
          )}
        </td>
      </tr>
      {/* Expanded children */}
      <AnimatePresence>
        {expanded && row.children && row.children.map((child, cIdx) => {
          const prevChild = prevRow?.children?.[cIdx]
          return (
            <motion.tr
              key={child.label}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all"
            >
              <td className="px-5 py-3">
                <div style={{ paddingLeft: 48 }}>
                  <span className="text-sm text-on-surface-variant">{child.label}</span>
                </div>
              </td>
              <td className={`text-right px-5 py-3 text-sm font-mono ${child.amount < 0 ? 'text-error/80' : 'text-on-surface-variant'}`}>
                {fmtParens(child.amount)}
              </td>
              {compare && prevChild && (
                <td className={`text-right px-5 py-3 text-sm font-mono ${prevChild.amount < 0 ? 'text-error/50' : 'text-on-surface-variant/60'}`}>
                  {fmtParens(prevChild.amount)}
                </td>
              )}
              <td className="px-5 py-3" />
            </motion.tr>
          )
        })}
      </AnimatePresence>
    </>
  )
}
