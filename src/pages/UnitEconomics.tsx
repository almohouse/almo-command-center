import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  BarChart,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { useAudioPlayer } from '@/data/audio-player'
import { useToast } from '@/data/toast'
import InfoIcon from '@/components/shared/InfoIcon'

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
// Customer Economics data
// ---------------------------------------------------------------------------
const CUSTOMER_ECONOMICS = {
  totalMarketingSpend: 14500,
  newCustomers: 142,
  avgOrderValue: 168,
  purchaseFrequency: 1.8,
  avgCustomerLifespanMonths: 14,
  avgMarginPercent: 52,
}

const CAC = Math.round(CUSTOMER_ECONOMICS.totalMarketingSpend / CUSTOMER_ECONOMICS.newCustomers)
const LTV = Math.round(
  CUSTOMER_ECONOMICS.avgOrderValue *
  CUSTOMER_ECONOMICS.purchaseFrequency *
  (CUSTOMER_ECONOMICS.avgCustomerLifespanMonths / 12)
)
const LTV_CAC_RATIO = Number((LTV / CAC).toFixed(1))
const PAYBACK_MONTHS = Number(
  (CAC / (CUSTOMER_ECONOMICS.avgOrderValue * (CUSTOMER_ECONOMICS.avgMarginPercent / 100))).toFixed(1)
)

function ltvCacColor(ratio: number): { bg: string; text: string; label: string } {
  if (ratio >= 5) return { bg: 'bg-green-500/15', text: 'text-green-400', label: 'Excellent' }
  if (ratio >= 3) return { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Healthy' }
  if (ratio >= 1) return { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Building' }
  return { bg: 'bg-red-500/10', text: 'text-error', label: '⚠ Losing money' }
}

// ---------------------------------------------------------------------------
// Product unit economics data
// ---------------------------------------------------------------------------
interface ProductEcon {
  id: string
  name: string
  unitCost: number    // USD
  freight: number     // SAR per unit
  customs: number     // SAR per unit
  packaging: number   // SAR per unit
  sellingPrice: number // SAR
  unitsSold: number
}

const DEFAULT_PRODUCTS: ProductEcon[] = [
  { id: 'cocoon', name: 'Cocoon Pillow', unitCost: 28, freight: 8, customs: 5, packaging: 3, sellingPrice: 149, unitsSold: 340 },
  { id: 'blanket', name: 'Comfort Blanket', unitCost: 42, freight: 12, customs: 8, packaging: 4, sellingPrice: 249, unitsSold: 185 },
  { id: 'tray', name: 'Keyboard Tray', unitCost: 22, freight: 6, customs: 4, packaging: 3, sellingPrice: 129, unitsSold: 210 },
  { id: 'neck', name: 'Travel Neck Support', unitCost: 15, freight: 4, customs: 3, packaging: 2, sellingPrice: 89, unitsSold: 280 },
  { id: 'mat', name: 'Desk Mat', unitCost: 12, freight: 3, customs: 2, packaging: 2, sellingPrice: 79, unitsSold: 320 },
]

const USD_TO_SAR = 3.75

function calcLanded(p: ProductEcon) {
  return p.unitCost * USD_TO_SAR + p.freight + p.customs + p.packaging
}

function calcMargin(p: ProductEcon) {
  const landed = calcLanded(p)
  return p.sellingPrice - landed
}

function calcMarginPct(p: ProductEcon) {
  const margin = calcMargin(p)
  return (margin / p.sellingPrice) * 100
}

function marginColor(pct: number) {
  if (pct >= 50) return 'text-green-400'
  if (pct >= 30) return 'text-amber-400'
  return 'text-error'
}

// ---------------------------------------------------------------------------
// Break-even data
// ---------------------------------------------------------------------------
const FIXED_COSTS: Record<string, number> = {
  cocoon: 4200,
  blanket: 3800,
  tray: 3200,
  neck: 2800,
  mat: 2400,
}

// ---------------------------------------------------------------------------
// Waterfall bar shape
// ---------------------------------------------------------------------------
function WaterfallBar(props: Record<string, unknown>) {
  const { x, y, width, height, fill } = props as { x: number; y: number; width: number; height: number; fill: string }
  return <rect x={x} y={y} width={width} height={Math.max(height, 0)} fill={fill} rx={4} ry={4} />
}

// ---------------------------------------------------------------------------
// UnitEconomics Page
// ---------------------------------------------------------------------------
export default function UnitEconomics() {
  const audioPlayer = useAudioPlayer()
  const toast = useToast()

  const [audioGenerating, setAudioGenerating] = useState(false)
  const [products, setProducts] = useState<ProductEcon[]>(DEFAULT_PRODUCTS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editField, setEditField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(DEFAULT_PRODUCTS[0].id)
  const [breakEvenProduct, setBreakEvenProduct] = useState(DEFAULT_PRODUCTS[0].id)

  // Editable product fields
  function startEdit(productId: string, field: string, currentValue: number) {
    setEditingId(productId)
    setEditField(field)
    setEditValue(String(currentValue))
  }

  function saveEdit() {
    if (!editingId || !editField) return
    const val = Number(editValue)
    if (isNaN(val) || val < 0) return
    setProducts(prev => prev.map(p => {
      if (p.id !== editingId) return p
      return { ...p, [editField]: val }
    }))
    setEditingId(null)
    setEditField(null)
    toast.show('Value updated — margins recalculated', 'success')
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') { setEditingId(null); setEditField(null) }
  }

  // Waterfall data for selected product
  const waterfallData = useMemo(() => {
    const p = products.find(pr => pr.id === selectedProduct)
    if (!p) return []
    const unitCostSAR = p.unitCost * USD_TO_SAR
    const landed = calcLanded(p)
    const margin = p.sellingPrice - landed
    let running = p.sellingPrice

    const items: { name: string; value: number; start: number; fill: string }[] = [
      { name: 'Selling Price', value: p.sellingPrice, start: 0, fill: '#4ade80' },
    ]

    const costs: [string, number][] = [
      ['Unit Cost', unitCostSAR],
      ['Freight', p.freight],
      ['Customs', p.customs],
      ['Packaging', p.packaging],
    ]

    for (const [name, value] of costs) {
      items.push({ name, value, start: running - value, fill: '#ff6e84' })
      running -= value
    }

    items.push({
      name: 'Margin',
      value: margin,
      start: margin >= 0 ? 0 : Math.abs(margin),
      fill: margin >= 0 ? '#4ade80' : '#ff6e84',
    })
    return items
  }, [products, selectedProduct])

  // Break-even chart data
  const breakEvenData = useMemo(() => {
    const p = products.find(pr => pr.id === breakEvenProduct)
    if (!p) return []
    const fixed = FIXED_COSTS[breakEvenProduct] || 3000
    const marginPerUnit = calcMargin(p)
    const breakEvenUnits = marginPerUnit > 0 ? Math.ceil(fixed / marginPerUnit) : 999
    const maxUnits = Math.max(breakEvenUnits * 2, 50)

    const points: { units: number; revenue: number; cost: number }[] = []
    for (let u = 0; u <= maxUnits; u += Math.max(1, Math.floor(maxUnits / 20))) {
      points.push({
        units: u,
        revenue: u * p.sellingPrice,
        cost: fixed + u * calcLanded(p),
      })
    }
    return points
  }, [products, breakEvenProduct])

  const breakEvenP = products.find(p => p.id === breakEvenProduct)
  const breakEvenUnits = breakEvenP && calcMargin(breakEvenP) > 0
    ? Math.ceil((FIXED_COSTS[breakEvenProduct] || 3000) / calcMargin(breakEvenP))
    : 0

  // Summary row
  const totalUnitsSold = products.reduce((s, p) => s + p.unitsSold, 0)
  const totalContribution = products.reduce((s, p) => s + calcMargin(p) * p.unitsSold, 0)
  const weightedMargin = totalContribution / products.reduce((s, p) => s + p.sellingPrice * p.unitsSold, 0) * 100

  async function handleAudioSummary() {
    setAudioGenerating(true)
    try {
      await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'unit-economics' }),
      })
    } catch { /* dev: no backend */ }
    setAudioGenerating(false)
    audioPlayer.play({
      title: 'Unit Economics Summary',
      subtitle: 'March 2026 · AI Generated',
      duration: '2:45',
    })
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-16">

      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">Financials</div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-primary text-glow">Unit Economics</h1>
            <p className="text-sm text-on-surface-variant mt-2">Per-product and per-customer profitability — is growth actually profitable?</p>
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

      {/* Section 1: Customer Economics Cards */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Customer-level economics showing acquisition efficiency and lifetime value.">Customer Economics</SectionHeader>
        <div className="grid grid-cols-4 gap-4">
          {/* CAC */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">CAC</div>
              <InfoIcon text="Total marketing spend divided by new customers acquired. Lower = more efficient acquisition." />
            </div>
            <div className="text-3xl font-black text-primary mt-3">{fmtSAR(CAC)}</div>
            <div className="text-[11px] text-on-surface-variant mt-1">Customer Acquisition Cost</div>
          </div>

          {/* LTV */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">LTV</div>
              <InfoIcon text="Predicted total revenue from one customer over their lifetime. Rule of thumb: LTV should be ≥3× CAC." />
            </div>
            <div className="text-3xl font-black text-primary mt-3">{fmtSAR(LTV)}</div>
            <div className="text-[11px] text-on-surface-variant mt-1">Customer Lifetime Value</div>
          </div>

          {/* LTV:CAC Ratio */}
          {(() => {
            const style = ltvCacColor(LTV_CAC_RATIO)
            return (
              <div className={`glass-card p-6 ${style.bg}`}>
                <div className="flex items-center gap-2">
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">LTV:CAC Ratio</div>
                  <InfoIcon text="Lifetime value vs acquisition cost. <1 = losing money on each customer. 3+ = healthy." />
                </div>
                <div className={`text-3xl font-black mt-3 ${style.text}`}>{LTV_CAC_RATIO}×</div>
                <div className={`text-[11px] font-bold mt-1 ${style.text}`}>{style.label}</div>
              </div>
            )
          })()}

          {/* Payback Period */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Payback Period</div>
              <InfoIcon text="Months until a new customer's purchases cover their acquisition cost." />
            </div>
            <div className="text-3xl font-black text-primary mt-3">{PAYBACK_MONTHS} mo</div>
            <div className="text-[11px] text-on-surface-variant mt-1">To recover CAC</div>
          </div>
        </div>
      </motion.div>

      {/* Section 2: Product Unit Economics Table */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Per-product profitability with editable cost fields. Changes auto-recalculate margins.">
          Product Unit Economics
        </SectionHeader>
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/[0.06]">
                {['Product', 'Unit Cost (USD)', 'Landed Cost (SAR)', 'Selling Price (SAR)', 'Gross Margin (SAR)', 'Gross Margin (%)', 'Units Sold', 'Total Contribution'].map(col => (
                  <th key={col} className="text-left text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-4 py-3">
                    <div className="flex items-center gap-1">
                      {col}
                      {col === 'Landed Cost (SAR)' && (
                        <InfoIcon text="Unit cost + freight share + customs duty + packaging. This is what each unit truly costs you in the warehouse." />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const landed = calcLanded(p)
                const margin = calcMargin(p)
                const marginPct = calcMarginPct(p)
                const contribution = margin * p.unitsSold

                return (
                  <tr key={p.id} className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all">
                    <td className="px-4 py-3.5 text-sm font-semibold text-on-surface">{p.name}</td>

                    {/* Unit Cost — editable */}
                    <td className="px-4 py-3.5">
                      {editingId === p.id && editField === 'unitCost' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleEditKeyDown}
                          autoFocus
                          className="w-20 px-2 py-1 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono text-on-surface">${p.unitCost}</span>
                          <button
                            onClick={() => startEdit(p.id, 'unitCost', p.unitCost)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
                            style={{ opacity: 0.4 }}
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Landed Cost — auto-calculated */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-mono text-on-surface-variant">{fmtSAR(Math.round(landed))}</span>
                      <div className="text-[10px] text-on-surface-variant">auto-calculated</div>
                    </td>

                    {/* Selling Price — editable */}
                    <td className="px-4 py-3.5">
                      {editingId === p.id && editField === 'sellingPrice' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleEditKeyDown}
                          autoFocus
                          className="w-20 px-2 py-1 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono text-on-surface">{fmtSAR(p.sellingPrice)}</span>
                          <button
                            onClick={() => startEdit(p.id, 'sellingPrice', p.sellingPrice)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                            style={{ opacity: 0.4 }}
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Gross Margin SAR */}
                    <td className={`px-4 py-3.5 text-sm font-mono font-bold ${margin >= 0 ? 'text-green-400' : 'text-error'}`}>
                      {fmtSAR(Math.round(margin))}
                    </td>

                    {/* Gross Margin % */}
                    <td className="px-4 py-3.5">
                      <span className={`text-sm font-mono font-bold ${marginColor(marginPct)}`}>
                        {marginPct.toFixed(1)}%
                      </span>
                    </td>

                    {/* Units Sold */}
                    <td className="px-4 py-3.5 text-sm font-mono text-on-surface">{p.unitsSold.toLocaleString()}</td>

                    {/* Total Contribution */}
                    <td className={`px-4 py-3.5 text-sm font-mono font-bold ${contribution >= 0 ? 'text-green-400' : 'text-error'}`}>
                      {fmtSAR(Math.round(contribution))}
                    </td>
                  </tr>
                )
              })}

              {/* Summary row */}
              <tr className="border-t-2 border-primary/[0.12] bg-primary/[0.04]">
                <td className="px-4 py-4 text-sm font-bold text-primary uppercase tracking-[0.1em]">Total / Weighted Avg</td>
                <td className="px-4 py-4" />
                <td className="px-4 py-4" />
                <td className="px-4 py-4" />
                <td className="px-4 py-4" />
                <td className="px-4 py-4">
                  <span className={`text-sm font-mono font-bold ${marginColor(weightedMargin)}`}>
                    {weightedMargin.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-mono font-bold text-primary">{totalUnitsSold.toLocaleString()}</td>
                <td className="px-4 py-4 text-sm font-mono font-bold text-green-400">{fmtSAR(Math.round(totalContribution))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Section 3: Contribution Margin Waterfall */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Shows exactly where money goes for each unit sold. The final bar is what you keep.">
          Contribution Margin Waterfall
        </SectionHeader>
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Product</div>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="h-72">
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
                  tickFormatter={(v: number) => `${v} SAR`}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const item = payload[0]?.payload as { name: string; value: number }
                    return (
                      <div style={{ ...tooltipStyle.contentStyle }}>
                        <div style={{ color: '#acaaae', marginBottom: 2, fontSize: 11 }}>{item.name}</div>
                        <div style={{ color: '#e6e6fa', fontWeight: 700, fontSize: 12 }}>{fmtSAR(item.value)}</div>
                      </div>
                    )
                  }}
                />
                <ReferenceLine y={0} stroke="rgba(230,230,250,0.1)" />
                <Bar dataKey="start" stackId="waterfall" fill="transparent" shape={<></>} />
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

      {/* Section 4: Break-Even Analysis */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Break-even is the minimum units you must sell per month to cover costs. Below this = losing money on this product.">
          Break-Even Analysis
        </SectionHeader>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Product</div>
              <select
                value={breakEvenProduct}
                onChange={e => setBreakEvenProduct(e.target.value)}
                className="px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {breakEvenP && (
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-[10px] text-on-surface-variant uppercase tracking-[0.1em]">Fixed Costs</div>
                  <div className="text-sm font-bold text-primary">{fmtSAR(FIXED_COSTS[breakEvenProduct] || 3000)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-on-surface-variant uppercase tracking-[0.1em]">Margin/Unit</div>
                  <div className="text-sm font-bold text-green-400">{fmtSAR(Math.round(calcMargin(breakEvenP)))}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-on-surface-variant uppercase tracking-[0.1em]">Break-Even</div>
                  <div className="text-sm font-bold text-secondary">{breakEvenUnits} units</div>
                </div>
              </div>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={breakEvenData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(230,230,250,0.04)" vertical={false} />
                <XAxis
                  dataKey="units"
                  tick={{ fill: '#acaaae', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(230,230,250,0.06)' }}
                  tickLine={false}
                  label={{ value: 'Units', position: 'insideBottom', offset: -2, fill: '#acaaae', fontSize: 10 }}
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
                    return (
                      <div style={{ ...tooltipStyle.contentStyle }}>
                        <div style={{ color: '#acaaae', marginBottom: 4, fontSize: 11 }}>{label} units</div>
                        {payload.map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                            <span style={{ color: String(p.color), fontSize: 11 }}>{p.name}</span>
                            <span style={{ color: '#e6e6fa', fontWeight: 700, fontSize: 11 }}>{fmtSAR(Number(p.value))}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                  cursor={{ stroke: 'rgba(230,230,250,0.1)', strokeWidth: 1 }}
                />
                {breakEvenUnits > 0 && (
                  <ReferenceLine
                    x={breakEvenUnits}
                    stroke="#cacafe"
                    strokeDasharray="6 4"
                    label={{ value: `BE: ${breakEvenUnits}`, position: 'top', fill: '#cacafe', fontSize: 10 }}
                  />
                )}
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#4ade80" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cost" name="Total Cost" stroke="#ff6e84" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

    </motion.div>
  )
}
