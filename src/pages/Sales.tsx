import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { api } from '@/lib/api'
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
// Time ranges
// ---------------------------------------------------------------------------
const TIME_RANGES = ['Today', '7 Days', '30 Days', '90 Days', 'This Year', 'Custom'] as const
type TimeRange = (typeof TIME_RANGES)[number]

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const REVENUE_TREND = [
  { date: 'Mar 1', revenue: 4200, orders: 8 },
  { date: 'Mar 3', revenue: 6100, orders: 11 },
  { date: 'Mar 5', revenue: 3800, orders: 7 },
  { date: 'Mar 7', revenue: 7500, orders: 14 },
  { date: 'Mar 9', revenue: 5200, orders: 9 },
  { date: 'Mar 11', revenue: 8900, orders: 16 },
  { date: 'Mar 13', revenue: 6700, orders: 12 },
  { date: 'Mar 15', revenue: 9200, orders: 17 },
  { date: 'Mar 17', revenue: 7100, orders: 13 },
  { date: 'Mar 19', revenue: 10300, orders: 19 },
  { date: 'Mar 21', revenue: 8400, orders: 15 },
  { date: 'Mar 23', revenue: 11200, orders: 21 },
  { date: 'Mar 25', revenue: 9600, orders: 18 },
  { date: 'Mar 27', revenue: 12100, orders: 22 },
]

const PRODUCTS = [
  { name: 'ALMO Comfort Pillow', revenue: 42500, pct: 28 },
  { name: 'ALMO Weighted Blanket', revenue: 35200, pct: 23 },
  { name: 'ALMO Memory Foam Topper', revenue: 28100, pct: 18 },
  { name: 'ALMO Cooling Sheet Set', revenue: 19800, pct: 13 },
  { name: 'ALMO Sleep Mask Pro', revenue: 12400, pct: 8 },
  { name: 'ALMO Bamboo Pillowcase', revenue: 8300, pct: 5 },
  { name: 'ALMO Aromatherapy Diffuser', revenue: 4200, pct: 3 },
  { name: 'ALMO Comfort Bundle', revenue: 2800, pct: 2 },
]

const STATUS_CLASSES: Record<string, string> = {
  Completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  Processing: 'bg-secondary/10 text-secondary border-secondary/20',
  Refunded: 'bg-red-500/10 text-red-400 border-red-500/20',
  Cancelled: 'bg-on-surface-variant/10 text-on-surface-variant border-on-surface-variant/20',
}

const ORDERS = [
  { date: '2026-03-27', order: 'ALM-1047', customer: 'Sarah Al-Rashid', product: 'ALMO Comfort Pillow', qty: 2, amount: 598, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-27', order: 'ALM-1046', customer: 'Ahmad Hassan', product: 'ALMO Weighted Blanket', qty: 1, amount: 749, status: 'Processing', channel: 'Salla' },
  { date: '2026-03-26', order: 'ALM-1045', customer: 'Noura Al-Otaibi', product: 'ALMO Memory Foam Topper', qty: 1, amount: 1299, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-26', order: 'ALM-1044', customer: 'Fahad Al-Dosari', product: 'ALMO Cooling Sheet Set', qty: 1, amount: 459, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-25', order: 'ALM-1043', customer: 'Maha Al-Zahrani', product: 'ALMO Comfort Pillow', qty: 3, amount: 897, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-25', order: 'ALM-1042', customer: 'Yusuf Ibrahim', product: 'ALMO Sleep Mask Pro', qty: 2, amount: 298, status: 'Refunded', channel: 'Salla' },
  { date: '2026-03-24', order: 'ALM-1041', customer: 'Reem Al-Harbi', product: 'ALMO Weighted Blanket', qty: 1, amount: 749, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-24', order: 'ALM-1040', customer: 'Khalid Mansour', product: 'ALMO Bamboo Pillowcase', qty: 4, amount: 396, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-23', order: 'ALM-1039', customer: 'Lina Al-Saud', product: 'ALMO Comfort Bundle', qty: 1, amount: 1899, status: 'Processing', channel: 'Salla' },
  { date: '2026-03-23', order: 'ALM-1038', customer: 'Omar Al-Qahtani', product: 'ALMO Memory Foam Topper', qty: 1, amount: 1299, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-22', order: 'ALM-1037', customer: 'Huda Al-Shehri', product: 'ALMO Cooling Sheet Set', qty: 2, amount: 918, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-22', order: 'ALM-1036', customer: 'Sultan Al-Mutairi', product: 'ALMO Aromatherapy Diffuser', qty: 1, amount: 189, status: 'Cancelled', channel: 'Salla' },
  { date: '2026-03-21', order: 'ALM-1035', customer: 'Amal Al-Ghamdi', product: 'ALMO Comfort Pillow', qty: 1, amount: 299, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-21', order: 'ALM-1034', customer: 'Tariq Al-Fahad', product: 'ALMO Weighted Blanket', qty: 2, amount: 1498, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-20', order: 'ALM-1033', customer: 'Dina Al-Turki', product: 'ALMO Sleep Mask Pro', qty: 1, amount: 149, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-20', order: 'ALM-1032', customer: 'Badr Al-Subaie', product: 'ALMO Comfort Pillow', qty: 2, amount: 598, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-19', order: 'ALM-1031', customer: 'Salma Al-Rashidi', product: 'ALMO Bamboo Pillowcase', qty: 6, amount: 594, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-19', order: 'ALM-1030', customer: 'Nasser Al-Harbi', product: 'ALMO Memory Foam Topper', qty: 1, amount: 1299, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-18', order: 'ALM-1029', customer: 'Layla Al-Otaibi', product: 'ALMO Cooling Sheet Set', qty: 1, amount: 459, status: 'Refunded', channel: 'Salla' },
  { date: '2026-03-18', order: 'ALM-1028', customer: 'Majid Al-Dosari', product: 'ALMO Comfort Bundle', qty: 1, amount: 1899, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-17', order: 'ALM-1027', customer: 'Hanan Al-Zahrani', product: 'ALMO Comfort Pillow', qty: 1, amount: 299, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-17', order: 'ALM-1026', customer: 'Faisal Al-Qahtani', product: 'ALMO Weighted Blanket', qty: 1, amount: 749, status: 'Processing', channel: 'Salla' },
  { date: '2026-03-16', order: 'ALM-1025', customer: 'Mona Al-Shehri', product: 'ALMO Sleep Mask Pro', qty: 3, amount: 447, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-16', order: 'ALM-1024', customer: 'Abdulaziz Al-Mutairi', product: 'ALMO Aromatherapy Diffuser', qty: 2, amount: 378, status: 'Completed', channel: 'Salla' },
  { date: '2026-03-15', order: 'ALM-1023', customer: 'Nora Al-Ghamdi', product: 'ALMO Memory Foam Topper', qty: 1, amount: 1299, status: 'Completed', channel: 'Salla' },
]

const SORT_KEYS = ['date', 'order', 'customer', 'product', 'qty', 'amount', 'status'] as const
type SortKey = (typeof SORT_KEYS)[number]

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
function fmtSAR(n: number) {
  return n.toLocaleString('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 })
}

function fmtK(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n)
}

// ---------------------------------------------------------------------------
// Sales Page
// ---------------------------------------------------------------------------
export default function Sales() {
  const navigate = useNavigate()
  const audioPlayer = useAudioPlayer()
  const [audioGenerating, setAudioGenerating] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('30 Days')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortAsc, setSortAsc] = useState(false)
  const [page, setPage] = useState(0)
  const [comparePrevious, setComparePrevious] = useState(false)

  // Backend data state
  const [loading, setLoading] = useState(true)
  const [_backendOffline, setBackendOffline] = useState(false)
  const [salesData, setSalesData] = useState<any>(null)
  const [productsData, setProductsData] = useState<any>(null)
  const [summaryData, setSummaryData] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [sales, products, summary] = await Promise.all([
          api.sales.list(),
          api.products.list(),
          api.dashboard.summary(),
        ])
        setSalesData(sales)
        setProductsData(products)
        setSummaryData(summary)
        setBackendOffline(false)
      } catch {
        setBackendOffline(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Derive from API or fallback to mock
  const orders: typeof ORDERS = (salesData as any)?.items ?? (salesData as any) ?? ORDERS
  const products: typeof PRODUCTS = (productsData as any)?.items ?? (productsData as any)?.map?.((p: any) => ({
    name: p.name,
    revenue: p.revenue ?? 0,
    pct: p.pct ?? 0,
  })) ?? PRODUCTS

  const s = summaryData || {}
  const kpiRevenue = s.mtd?.revenue ?? s.mtdRevenue ?? 153300
  const kpiOrders = s.mtd?.orders ?? s.totalOrders ?? 287
  const kpiAOV = s.mtd?.aov ?? s.aov ?? 534

  const PAGE_SIZE = 25

  // Sorted + filtered orders
  const filteredOrders = useMemo(() => {
    let list = [...orders]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (o) =>
          o.order.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.product.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return list
  }, [orders, search, sortKey, sortAsc])

  const pagedOrders = filteredOrders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
    setPage(0)
  }

  async function handleAudioSummary() {
    setAudioGenerating(true)
    try {
      await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'sales' }),
      })
    } catch {
      /* dev: no backend */
    }
    setAudioGenerating(false)
    audioPlayer.play({
      title: 'Sales Summary',
      subtitle: 'March 2026 · AI Generated',
      duration: '2:15',
    })
  }

  function handleExport() {
    const header = 'Date,Order,Customer,Product,Qty,Amount,Status,Channel'
    const rows = filteredOrders.map(
      (o) => `${o.date},${o.order},${o.customer},${o.product},${o.qty},${o.amount},${o.status},${o.channel}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'almo-sales-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Previous period ghost data for comparison overlay
  const REVENUE_PREV = REVENUE_TREND.map((d) => ({
    ...d,
    prevRevenue: Math.round(d.revenue * (0.7 + Math.random() * 0.3)),
  }))

  const chartData = comparePrevious ? REVENUE_PREV : REVENUE_TREND

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
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
          Financials
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-black text-primary text-glow">Sales</h1>
            <p className="text-sm text-on-surface-variant mt-2">
              Complete sales performance — revenue, orders, products, and channels
            </p>
          </div>
          <button
            onClick={handleAudioSummary}
            disabled={audioGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all disabled:opacity-50 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">
              {audioGenerating ? 'hourglass_empty' : 'play_arrow'}
            </span>
            {audioGenerating ? 'Generating...' : 'Audio Summary'}
          </button>
        </div>
      </motion.div>

      {/* Time Range Selector */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 flex-wrap">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => { setTimeRange(r); setPage(0) }}
              className={[
                'px-3 py-1 rounded-lg text-[10px] font-bold tracking-[0.08em] uppercase border transition-all',
                timeRange === r
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'text-on-surface-variant border-primary/[0.06] hover:text-primary',
              ].join(' ')}
            >
              {r}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Total Revenue', value: fmtSAR(kpiRevenue), change: '+18.2%', up: true, info: 'Gross revenue from all Salla orders in selected period', sub: 'March 2026' },
            { label: 'Orders', value: String(kpiOrders), change: '+12.4%', up: true, info: 'Total completed orders (excludes cancelled/refunded)', sub: 'March 2026' },
            { label: 'AOV', value: fmtSAR(kpiAOV), change: '+5.1%', up: true, info: 'Average Order Value. Higher AOV = more revenue per customer', sub: 'vs last month' },
            { label: 'Returning Customers', value: '34%', change: '+8.3%', up: true, info: 'Customers who have purchased more than once', sub: 'vs last month' },
            { label: 'Refund Rate', value: '3.1%', change: '-1.2%', up: true, info: 'Percentage of orders that were refunded. Target: <5%', sub: 'vs last month' },
          ].map((kpi) => (
            <div key={kpi.label} className="glass-card p-6">
              <div className="flex items-center gap-2">
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
                  {kpi.label}
                </div>
                <InfoIcon text={kpi.info} />
              </div>
              <div className="text-3xl font-black text-primary mt-3">{kpi.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[11px] font-bold ${kpi.up ? 'text-green-400' : 'text-red-400'}`}>
                  {kpi.up ? '↑' : '↓'} {kpi.change}
                </span>
                <span className="text-[11px] text-on-surface-variant">{kpi.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI Insights */}
      <motion.div variants={itemVariants} className="space-y-3">
        <AIInsightCard
          text="Cocoon Pillow drives 62% of revenue. Consider bundling it with the Desk Mat to increase AOV."
          action={{ label: 'View Products →', href: '/products' }}
        />
        <AIInsightCard
          text="Returning customers rate is 24% — above the 20% DTC benchmark. Your retention strategy is working."
        />
      </motion.div>

      {/* Revenue Trend Chart */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Revenue trend from Salla orders. Toggle comparison to see period-over-period performance.">
          Revenue Trend
        </SectionHeader>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
                Revenue Over Time
              </div>
              <div className="text-3xl font-black text-primary mt-1">{fmtSAR(kpiRevenue)} MTD</div>
            </div>
            <button
              onClick={() => setComparePrevious(!comparePrevious)}
              className={[
                'px-3 py-1 rounded-lg text-[10px] font-bold tracking-[0.08em] uppercase border transition-all',
                comparePrevious
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'text-on-surface-variant border-primary/[0.06] hover:text-primary',
              ].join(' ')}
            >
              Compare to Previous Period
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cacafe" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#cacafe" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#acaaae" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#acaaae" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(230,230,250,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#acaaae', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#acaaae', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <RechartsTooltip
                  contentStyle={tooltipStyle.contentStyle}
                  labelStyle={tooltipStyle.labelStyle}
                  cursor={tooltipStyle.cursor}
                  formatter={(value, name) => [
                    fmtSAR(Number(value)),
                    name === 'prevRevenue' ? 'Previous Period' : 'Revenue',
                  ]}
                />
                {comparePrevious && (
                  <Area
                    type="monotone"
                    dataKey="prevRevenue"
                    stroke="#acaaae"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fill="url(#prevGrad)"
                  />
                )}
                <Area type="monotone" dataKey="revenue" stroke="#cacafe" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Revenue by Product */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Top products by revenue. Click a product name to view its detail page.">
          Revenue by Product
        </SectionHeader>
        <div className="glass-card p-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={products} layout="vertical" margin={{ left: 140 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(230,230,250,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#acaaae', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#e6e6fa', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={135}
                />
                <RechartsTooltip
                  contentStyle={tooltipStyle.contentStyle}
                  labelStyle={tooltipStyle.labelStyle}
                  cursor={{ fill: 'rgba(230,230,250,0.03)' }}
                  formatter={(value) => [fmtSAR(Number(value)), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#cacafe" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {products.map((p) => (
              <button
                key={p.name}
                onClick={() => navigate('/products')}
                className="text-[10px] font-bold tracking-[0.08em] text-on-surface-variant hover:text-primary transition-all"
              >
                {p.name}: {fmtSAR(p.revenue)} ({p.pct}%)
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Revenue by Channel */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Revenue split by sales channel. B2B and wholesale channels will appear when active.">
          Revenue by Channel
        </SectionHeader>
        <div className="glass-card p-6">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: '100%',
                    background: '#cacafe',
                    boxShadow: '0 0 8px #cacafe50',
                  }}
                />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-bold text-primary">Salla Store</div>
              <div className="text-[11px] text-on-surface-variant">{fmtSAR(kpiRevenue)} · 100%</div>
            </div>
          </div>
          <div className="text-[11px] text-on-surface-variant mt-3">
            All revenue from Salla store. B2B and wholesale channels will appear here when active.
          </div>
        </div>
      </motion.div>

      {/* Sales Table */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Full order history with sortable columns, search, and CSV export.">
          Sales Data
        </SectionHeader>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search orders, customers, products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="w-full max-w-sm px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold hover:bg-primary/20 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/[0.06]">
                {[
                  { key: 'date' as SortKey, label: 'Date' },
                  { key: 'order' as SortKey, label: 'Order #' },
                  { key: 'customer' as SortKey, label: 'Customer' },
                  { key: 'product' as SortKey, label: 'Product' },
                  { key: 'qty' as SortKey, label: 'Qty' },
                  { key: 'amount' as SortKey, label: 'Amount (SAR)' },
                  { key: 'status' as SortKey, label: 'Status' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-5 py-3 cursor-pointer hover:text-primary transition-all select-none"
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="ml-1 text-primary">{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
                <th className="text-left text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-5 py-3">
                  Channel
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map((o) => (
                <tr
                  key={o.order}
                  className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all"
                >
                  <td className="px-5 py-3.5 text-sm text-on-surface font-mono text-[11px]">{o.date}</td>
                  <td className="px-5 py-3.5 font-mono text-[10px] text-on-surface-variant">{o.order}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => navigate('/customers')}
                      className="text-sm text-primary hover:underline transition-all"
                    >
                      {o.customer}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => navigate('/products')}
                      className="text-sm text-on-surface hover:text-primary transition-all"
                    >
                      {o.product}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-on-surface">{o.qty}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-primary">{fmtSAR(o.amount)}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border ${STATUS_CLASSES[o.status] ?? ''}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[11px] text-on-surface-variant">{o.channel}</td>
                </tr>
              ))}
              {pagedOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-on-surface-variant">
                    No orders match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-[11px] text-on-surface-variant">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredOrders.length)} of{' '}
            {filteredOrders.length} orders
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/[0.05] hover:text-primary transition-all disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <span className="text-[11px] text-on-surface-variant">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/[0.05] hover:text-primary transition-all disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
