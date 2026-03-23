import { useState } from 'react'
import { ShoppingCart, TrendingUp, Star, DollarSign, AlertTriangle, Package, PlusCircle, Truck, ClipboardList, RefreshCw, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SectionHeader } from '@/components/cards/SectionHeader'
import { MetricCard } from '@/components/cards/MetricCard'
import { MiniAreaChart } from '@/components/charts/MiniAreaChart'
import { SparkLine } from '@/components/charts/SparkLine'
import { RadialGauge } from '@/components/charts/RadialGauge'
import { mockBusiness } from '@/api/mock'
import { formatCurrency, formatPercent, formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { businessInputsApi, type BusinessInputs } from '@/api/paperclip'

const EXPENSE_CATEGORIES = ['General', 'Marketing', 'Operations', 'Logistics', 'Technology', 'Salary', 'Other']
const SHIPMENT_STATUSES = ['pending', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'delayed']

function BusinessInputsPanel() {
  const qc = useQueryClient()
  const [activeForm, setActiveForm] = useState<'expense' | 'shipment' | 'inventory' | null>(null)

  // Expense form state
  const [expDesc, setExpDesc] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expCategory, setExpCategory] = useState('General')
  const [expDate, setExpDate] = useState('')

  // Shipment form state
  const [shpOrderId, setShpOrderId] = useState('')
  const [shpCarrier, setShpCarrier] = useState('')
  const [shpStatus, setShpStatus] = useState('in_transit')
  const [shpEta, setShpEta] = useState('')
  const [shpNotes, setShpNotes] = useState('')

  // Inventory form state
  const [invSku, setInvSku] = useState('')
  const [invProduct, setInvProduct] = useState('')
  const [invChange, setInvChange] = useState('')
  const [invReason, setInvReason] = useState('')

  const { data: inputs, isLoading } = useQuery<BusinessInputs>({
    queryKey: ['business-inputs'],
    queryFn: () => businessInputsApi.getAll(),
  })

  const expenseMutation = useMutation({
    mutationFn: businessInputsApi.addExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-inputs'] })
      setExpDesc(''); setExpAmount(''); setExpCategory('General'); setExpDate('')
      setActiveForm(null)
    },
  })

  const shipmentMutation = useMutation({
    mutationFn: businessInputsApi.addShipment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-inputs'] })
      setShpOrderId(''); setShpCarrier(''); setShpStatus('in_transit'); setShpEta(''); setShpNotes('')
      setActiveForm(null)
    },
  })

  const inventoryMutation = useMutation({
    mutationFn: businessInputsApi.addInventory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-inputs'] })
      setInvSku(''); setInvProduct(''); setInvChange(''); setInvReason('')
      setActiveForm(null)
    },
  })

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveForm(activeForm === 'expense' ? null : 'expense')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
            activeForm === 'expense'
              ? 'bg-accent-red/10 text-accent-red border-accent-red/20'
              : 'glass border-glass-border text-text-secondary hover:text-white'
          )}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Log Expense
        </button>
        <button
          onClick={() => setActiveForm(activeForm === 'shipment' ? null : 'shipment')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
            activeForm === 'shipment'
              ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
              : 'glass border-glass-border text-text-secondary hover:text-white'
          )}
        >
          <Truck className="w-3.5 h-3.5" />
          Shipment Update
        </button>
        <button
          onClick={() => setActiveForm(activeForm === 'inventory' ? null : 'inventory')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
            activeForm === 'inventory'
              ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
              : 'glass border-glass-border text-text-secondary hover:text-white'
          )}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Inventory Note
        </button>
      </div>

      {/* Expense Form */}
      {activeForm === 'expense' && (
        <div className="glass-card p-4 space-y-3 border border-accent-red/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Log Expense</p>
            <button onClick={() => setActiveForm(null)} className="text-text-muted hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="metric-label block mb-1">Description *</label>
              <input
                value={expDesc}
                onChange={e => setExpDesc(e.target.value)}
                placeholder="e.g. Marketing materials printing"
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-red/50"
              />
            </div>
            <div>
              <label className="metric-label block mb-1">Amount (SAR) *</label>
              <input
                type="number"
                value={expAmount}
                onChange={e => setExpAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-red/50"
              />
            </div>
            <div>
              <label className="metric-label block mb-1">Category</label>
              <select
                value={expCategory}
                onChange={e => setExpCategory(e.target.value)}
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-red/50"
              >
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c} value={c} style={{ background: '#0f0f18' }}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="metric-label block mb-1">Date</label>
              <input
                type="date"
                value={expDate}
                onChange={e => setExpDate(e.target.value)}
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-red/50"
              />
            </div>
          </div>
          <button
            onClick={() => expenseMutation.mutate({ description: expDesc, amount: parseFloat(expAmount), category: expCategory, date: expDate || undefined })}
            disabled={!expDesc.trim() || !expAmount || expenseMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-red/80 text-white text-sm font-medium hover:bg-accent-red/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {expenseMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
            Save Expense
          </button>
        </div>
      )}

      {/* Shipment Form */}
      {activeForm === 'shipment' && (
        <div className="glass-card p-4 space-y-3 border border-accent-blue/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Shipment Update</p>
            <button onClick={() => setActiveForm(null)} className="text-text-muted hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="metric-label block mb-1">Order ID *</label>
              <input
                value={shpOrderId}
                onChange={e => setShpOrderId(e.target.value)}
                placeholder="e.g. ORD-12345"
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-blue/50"
              />
            </div>
            <div>
              <label className="metric-label block mb-1">Carrier</label>
              <input
                value={shpCarrier}
                onChange={e => setShpCarrier(e.target.value)}
                placeholder="e.g. Aramex, DHL"
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-blue/50"
              />
            </div>
            <div>
              <label className="metric-label block mb-1">Status</label>
              <select
                value={shpStatus}
                onChange={e => setShpStatus(e.target.value)}
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue/50"
              >
                {SHIPMENT_STATUSES.map(s => (
                  <option key={s} value={s} style={{ background: '#0f0f18' }}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="metric-label block mb-1">ETA</label>
              <input
                type="date"
                value={shpEta}
                onChange={e => setShpEta(e.target.value)}
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="metric-label block mb-1">Notes</label>
              <input
                value={shpNotes}
                onChange={e => setShpNotes(e.target.value)}
                placeholder="Any additional notes..."
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-blue/50"
              />
            </div>
          </div>
          <button
            onClick={() => shipmentMutation.mutate({ orderId: shpOrderId, carrier: shpCarrier || undefined, status: shpStatus, eta: shpEta || undefined, notes: shpNotes || undefined })}
            disabled={!shpOrderId.trim() || shipmentMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-blue/80 text-white text-sm font-medium hover:bg-accent-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {shipmentMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
            Save Shipment
          </button>
        </div>
      )}

      {/* Inventory Form */}
      {activeForm === 'inventory' && (
        <div className="glass-card p-4 space-y-3 border border-accent-green/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Inventory Note</p>
            <button onClick={() => setActiveForm(null)} className="text-text-muted hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="metric-label block mb-1">SKU *</label>
              <input
                value={invSku}
                onChange={e => setInvSku(e.target.value)}
                placeholder="e.g. ALM-001"
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-green/50"
              />
            </div>
            <div>
              <label className="metric-label block mb-1">Product Name</label>
              <input
                value={invProduct}
                onChange={e => setInvProduct(e.target.value)}
                placeholder="e.g. ALMO Scented Candle"
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-green/50"
              />
            </div>
            <div>
              <label className="metric-label block mb-1">Stock Change * <span className="text-text-muted">(+/-)</span></label>
              <input
                type="number"
                value={invChange}
                onChange={e => setInvChange(e.target.value)}
                placeholder="e.g. -50 or +200"
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-green/50"
              />
            </div>
            <div>
              <label className="metric-label block mb-1">Reason</label>
              <input
                value={invReason}
                onChange={e => setInvReason(e.target.value)}
                placeholder="e.g. New stock received"
                className="w-full bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-green/50"
              />
            </div>
          </div>
          <button
            onClick={() => inventoryMutation.mutate({ sku: invSku, productName: invProduct || undefined, change: parseInt(invChange), reason: invReason || undefined })}
            disabled={!invSku.trim() || !invChange || inventoryMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-green/80 text-white text-sm font-medium hover:bg-accent-green/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {inventoryMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
            Save Note
          </button>
        </div>
      )}

      {/* Recent entries */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Loading entries…
        </div>
      ) : inputs && (inputs.expenses.length > 0 || inputs.shipments.length > 0 || inputs.inventory.length > 0) ? (
        <div className="space-y-3">
          {inputs.expenses.slice(0, 3).map(e => (
            <div key={e.id} className="glass-card p-3 flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-accent-red flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{e.description}</p>
                <p className="text-xs text-text-tertiary">{e.category} · {e.date}</p>
              </div>
              <span className="text-sm font-bold text-accent-red flex-shrink-0">{formatCurrency(e.amount)}</span>
            </div>
          ))}
          {inputs.shipments.slice(0, 3).map(s => (
            <div key={s.id} className="glass-card p-3 flex items-center gap-3">
              <Truck className="w-4 h-4 text-accent-blue flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{s.orderId}</p>
                <p className="text-xs text-text-tertiary">{s.carrier} · {s.status.replace('_', ' ')}</p>
              </div>
              {s.eta && <span className="text-xs text-text-secondary flex-shrink-0">ETA {s.eta}</span>}
            </div>
          ))}
          {inputs.inventory.slice(0, 3).map(i => (
            <div key={i.id} className="glass-card p-3 flex items-center gap-3">
              <ClipboardList className="w-4 h-4 text-accent-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{i.productName}</p>
                <p className="text-xs text-text-tertiary">{i.sku} · {i.reason || 'No reason'}</p>
              </div>
              <span className={cn('text-sm font-bold flex-shrink-0', i.change >= 0 ? 'text-accent-green' : 'text-accent-red')}>
                {i.change >= 0 ? '+' : ''}{i.change}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const SEVERITY_STYLES = {
  critical: { dot: 'status-dot-red animate-glow-pulse', badge: 'bg-accent-red/10 text-accent-red border-accent-red/20' },
  high: { dot: 'status-dot bg-accent-orange', badge: 'bg-accent-orange/10 text-accent-orange border-accent-orange/20' },
  medium: { dot: 'status-dot-yellow', badge: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20' },
  low: { dot: 'status-dot bg-text-muted', badge: 'bg-glass text-text-secondary border-glass-border' },
}

const SKU_STATUS = {
  hot: 'text-accent-red',
  growing: 'text-accent-green',
  declining: 'text-text-tertiary',
  stable: 'text-text-secondary',
}

export function BusinessView() {
  const { salla, products, customer, financial, blockers } = mockBusiness

  const fulfillmentPct = (salla.orders.fulfilled / salla.ordersToday) * 100
  const revenuePct = (salla.revenueMTD / salla.revenueTarget) * 100

  return (
    <div className="space-y-8 animate-slide-in-up">

      {/* ── Store Health ── */}
      <section>
        <SectionHeader title="Salla Store Health" subtitle="Live store metrics" icon={ShoppingCart} accent="blue" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <MetricCard
            label="Orders Today"
            value={salla.ordersToday}
            subtitle={`${salla.orders.pending} pending`}
            icon={ShoppingCart}
            accent="blue"
            trend="up"
            trendValue="+12%"
          />
          <MetricCard
            label="Revenue Today"
            value={formatCurrency(salla.revenueToday)}
            subtitle="SAR"
            icon={TrendingUp}
            accent="green"
            trend="up"
            trendValue="+8%"
          />
          <MetricCard
            label="Revenue MTD"
            value={formatCurrency(salla.revenueMTD)}
            subtitle={`${formatPercent(revenuePct)} of SAR 400K target`}
            icon={DollarSign}
            accent="purple"
          />
          <MetricCard
            label="Fulfillment Rate"
            value={formatPercent(fulfillmentPct)}
            subtitle={`${salla.orders.returned} returns today`}
            icon={Package}
            accent="yellow"
          />
        </div>

        {/* Order trend chart */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="metric-label">7-Day Revenue Trend</p>
            <p className="text-xs text-text-secondary">SAR</p>
          </div>
          <MiniAreaChart
            data={salla.ordersTrend}
            xKey="date"
            yKey="revenue"
            color="#3b82f6"
            height={140}
            tooltipFormatter={(v) => formatCurrency(v)}
          />
        </div>
      </section>

      {/* ── Product Performance ── */}
      <section>
        <SectionHeader title="Product Performance" subtitle="SKU velocity & trends" icon={Package} accent="purple" />
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="text-left px-4 py-3 metric-label">Product</th>
                <th className="text-right px-4 py-3 metric-label">Sold</th>
                <th className="text-right px-4 py-3 metric-label">Revenue</th>
                <th className="text-right px-4 py-3 metric-label hidden md:table-cell">7-Day Trend</th>
                <th className="text-right px-4 py-3 metric-label">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.sku} className="border-b border-glass-border/50 hover:bg-glass transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{p.name}</p>
                    <p className="text-xs text-text-tertiary">{p.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white">{p.sold}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{formatCurrency(p.revenue)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="w-24 ml-auto">
                      <SparkLine
                        data={p.trend}
                        color={p.status === 'declining' ? '#ef4444' : p.status === 'hot' ? '#3b82f6' : '#10b981'}
                        height={28}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn('text-xs font-semibold uppercase', SKU_STATUS[p.status as keyof typeof SKU_STATUS])}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Customer Pulse + Financial Snapshot ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Customer Pulse */}
        <section>
          <SectionHeader title="Customer Pulse" subtitle="Reviews, support, sentiment" icon={Star} accent="green" />
          <div className="glass-card p-5 space-y-5">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{customer.avgRating}</p>
                <p className="text-xs text-text-secondary mt-1">avg rating</p>
                <div className="flex gap-0.5 mt-1 justify-center">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={cn('text-sm', i < Math.round(customer.avgRating) ? 'text-accent-yellow' : 'text-text-muted')}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="glass-card p-3 text-center">
                  <p className="text-lg font-bold text-white">{customer.totalReviews.toLocaleString()}</p>
                  <p className="text-xs text-text-secondary">total reviews</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-lg font-bold text-accent-yellow">{customer.supportTickets}</p>
                  <p className="text-xs text-text-secondary">open tickets</p>
                </div>
              </div>
              <RadialGauge
                value={customer.returnRate}
                max={10}
                color="#ef4444"
                size={64}
                label="return rate"
              />
            </div>

            <div>
              <p className="metric-label mb-3">Recent Reviews</p>
              <div className="space-y-2">
                {customer.recentReviews.map((r) => (
                  <div key={r.id} className="glass-card p-3 flex gap-3">
                    <div className="flex gap-0.5 flex-shrink-0 mt-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={cn('text-xs', i < r.rating ? 'text-accent-yellow' : 'text-text-muted')}>★</span>
                      ))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-text-secondary truncate">"{r.text}"</p>
                      <p className="text-xs text-text-tertiary mt-0.5">{r.product} · {r.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Financial Snapshot */}
        <section>
          <SectionHeader title="Financial Snapshot" subtitle="Cash, burn, margins" icon={DollarSign} accent="green" />
          <div className="glass-card p-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="metric-label mb-1">Cash Position</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(financial.cashPosition)}</p>
                <p className="text-xs text-accent-yellow mt-1">{financial.runwayMonths} months runway</p>
              </div>
              <div>
                <p className="metric-label mb-1">Monthly Burn</p>
                <p className="text-2xl font-bold text-accent-red">{formatCurrency(financial.burnRateMonthly)}</p>
                <p className="text-xs text-text-secondary mt-1">operating expenses</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-3">
                <p className="metric-label mb-2">Gross Margin</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-glass-border rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-accent-blue to-accent-purple"
                      style={{ width: `${financial.grossMargin}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white tabular-nums">{formatPercent(financial.grossMargin)}</span>
                </div>
              </div>
              <div className="glass-card p-3">
                <p className="metric-label mb-2">Net Margin</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-glass-border rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-accent-green to-accent-cyan"
                      style={{ width: `${financial.netMargin}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white tabular-nums">{formatPercent(financial.netMargin)}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="metric-label mb-3">Cash Position Trend (SAR)</p>
              <MiniAreaChart
                data={financial.cashTrend}
                xKey="month"
                yKey="cash"
                color="#10b981"
                height={100}
                tooltipFormatter={(v) => formatCurrency(v)}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Active Blockers ── */}
      <section>
        <SectionHeader
          title="Active Blockers"
          subtitle={`${blockers.filter(b => b.severity === 'critical' || b.severity === 'high').length} high-priority issues`}
          icon={AlertTriangle}
          accent="blue"
        />
        <div className="space-y-2">
          {blockers.map((b) => {
            const style = SEVERITY_STYLES[b.severity as keyof typeof SEVERITY_STYLES]
            return (
              <div key={b.id} className="glass-card p-4 flex items-center gap-4">
                <span className={style.dot} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{b.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Since {formatRelativeTime(b.since)} · Owner: <span className="text-accent-blue">{b.owner}</span>
                  </p>
                </div>
                <span className={cn('text-xs font-semibold uppercase px-2 py-0.5 rounded-md border', style.badge)}>
                  {b.severity}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Business Inputs ── */}
      <section>
        <SectionHeader
          title="Business Inputs"
          subtitle="Log expenses, shipments & inventory"
          icon={PlusCircle}
          accent="green"
        />
        <BusinessInputsPanel />
      </section>
    </div>
  )
}
