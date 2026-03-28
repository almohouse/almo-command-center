import { useState, useMemo, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useAudioPlayer } from '@/data/audio-player'
import { useToast } from '@/data/toast'
import InfoIcon from '@/components/shared/InfoIcon'
import AIInsightCard from '@/components/shared/AIInsightCard'
import { api } from '@/lib/api'

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
// Category colors — DISTINCT, not all purple
// ---------------------------------------------------------------------------
const CATEGORY_COLORS: Record<string, string> = {
  COGS: '#4ade80',
  Marketing: '#60a5fa',
  Shipping: '#f59e0b',
  Subscriptions: '#a78bfa',
  Operations: '#f472b6',
  Other: '#94a3b8',
}

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  COGS: 'bg-green-500/10 text-green-400 border-green-500/20',
  Marketing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Shipping: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Subscriptions: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Operations: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Other: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

// ---------------------------------------------------------------------------
// Mock data — Donut segments
// ---------------------------------------------------------------------------
const EXPENSE_BREAKDOWN = [
  { name: 'COGS', value: 67200 },
  { name: 'Marketing', value: 18500 },
  { name: 'Shipping', value: 12800 },
  { name: 'Subscriptions', value: 4250 },
  { name: 'Operations', value: 8900 },
  { name: 'Other', value: 3400 },
]

const TOTAL_EXPENSES = EXPENSE_BREAKDOWN.reduce((s, e) => s + e.value, 0)

// ---------------------------------------------------------------------------
// Mock data — Monthly expense trend (stacked)
// ---------------------------------------------------------------------------
const EXPENSE_TREND = [
  { month: 'Oct', COGS: 58200, Marketing: 14200, Shipping: 9800, Subscriptions: 3800, Operations: 7200, Other: 2900 },
  { month: 'Nov', COGS: 61500, Marketing: 15600, Shipping: 10500, Subscriptions: 3900, Operations: 7800, Other: 3100 },
  { month: 'Dec', COGS: 72400, Marketing: 22000, Shipping: 14200, Subscriptions: 4000, Operations: 9200, Other: 3800 },
  { month: 'Jan', COGS: 55800, Marketing: 12800, Shipping: 8900, Subscriptions: 4050, Operations: 7100, Other: 2600 },
  { month: 'Feb', COGS: 63100, Marketing: 16400, Shipping: 11200, Subscriptions: 4150, Operations: 8300, Other: 3200 },
  { month: 'Mar', COGS: 67200, Marketing: 18500, Shipping: 12800, Subscriptions: 4250, Operations: 8900, Other: 3400 },
]

// ---------------------------------------------------------------------------
// Mock data — Subscription tracker
// ---------------------------------------------------------------------------
interface Subscription {
  service: string
  cost: number
  cycle: string
  nextPayment: string
  status: string
  category: string
}

const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  { service: 'Salla', cost: 299, cycle: 'Monthly', nextPayment: '2026-04-01', status: 'Active', category: 'Operations' },
  { service: 'Wix', cost: 89, cycle: 'Monthly', nextPayment: '2026-04-05', status: 'Active', category: 'Marketing' },
  { service: 'Zapier', cost: 189, cycle: 'Monthly', nextPayment: '2026-04-10', status: 'Active', category: 'Operations' },
  { service: 'ElevenLabs', cost: 185, cycle: 'Monthly', nextPayment: '2026-04-03', status: 'Active', category: 'Subscriptions' },
  { service: 'Airtable', cost: 75, cycle: 'Monthly', nextPayment: '2026-04-12', status: 'Active', category: 'Operations' },
  { service: 'ChatGPT Pro', cost: 75, cycle: 'Monthly', nextPayment: '2026-04-08', status: 'Active', category: 'Subscriptions' },
  { service: 'Gemini Pro', cost: 75, cycle: 'Monthly', nextPayment: '2026-04-15', status: 'Active', category: 'Subscriptions' },
  { service: 'Higgsfield', cost: 150, cycle: 'Monthly', nextPayment: '2026-04-07', status: 'Active', category: 'Subscriptions' },
  { service: 'Freepik', cost: 45, cycle: 'Monthly', nextPayment: '2026-04-20', status: 'Active', category: 'Marketing' },
  { service: 'n8n', cost: 75, cycle: 'Monthly', nextPayment: '2026-04-14', status: 'Active', category: 'Operations' },
  { service: 'Suno', cost: 30, cycle: 'Monthly', nextPayment: '2026-04-09', status: 'Active', category: 'Subscriptions' },
  { service: 'HeyGen', cost: 89, cycle: 'Monthly', nextPayment: '2026-04-11', status: 'Active', category: 'Subscriptions' },
  { service: 'GenSpark', cost: 60, cycle: 'Monthly', nextPayment: '2026-04-18', status: 'Active', category: 'Subscriptions' },
]

// ---------------------------------------------------------------------------
// Mock data — Expense table
// ---------------------------------------------------------------------------
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Credit Card', 'Tamara'] as const

interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  paymentMethod: string
  recurring: boolean
}

const MOCK_EXPENSES: Expense[] = [
  { id: 'EXP-001', date: '2026-03-27', category: 'COGS', description: 'ALMO Comfort Pillow — bulk fabric (300m)', amount: 18500, paymentMethod: 'Bank Transfer', recurring: false },
  { id: 'EXP-002', date: '2026-03-26', category: 'Shipping', description: 'SMSA Express — weekly shipment batch', amount: 3200, paymentMethod: 'Credit Card', recurring: true },
  { id: 'EXP-003', date: '2026-03-25', category: 'Marketing', description: 'Instagram Ads — March campaign', amount: 4500, paymentMethod: 'Credit Card', recurring: false },
  { id: 'EXP-004', date: '2026-03-25', category: 'COGS', description: 'Memory foam sheets — supplier invoice', amount: 12400, paymentMethod: 'Bank Transfer', recurring: false },
  { id: 'EXP-005', date: '2026-03-24', category: 'Operations', description: 'Warehouse rent — March', amount: 3500, paymentMethod: 'Bank Transfer', recurring: true },
  { id: 'EXP-006', date: '2026-03-24', category: 'Subscriptions', description: 'Salla monthly plan', amount: 299, paymentMethod: 'Credit Card', recurring: true },
  { id: 'EXP-007', date: '2026-03-23', category: 'COGS', description: 'Weighted blanket glass beads — 200kg', amount: 8900, paymentMethod: 'Bank Transfer', recurring: false },
  { id: 'EXP-008', date: '2026-03-23', category: 'Marketing', description: 'TikTok creator collaboration', amount: 2800, paymentMethod: 'Bank Transfer', recurring: false },
  { id: 'EXP-009', date: '2026-03-22', category: 'Shipping', description: 'Aramex — returns processing', amount: 1400, paymentMethod: 'Credit Card', recurring: false },
  { id: 'EXP-010', date: '2026-03-22', category: 'COGS', description: 'Packaging materials — branded boxes', amount: 5600, paymentMethod: 'Bank Transfer', recurring: false },
  { id: 'EXP-011', date: '2026-03-21', category: 'Operations', description: 'Office supplies + printer ink', amount: 450, paymentMethod: 'Cash', recurring: false },
  { id: 'EXP-012', date: '2026-03-21', category: 'Marketing', description: 'Google Ads — search campaign', amount: 3200, paymentMethod: 'Credit Card', recurring: false },
  { id: 'EXP-013', date: '2026-03-20', category: 'COGS', description: 'Cooling gel layer — supplier order', amount: 9800, paymentMethod: 'Bank Transfer', recurring: false },
  { id: 'EXP-014', date: '2026-03-20', category: 'Subscriptions', description: 'ElevenLabs Pro plan', amount: 185, paymentMethod: 'Credit Card', recurring: true },
  { id: 'EXP-015', date: '2026-03-19', category: 'Shipping', description: 'SMSA Express — mid-month batch', amount: 2900, paymentMethod: 'Credit Card', recurring: true },
  { id: 'EXP-016', date: '2026-03-19', category: 'Other', description: 'Legal consultation — trademark filing', amount: 1800, paymentMethod: 'Bank Transfer', recurring: false },
  { id: 'EXP-017', date: '2026-03-18', category: 'COGS', description: 'Bamboo fabric roll — 150m', amount: 7200, paymentMethod: 'Bank Transfer', recurring: false },
  { id: 'EXP-018', date: '2026-03-18', category: 'Marketing', description: 'Influencer gifting — 10 units', amount: 4500, paymentMethod: 'Bank Transfer', recurring: false },
  { id: 'EXP-019', date: '2026-03-17', category: 'Operations', description: 'Electricity + water — warehouse', amount: 1200, paymentMethod: 'Bank Transfer', recurring: true },
  { id: 'EXP-020', date: '2026-03-17', category: 'COGS', description: 'Zipper + thread inventory restock', amount: 2400, paymentMethod: 'Cash', recurring: false },
  { id: 'EXP-021', date: '2026-03-16', category: 'Other', description: 'Accounting software — annual', amount: 1200, paymentMethod: 'Credit Card', recurring: true },
  { id: 'EXP-022', date: '2026-03-16', category: 'Shipping', description: 'SPL — bulk rate March', amount: 3800, paymentMethod: 'Bank Transfer', recurring: false },
  { id: 'EXP-023', date: '2026-03-15', category: 'Marketing', description: 'Snapchat Ads — KSA targeting', amount: 3500, paymentMethod: 'Credit Card', recurring: false },
  { id: 'EXP-024', date: '2026-03-15', category: 'COGS', description: 'Latex foam blocks — topper line', amount: 11200, paymentMethod: 'Bank Transfer', recurring: false },
  { id: 'EXP-025', date: '2026-03-14', category: 'Subscriptions', description: 'Zapier — Team plan', amount: 189, paymentMethod: 'Credit Card', recurring: true },
  { id: 'EXP-026', date: '2026-03-14', category: 'Operations', description: 'Worker salaries — March', amount: 3750, paymentMethod: 'Bank Transfer', recurring: true },
  { id: 'EXP-027', date: '2026-03-13', category: 'Shipping', description: 'DHL — international sample shipments', amount: 1500, paymentMethod: 'Credit Card', recurring: false },
  { id: 'EXP-028', date: '2026-03-13', category: 'Other', description: 'Photography — product shoot', amount: 400, paymentMethod: 'Cash', recurring: false },
]

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
// Sort keys
// ---------------------------------------------------------------------------
const SORT_KEYS = ['date', 'category', 'description', 'amount', 'paymentMethod'] as const
type SortKey = (typeof SORT_KEYS)[number]

const CATEGORIES = ['All', 'COGS', 'Marketing', 'Shipping', 'Subscriptions', 'Operations', 'Other'] as const

// ---------------------------------------------------------------------------
// Expenses Page
// ---------------------------------------------------------------------------
export default function Expenses() {
  const audioPlayer = useAudioPlayer()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [_backendOffline, setBackendOffline] = useState(false)
  const [expensesData, setExpensesData] = useState<any>(null)
  const [audioGenerating, setAudioGenerating] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('30 Days')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortAsc, setSortAsc] = useState(false)
  const [page, setPage] = useState(0)
  const [filterCategory, setFilterCategory] = useState<string>('All')
  const [showAddForm, setShowAddForm] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS)
  const [editingSubIdx, setEditingSubIdx] = useState<number | null>(null)
  const [editingSubCost, setEditingSubCost] = useState('')
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({
    COGS: true, Marketing: true, Shipping: true, Subscriptions: true, Operations: true, Other: true,
  })
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES)

  // New expense form state
  const [newExpense, setNewExpense] = useState({
    date: '2026-03-28',
    category: 'COGS',
    description: '',
    amount: '',
    paymentMethod: 'Bank Transfer',
    recurring: false,
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.expenses.list()
        setExpensesData(data)
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
    if (expensesData) {
      const items = (expensesData as any)?.items ?? expensesData
      if (Array.isArray(items) && items.length > 0) {
        setExpenses(items)
      }
    }
  }, [expensesData])

  const PAGE_SIZE = 25

  // Revenue (mock) for expense ratio
  const totalRevenue = 153300

  // KPI values
  const totalExp = TOTAL_EXPENSES
  const cogsTotal = EXPENSE_BREAKDOWN.find((e) => e.name === 'COGS')!.value
  const opexTotal = totalExp - cogsTotal
  const expenseRatio = ((totalExp / totalRevenue) * 100).toFixed(1)
  const expenseRatioNum = parseFloat(expenseRatio)

  const ratioColorClass =
    expenseRatioNum < 60 ? 'text-green-400' : expenseRatioNum < 80 ? 'text-amber-400' : 'text-red-400'
  const ratioBorderClass =
    expenseRatioNum < 60
      ? 'border-green-500/20 shadow-[0_0_24px_rgba(74,222,128,0.06)]'
      : expenseRatioNum < 80
        ? 'border-amber-500/20 shadow-[0_0_24px_rgba(245,158,11,0.06)]'
        : 'border-red-500/20 shadow-[0_0_24px_rgba(255,110,132,0.06)]'

  // Sorted + filtered expenses
  const filteredExpenses = useMemo(() => {
    let list = [...expenses]
    if (filterCategory !== 'All') {
      list = list.filter((e) => e.category === filterCategory)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          e.id.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return list
  }, [expenses, search, sortKey, sortAsc, filterCategory])

  const pagedExpenses = filteredExpenses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE))

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
        body: JSON.stringify({ page: 'expenses' }),
      })
    } catch {
      /* dev: no backend */
    }
    setAudioGenerating(false)
    audioPlayer.play({
      title: 'Expenses Summary',
      subtitle: 'March 2026 · AI Generated',
      duration: '2:45',
    })
  }

  function handleExport() {
    const header = 'Date,Category,Description,Amount,Payment Method,Recurring'
    const rows = filteredExpenses.map(
      (e) => `${e.date},${e.category},"${e.description}",${e.amount},${e.paymentMethod},${e.recurring}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'almo-expenses-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleAddExpense() {
    if (!newExpense.description || !newExpense.amount) return
    const nextId = `EXP-${String(expenses.length + 1).padStart(3, '0')}`
    setExpenses([
      {
        id: nextId,
        date: newExpense.date,
        category: newExpense.category,
        description: newExpense.description,
        amount: Number(newExpense.amount),
        paymentMethod: newExpense.paymentMethod,
        recurring: newExpense.recurring,
      },
      ...expenses,
    ])
    try {
      await api.expenses.create({
        date: newExpense.date,
        category: newExpense.category,
        description: newExpense.description,
        amount: Number(newExpense.amount),
        paymentMethod: newExpense.paymentMethod,
        recurring: newExpense.recurring,
      })
    } catch { /* continue with local state */ }
    setNewExpense({ date: '2026-03-28', category: 'COGS', description: '', amount: '', paymentMethod: 'Bank Transfer', recurring: false })
    setShowAddForm(false)
    toast.show('Expense added successfully')
  }

  function handleDonutClick(categoryName: string) {
    setFilterCategory(categoryName)
    setPage(0)
  }

  function toggleLayer(key: string) {
    setVisibleLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSubEdit(idx: number) {
    setEditingSubIdx(idx)
    setEditingSubCost(String(subscriptions[idx].cost))
  }

  function handleSubSave(idx: number) {
    const cost = parseFloat(editingSubCost)
    if (isNaN(cost) || cost < 0) return
    setSubscriptions((prev) => prev.map((s, i) => (i === idx ? { ...s, cost } : s)))
    setEditingSubIdx(null)
    toast.show('Subscription cost updated')
  }

  const totalMonthlySubs = subscriptions.reduce((s, sub) => s + sub.cost, 0)

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
            <h1 className="text-4xl font-black text-primary text-glow">Expenses</h1>
            <p className="text-sm text-on-surface-variant mt-2">
              Track all business expenses — COGS, marketing, operations, subscriptions
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

      {/* Section 1: KPI Cards */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: 'Total Expenses',
              value: fmtSAR(totalExp),
              change: '+6.8%',
              up: false,
              info: 'All business expenses excluding agent/AI costs',
              sub: 'vs last month',
            },
            {
              label: 'COGS',
              value: fmtSAR(cogsTotal),
              change: '+4.2%',
              up: false,
              info: 'Direct product costs: unit price + freight + customs + packaging',
              sub: 'vs last month',
            },
            {
              label: 'Operating Expenses',
              value: fmtSAR(opexTotal),
              change: '+9.1%',
              up: false,
              info: 'Non-product costs: marketing, subscriptions, shipping, overhead',
              sub: 'vs last month',
            },
            {
              label: 'Expense Ratio',
              value: `${expenseRatio}%`,
              change: '-2.3%',
              up: true,
              info: 'What % of revenue goes to expenses. Lower = more efficient. Target: <70%',
              sub: 'vs last month',
              isRatio: true,
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className={[
                'glass-card p-6',
                'isRatio' in kpi && kpi.isRatio ? ratioBorderClass : '',
              ].join(' ')}
            >
              <div className="flex items-center gap-2">
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
                  {kpi.label}
                </div>
                <InfoIcon text={kpi.info} />
              </div>
              <div className={`text-3xl font-black mt-3 ${'isRatio' in kpi && kpi.isRatio ? ratioColorClass : 'text-primary'}`}>
                {kpi.value}
              </div>
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
      <motion.div variants={itemVariants}>
        <AIInsightCard
          text="Subscription costs total 847 SAR/month across 13 services. Review GenSpark and Higgsfield usage — they had the lowest activity last month."
        />
      </motion.div>

      {/* Section 2: Expense Breakdown Donut Chart */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Expense distribution by category. Click a segment to filter the expense table.">
          Expense Breakdown
        </SectionHeader>
        <div className="glass-card p-6">
          <div className="h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={EXPENSE_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  onClick={(_, idx) => handleDonutClick(EXPENSE_BREAKDOWN[idx].name)}
                  style={{ cursor: 'pointer' }}
                >
                  {EXPENSE_BREAKDOWN.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={tooltipStyle.contentStyle}
                  labelStyle={tooltipStyle.labelStyle}
                  formatter={(value, name) => [
                    `${fmtSAR(Number(value))} (${((Number(value) / TOTAL_EXPENSES) * 100).toFixed(1)}%)`,
                    String(name),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Total</div>
                <div className="text-2xl font-black text-primary">{fmtSAR(TOTAL_EXPENSES)}</div>
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {EXPENSE_BREAKDOWN.map((entry) => (
              <button
                key={entry.name}
                onClick={() => handleDonutClick(entry.name)}
                className="flex items-center gap-2 text-[11px] text-on-surface-variant hover:text-primary transition-all"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[entry.name] }}
                />
                {entry.name}: {fmtSAR(entry.value)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Section 3: Expense Trend (stacked area) */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Monthly expense composition over time. Toggle categories to isolate trends.">
          Expense Trend
        </SectionHeader>
        <div className="glass-card p-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={EXPENSE_TREND}>
                <defs>
                  {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
                    <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(230,230,250,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#acaaae', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#acaaae', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <RechartsTooltip
                  contentStyle={tooltipStyle.contentStyle}
                  labelStyle={tooltipStyle.labelStyle}
                  cursor={tooltipStyle.cursor}
                  formatter={(value, name) => [fmtSAR(Number(value)), String(name)]}
                />
                {Object.entries(CATEGORY_COLORS).map(([key, color]) =>
                  visibleLayers[key] ? (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stackId="1"
                      stroke={color}
                      strokeWidth={2}
                      fill={`url(#grad-${key})`}
                    />
                  ) : null
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend with toggles */}
          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
              <button
                key={key}
                onClick={() => toggleLayer(key)}
                className={[
                  'flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-bold tracking-[0.08em] uppercase border transition-all',
                  visibleLayers[key]
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'text-on-surface-variant border-primary/[0.06] hover:text-primary opacity-50',
                ].join(' ')}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color, opacity: visibleLayers[key] ? 1 : 0.3 }}
                />
                {key}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Section 4: Subscription Tracker */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Track all recurring subscriptions. Click pencil to update costs. Monthly total auto-calculates.">
          Subscription Tracker
        </SectionHeader>
        {/* Summary card */}
        <div className="glass-card p-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              Total Monthly Subscriptions
            </div>
            <InfoIcon text="Combined monthly cost of all active subscriptions." />
          </div>
          <div className="text-3xl font-black text-primary mt-3">{fmtSAR(totalMonthlySubs)}</div>
          <div className="text-[11px] text-on-surface-variant mt-1">{subscriptions.length} active services</div>
        </div>
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/[0.06]">
                {['Service', 'Cost/Month (SAR)', 'Billing Cycle', 'Next Payment', 'Status', 'Category', ''].map((h) => (
                  <th key={h} className="text-left text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub, idx) => (
                <tr key={sub.service} className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all">
                  <td className="px-5 py-3.5 text-sm font-bold text-primary">{sub.service}</td>
                  <td className="px-5 py-3.5">
                    {editingSubIdx === idx ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editingSubCost}
                          onChange={(e) => setEditingSubCost(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSubSave(idx)}
                          className="w-24 px-3 py-1.5 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSubSave(idx)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-green-400 hover:bg-green-500/10 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        </button>
                        <button
                          onClick={() => setEditingSubIdx(null)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-on-surface">{fmtSAR(sub.cost)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-on-surface">{sub.cycle}</td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-on-surface-variant">{sub.nextPayment}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border bg-green-500/10 text-green-400 border-green-500/20">
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border ${CATEGORY_BADGE_CLASSES[sub.category] ?? ''}`}>
                      {sub.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {editingSubIdx !== idx && (
                      <button
                        onClick={() => handleSubEdit(idx)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Section 5: Expense Table */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Full expense history with sortable columns, search, and CSV export.">
          Expense Data
        </SectionHeader>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="w-full max-w-sm px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all"
            />
          </div>
          {/* Category filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setFilterCategory(cat); setPage(0) }}
                className={[
                  'px-3 py-1 rounded-lg text-[10px] font-bold tracking-[0.08em] uppercase border transition-all',
                  filterCategory === cat
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'text-on-surface-variant border-primary/[0.06] hover:text-primary',
                ].join(' ')}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary font-semibold hover:bg-secondary/20 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Expense
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold hover:bg-primary/20 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>
        </div>

        {/* Inline add form */}
        {showAddForm && (
          <div className="glass-card p-4 mb-4">
            <div className="grid grid-cols-6 gap-3">
              <div>
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Date</div>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
                />
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Category</div>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Description</div>
                <input
                  type="text"
                  placeholder="What was this for?"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface placeholder:text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all"
                />
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Amount (SAR)</div>
                <input
                  type="number"
                  placeholder="0"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
                />
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Payment</div>
                <select
                  value={newExpense.paymentMethod}
                  onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newExpense.recurring}
                    onChange={(e) => setNewExpense({ ...newExpense, recurring: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-[11px] text-on-surface-variant">Recurring</span>
                </label>
                <button
                  onClick={handleAddExpense}
                  className="px-4 py-2 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold hover:bg-secondary/20 transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/[0.06]">
                {[
                  { key: 'date' as SortKey, label: 'Date' },
                  { key: 'category' as SortKey, label: 'Category' },
                  { key: 'description' as SortKey, label: 'Description' },
                  { key: 'amount' as SortKey, label: 'Amount (SAR)' },
                  { key: 'paymentMethod' as SortKey, label: 'Payment Method' },
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
                  Recurring
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedExpenses.map((e) => (
                <tr key={e.id} className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all">
                  <td className="px-5 py-3.5 font-mono text-[11px] text-on-surface-variant">{e.date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border ${CATEGORY_BADGE_CLASSES[e.category] ?? ''}`}>
                      {e.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-on-surface">{e.description}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-primary">{fmtSAR(e.amount)}</td>
                  <td className="px-5 py-3.5 text-[11px] text-on-surface-variant">{e.paymentMethod}</td>
                  <td className="px-5 py-3.5">
                    {e.recurring && (
                      <span className="text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border bg-secondary/10 text-secondary border-secondary/20">
                        Recurring
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {pagedExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-on-surface-variant">
                    No expenses match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-[11px] text-on-surface-variant">
            Showing {filteredExpenses.length === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredExpenses.length)} of{' '}
            {filteredExpenses.length} expenses
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
