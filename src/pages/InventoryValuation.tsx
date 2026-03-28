import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Treemap,
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
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
function fmtSAR(n: number) {
  return n.toLocaleString('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 })
}

const USD_TO_SAR = 3.75

// ---------------------------------------------------------------------------
// Product inventory data
// ---------------------------------------------------------------------------
interface ProductInventory {
  id: string
  name: string
  unitsOnHand: number
  landedCostPerUnit: number
  daysOnHand: number
}

const PRODUCTS: ProductInventory[] = [
  { id: 'cocoon', name: 'Cocoon Pillow', unitsOnHand: 620, landedCostPerUnit: 121, daysOnHand: 42 },
  { id: 'blanket', name: 'Comfort Blanket', unitsOnHand: 340, landedCostPerUnit: 182, daysOnHand: 65 },
  { id: 'tray', name: 'Keyboard Tray', unitsOnHand: 480, landedCostPerUnit: 95, daysOnHand: 28 },
  { id: 'neck', name: 'Travel Neck Support', unitsOnHand: 750, landedCostPerUnit: 63, daysOnHand: 18 },
  { id: 'mat', name: 'Desk Mat', unitsOnHand: 890, landedCostPerUnit: 51, daysOnHand: 35 },
]

// ---------------------------------------------------------------------------
// Batch cost tracker data
// ---------------------------------------------------------------------------
interface Batch {
  id: string
  batchNo: string
  product: string
  units: number
  unitCostUSD: number
  freight: number
  customs: number
  packaging: number
  status: 'in-transit' | 'in-warehouse' | 'sold-out' | 'partially-sold'
  arrivalDate: string
  soldPct: number
}

const DEFAULT_BATCHES: Batch[] = [
  { id: '1', batchNo: 'B-2026-012', product: 'Cocoon Pillow', units: 500, unitCostUSD: 28, freight: 4200, customs: 2600, packaging: 1500, status: 'in-warehouse', arrivalDate: '2026-02-18', soldPct: 38 },
  { id: '2', batchNo: 'B-2026-013', product: 'Comfort Blanket', units: 300, unitCostUSD: 42, freight: 3800, customs: 2400, packaging: 1200, status: 'in-warehouse', arrivalDate: '2026-02-25', soldPct: 22 },
  { id: '3', batchNo: 'B-2026-014', product: 'Keyboard Tray', units: 400, unitCostUSD: 22, freight: 2800, customs: 1600, packaging: 1200, status: 'partially-sold', arrivalDate: '2026-01-15', soldPct: 55 },
  { id: '4', batchNo: 'B-2026-015', product: 'Travel Neck Support', units: 800, unitCostUSD: 15, freight: 3200, customs: 2000, packaging: 1600, status: 'partially-sold', arrivalDate: '2026-01-08', soldPct: 68 },
  { id: '5', batchNo: 'B-2026-016', product: 'Desk Mat', units: 1000, unitCostUSD: 12, freight: 2400, customs: 1800, packaging: 2000, status: 'partially-sold', arrivalDate: '2026-02-01', soldPct: 45 },
  { id: '6', batchNo: 'B-2026-017', product: 'Cocoon Pillow', units: 600, unitCostUSD: 27, freight: 4800, customs: 2800, packaging: 1800, status: 'in-transit', arrivalDate: '2026-04-08', soldPct: 0 },
  { id: '7', batchNo: 'B-2025-098', product: 'Comfort Blanket', units: 250, unitCostUSD: 44, freight: 3400, customs: 2200, packaging: 1000, status: 'sold-out', arrivalDate: '2025-11-20', soldPct: 100 },
]

function calcBatchLanded(b: Batch) {
  const productCost = b.unitCostUSD * USD_TO_SAR * b.units
  const total = productCost + b.freight + b.customs + b.packaging
  return total / b.units
}

function calcBatchTotal(b: Batch) {
  return calcBatchLanded(b) * b.units
}

const STATUS_STYLES: Record<string, string> = {
  'in-transit': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'in-warehouse': 'bg-green-500/10 text-green-400 border-green-500/20',
  'sold-out': 'bg-surface-container-highest text-on-surface-variant border-primary/[0.06]',
  'partially-sold': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  'in-transit': 'In Transit',
  'in-warehouse': 'In Warehouse',
  'sold-out': 'Sold Out',
  'partially-sold': 'Partially Sold',
}

// ---------------------------------------------------------------------------
// COGS breakdown data (monthly)
// ---------------------------------------------------------------------------
const COGS_DATA = [
  { month: "Oct '25", productCost: 26800, freight: 6400, customs: 2400, packaging: 2400 },
  { month: "Nov '25", productCost: 29500, freight: 7200, customs: 2800, packaging: 2800 },
  { month: "Dec '25", productCost: 41200, freight: 10200, customs: 3800, packaging: 3800 },
  { month: "Jan '26", productCost: 32400, freight: 8200, customs: 3100, packaging: 3100 },
  { month: "Feb '26", productCost: 38600, freight: 9500, customs: 3600, packaging: 3600 },
  { month: "Mar '26", productCost: 45200, freight: 11800, customs: 4200, packaging: 4200 },
]

// ---------------------------------------------------------------------------
// Inventory aging data
// ---------------------------------------------------------------------------
interface AgingItem {
  product: string
  units: number
  daysInStock: number
  value: number
  risk: 'fresh' | 'aging' | 'stale'
}

// agingData is now derived inside the component from `products`

const RISK_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  fresh: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Fresh' },
  aging: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Aging' },
  stale: { bg: 'bg-red-500/10', text: 'text-error', label: 'Stale' },
}

// ---------------------------------------------------------------------------
// InventoryValuation Page
// ---------------------------------------------------------------------------
export default function InventoryValuation() {
  const audioPlayer = useAudioPlayer()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [_backendOffline, setBackendOffline] = useState(false)
  const [valuationData, setValuationData] = useState<any>(null)
  const [batchesData, setBatchesData] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [valuation, batchesResp] = await Promise.all([
          api.inventory.valuation(),
          api.inventory.batches(),
        ])
        setValuationData(valuation)
        setBatchesData(batchesResp)
        setBackendOffline(false)
      } catch {
        setBackendOffline(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const products: ProductInventory[] = (valuationData as any)?.products ?? (valuationData as any)?.items ?? PRODUCTS

  const [audioGenerating, setAudioGenerating] = useState(false)
  const [batches, setBatches] = useState<Batch[]>(DEFAULT_BATCHES)
  const [showAddBatch, setShowAddBatch] = useState(false)
  const [editingBatch, setEditingBatch] = useState<{ id: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newBatch, setNewBatch] = useState({
    product: 'Cocoon Pillow',
    units: '',
    unitCostUSD: '',
    freight: '',
    customs: '',
    packaging: '',
    arrivalDate: '',
  })

  useEffect(() => {
    if (batchesData) {
      const items = (batchesData as any)?.items ?? batchesData
      if (Array.isArray(items) && items.length > 0) {
        setBatches(items)
      }
    }
  }, [batchesData])

  // KPI calculations
  const totalStockValue = products.reduce((s, p) => s + p.unitsOnHand * p.landedCostPerUnit, 0)
  const totalUnits = products.reduce((s, p) => s + p.unitsOnHand, 0)
  const avgLandedCost = totalStockValue / totalUnits
  // Inventory turnover = COGS last month / avg inventory value (annualized)
  const lastMonthCOGS = 45200 + 11800 + 4200 + 4200 // Mar 2026
  const inventoryTurnover = Number(((lastMonthCOGS * 12) / totalStockValue).toFixed(1))

  // Treemap data
  // Aging data derived from products
  const agingData: AgingItem[] = products.map(p => ({
    product: p.name,
    units: p.unitsOnHand,
    daysInStock: p.daysOnHand,
    value: p.unitsOnHand * p.landedCostPerUnit,
    risk: p.daysOnHand < 30 ? 'fresh' as const : p.daysOnHand < 90 ? 'aging' as const : 'stale' as const,
  }))

  const treemapData = products.map(p => ({
    name: p.name,
    size: p.unitsOnHand * p.landedCostPerUnit,
    units: p.unitsOnHand,
    days: p.daysOnHand,
    landedCost: p.landedCostPerUnit,
  }))

  // Edit batch field
  function startBatchEdit(batchId: string, field: string, currentValue: number) {
    setEditingBatch({ id: batchId, field })
    setEditValue(String(currentValue))
  }

  function saveBatchEdit() {
    if (!editingBatch) return
    const val = Number(editValue)
    if (isNaN(val) || val < 0) return
    setBatches(prev => prev.map(b =>
      b.id === editingBatch.id ? { ...b, [editingBatch.field]: val } : b
    ))
    setEditingBatch(null)
    toast.show('Batch cost updated — landed cost recalculated', 'success')
  }

  function handleBatchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveBatchEdit()
    if (e.key === 'Escape') setEditingBatch(null)
  }

  function addBatch() {
    if (!newBatch.units || !newBatch.unitCostUSD || !newBatch.arrivalDate) return
    const batch: Batch = {
      id: String(Date.now()),
      batchNo: `B-2026-${String(batches.length + 18).padStart(3, '0')}`,
      product: newBatch.product,
      units: Number(newBatch.units),
      unitCostUSD: Number(newBatch.unitCostUSD),
      freight: Number(newBatch.freight) || 0,
      customs: Number(newBatch.customs) || 0,
      packaging: Number(newBatch.packaging) || 0,
      status: 'in-transit',
      arrivalDate: newBatch.arrivalDate,
      soldPct: 0,
    }
    setBatches(prev => [...prev, batch])
    setNewBatch({ product: 'Cocoon Pillow', units: '', unitCostUSD: '', freight: '', customs: '', packaging: '', arrivalDate: '' })
    setShowAddBatch(false)
    toast.show('Batch added', 'success')
  }

  async function handleAudioSummary() {
    setAudioGenerating(true)
    try {
      await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'inventory-valuation' }),
      })
    } catch { /* dev: no backend */ }
    setAudioGenerating(false)
    audioPlayer.play({
      title: 'Inventory Valuation Summary',
      subtitle: 'March 2026 · AI Generated',
      duration: '2:30',
    })
  }

  // Treemap custom content
  function TreemapContent(props: Record<string, unknown>) {
    const { x, y, width, height, name, days } = props as {
      x: number; y: number; width: number; height: number; name: string; days: number
    }
    if (width < 60 || height < 40) return null
    // Darker = more days on hand
    const opacity = Math.min(0.3 + (days / 100) * 0.5, 0.8)
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} rx={8}
          fill={`rgba(202, 202, 254, ${opacity})`}
          stroke="rgba(230,230,250,0.08)" strokeWidth={1}
        />
        <text x={x + 8} y={y + 18} fill="#e6e6fa" fontSize={11} fontWeight={700}>{name}</text>
        {height > 50 && (
          <text x={x + 8} y={y + 34} fill="#acaaae" fontSize={10}>{days}d on hand</text>
        )}
      </g>
    )
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
            <h1 className="text-4xl font-black text-primary text-glow">Inventory Valuation</h1>
            <p className="text-sm text-on-surface-variant mt-2">Financial view of inventory — stock value, COGS impact, batch cost tracking</p>
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

      {/* Section 1: Inventory Value Summary Cards */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Financial snapshot of all inventory at cost.">Inventory Summary</SectionHeader>
        <div className="grid grid-cols-4 gap-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Total Stock Value</div>
              <InfoIcon text="Current value of all inventory at cost. This is money tied up in stock." />
            </div>
            <div className="text-3xl font-black text-primary mt-3">{fmtSAR(totalStockValue)}</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Units in Stock</div>
              <InfoIcon text="Total physical units in warehouse and in transit." />
            </div>
            <div className="text-3xl font-black text-primary mt-3">{totalUnits.toLocaleString()}</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Avg Landed Cost</div>
              <InfoIcon text="Average cost per unit including freight, customs, packaging." />
            </div>
            <div className="text-3xl font-black text-primary mt-3">{fmtSAR(Math.round(avgLandedCost))}</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Inventory Turnover</div>
              <InfoIcon text="How many times inventory sells through per period. Higher = more efficient. Target for DTC: 4-6×/year." />
            </div>
            <div className={`text-3xl font-black mt-3 ${inventoryTurnover >= 4 ? 'text-green-400' : inventoryTurnover >= 2 ? 'text-amber-400' : 'text-error'}`}>
              {inventoryTurnover}×
            </div>
            <div className="text-[11px] text-on-surface-variant mt-1">annualized</div>
          </div>
        </div>
      </motion.div>

      {/* Section 2: Stock Value Treemap */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Larger rectangles = more money tied up. Darker color = inventory sitting longer. Monitor dark large rectangles.">
          Stock Value by Product
        </SectionHeader>
        <div className="glass-card p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="size"
                stroke="rgba(230,230,250,0.08)"
                content={<TreemapContent />}
              >
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0]?.payload as { name: string; size: number; units: number; days: number; landedCost: number }
                    if (!d) return null
                    return (
                      <div style={{ ...tooltipStyle.contentStyle }}>
                        <div style={{ color: '#e6e6fa', fontWeight: 700, marginBottom: 4, fontSize: 12 }}>{d.name}</div>
                        <div style={{ color: '#acaaae', fontSize: 11 }}>Value: {fmtSAR(d.size)}</div>
                        <div style={{ color: '#acaaae', fontSize: 11 }}>Units: {d.units}</div>
                        <div style={{ color: '#acaaae', fontSize: 11 }}>Days on hand: {d.days}</div>
                        <div style={{ color: '#acaaae', fontSize: 11 }}>Landed cost: {fmtSAR(d.landedCost)}/unit</div>
                      </div>
                    )
                  }}
                />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Section 3: Batch Cost Tracker Table */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Track cost components per batch. Edit fields to see updated landed cost.">
          Batch Cost Tracker
        </SectionHeader>
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/[0.06]">
                {['Batch #', 'Product', 'Units', 'Unit Cost (USD)', 'Freight', 'Customs', 'Packaging', 'Landed/Unit (SAR)', 'Total Value', 'Status', 'Arrival'].map(col => (
                  <th key={col} className="text-left text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-3 py-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.map(b => {
                const landed = calcBatchLanded(b)
                const total = calcBatchTotal(b)

                function renderEditable(field: string, value: number, prefix = '') {
                  if (editingBatch?.id === b.id && editingBatch.field === field) {
                    return (
                      <input
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={saveBatchEdit}
                        onKeyDown={handleBatchKeyDown}
                        autoFocus
                        className="w-16 px-1.5 py-0.5 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none"
                      />
                    )
                  }
                  return (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono text-on-surface">{prefix}{value.toLocaleString()}</span>
                      <button
                        onClick={() => startBatchEdit(b.id, field, value)}
                        className="w-5 h-5 flex items-center justify-center rounded text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                        style={{ opacity: 0.3 }}
                      >
                        <span className="material-symbols-outlined text-[12px]">edit</span>
                      </button>
                    </div>
                  )
                }

                return (
                  <tr key={b.id} className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all">
                    <td className="px-3 py-3 font-mono text-[10px] text-on-surface-variant">{b.batchNo}</td>
                    <td className="px-3 py-3 text-xs font-semibold text-on-surface">{b.product}</td>
                    <td className="px-3 py-3 text-xs font-mono text-on-surface">{b.units}</td>
                    <td className="px-3 py-3">{renderEditable('unitCostUSD', b.unitCostUSD, '$')}</td>
                    <td className="px-3 py-3">{renderEditable('freight', b.freight)}</td>
                    <td className="px-3 py-3">{renderEditable('customs', b.customs)}</td>
                    <td className="px-3 py-3">{renderEditable('packaging', b.packaging)}</td>
                    <td className="px-3 py-3 text-xs font-mono font-bold text-primary">{fmtSAR(Math.round(landed))}</td>
                    <td className="px-3 py-3 text-xs font-mono text-on-surface">{fmtSAR(Math.round(total))}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLES[b.status]}`}>
                          {STATUS_LABELS[b.status]}
                        </span>
                        {b.soldPct > 0 && b.soldPct < 100 && (
                          <span className="text-[10px] text-on-surface-variant">{b.soldPct}% sold</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[10px] font-mono text-on-surface-variant">
                      {new Date(b.arrivalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Add Batch */}
        <div className="mt-4">
          {!showAddBatch ? (
            <button
              onClick={() => setShowAddBatch(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary font-semibold hover:bg-secondary/20 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add Batch
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card p-5"
              >
                <div className="grid grid-cols-7 gap-3">
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Product</div>
                    <select
                      value={newBatch.product}
                      onChange={e => setNewBatch(p => ({ ...p, product: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
                    >
                      {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Units</div>
                    <input type="number" value={newBatch.units} onChange={e => setNewBatch(p => ({ ...p, units: e.target.value }))} placeholder="0"
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Unit Cost (USD)</div>
                    <input type="number" value={newBatch.unitCostUSD} onChange={e => setNewBatch(p => ({ ...p, unitCostUSD: e.target.value }))} placeholder="0"
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Freight (SAR)</div>
                    <input type="number" value={newBatch.freight} onChange={e => setNewBatch(p => ({ ...p, freight: e.target.value }))} placeholder="0"
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Customs (SAR)</div>
                    <input type="number" value={newBatch.customs} onChange={e => setNewBatch(p => ({ ...p, customs: e.target.value }))} placeholder="0"
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Packaging (SAR)</div>
                    <input type="number" value={newBatch.packaging} onChange={e => setNewBatch(p => ({ ...p, packaging: e.target.value }))} placeholder="0"
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Arrival</div>
                    <input type="date" value={newBatch.arrivalDate} onChange={e => setNewBatch(p => ({ ...p, arrivalDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={addBatch} className="px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold hover:bg-primary/20 transition-all">
                    Add Batch
                  </button>
                  <button onClick={() => setShowAddBatch(false)} className="px-4 py-2 rounded-xl text-on-surface-variant hover:text-primary transition-all">
                    Cancel
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Section 4: COGS Breakdown */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Breaking COGS into components helps identify which cost is rising and where to negotiate.">
          COGS Breakdown
        </SectionHeader>
        <div className="glass-card p-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={COGS_DATA} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
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
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
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
                            <span style={{ color: '#e6e6fa', fontWeight: 700, fontSize: 11 }}>{fmtSAR(Number(p.value))}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                  cursor={{ stroke: 'rgba(230,230,250,0.1)', strokeWidth: 1 }}
                />
                <Bar dataKey="productCost" name="Product Cost" stackId="cogs" fill="#cacafe" radius={[0, 0, 0, 0]} />
                <Bar dataKey="freight" name="Freight" stackId="cogs" fill="#fbbf24" />
                <Bar dataKey="customs" name="Customs/Duty" stackId="cogs" fill="#ff6e84" />
                <Bar dataKey="packaging" name="Packaging" stackId="cogs" fill="#4ade80" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Section 5: Inventory Aging Report */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Tracks how long inventory has been sitting. Stale inventory (>90 days) ties up cash and risks obsolescence.">
          Inventory Aging Report
        </SectionHeader>
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/[0.06]">
                {['Product', 'Units', 'Days in Stock', 'Value', 'Risk Level'].map(col => (
                  <th key={col} className="text-left text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-5 py-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agingData.map(item => {
                const riskStyle = RISK_STYLES[item.risk]
                return (
                  <tr
                    key={item.product}
                    className={`border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all ${item.risk === 'stale' ? 'bg-error/[0.03]' : ''}`}
                  >
                    <td className="px-5 py-3.5 text-sm font-semibold text-on-surface">{item.product}</td>
                    <td className="px-5 py-3.5 text-sm font-mono text-on-surface">{item.units.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm font-mono text-on-surface">{item.daysInStock}</td>
                    <td className="px-5 py-3.5 text-sm font-mono text-on-surface">{fmtSAR(item.value)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border ${riskStyle.bg} ${riskStyle.text} border-current/20`}>
                        {riskStyle.label} (&lt;{item.risk === 'fresh' ? '30' : item.risk === 'aging' ? '90' : '90+'}d)
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

    </motion.div>
  )
}
