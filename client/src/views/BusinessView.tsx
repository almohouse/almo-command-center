import { useState } from 'react'
import { ShoppingCart, DollarSign, PlusCircle, Truck, ClipboardList, RefreshCw, X, Clock } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SectionHeader } from '@/components/cards/SectionHeader'
import { formatCurrency } from '@/lib/utils'
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

export function BusinessView() {
  return (
    <div className="space-y-8 animate-slide-in-up">

      {/* ── Store Health / Product / Customer / Financial — Phase 2 ── */}
      <section>
        <SectionHeader title="Salla Store Health" subtitle="Live store metrics" icon={ShoppingCart} accent="blue" />
        <div data-testid="store-health-metrics" className="glass-card p-8 flex flex-col items-center justify-center text-center border border-accent-blue/10 rounded-xl">
          <Clock className="w-10 h-10 text-text-muted mb-3" />
          <p className="text-base font-semibold text-white mb-1">Store Metrics — Phase 2</p>
          <p className="text-sm text-text-secondary max-w-sm">
            Live Salla order, revenue, and fulfillment data will appear here once the Salla integration is live.
          </p>
          <span className="mt-4 px-3 py-1 rounded-full text-xs font-medium bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
            Coming in Phase 2
          </span>
        </div>
      </section>

      <section>
        <SectionHeader title="Product Performance" subtitle="SKU velocity & trends" icon={DollarSign} accent="purple" />
        <div
          data-testid="product-performance-table-scroll"
          className="glass-card p-8 flex flex-col items-center justify-center text-center border border-accent-purple/10 rounded-xl"
        >
          <Clock className="w-10 h-10 text-text-muted mb-3" />
          <p className="text-base font-semibold text-white mb-1">Product Analytics — Phase 2</p>
          <p className="text-sm text-text-secondary max-w-sm">
            SKU-level sales data will be available once the Salla product catalog integration is complete.
          </p>
          <span className="mt-4 px-3 py-1 rounded-full text-xs font-medium bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
            Coming in Phase 2
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <SectionHeader title="Customer Pulse" subtitle="Reviews, support, sentiment" icon={DollarSign} accent="green" />
          <div className="glass-card p-8 flex flex-col items-center justify-center text-center border border-accent-green/10 rounded-xl h-full">
            <Clock className="w-10 h-10 text-text-muted mb-3" />
            <p className="text-base font-semibold text-white mb-1">Customer Data — Phase 2</p>
            <p className="text-sm text-text-secondary max-w-xs">
              Review scores, support tickets, and return rates will sync from Salla in Phase 2.
            </p>
            <span className="mt-4 px-3 py-1 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20">
              Coming in Phase 2
            </span>
          </div>
        </section>

        <section>
          <SectionHeader title="Financial Snapshot" subtitle="Cash, burn, margins" icon={DollarSign} accent="green" />
          <div className="glass-card p-8 flex flex-col items-center justify-center text-center border border-accent-green/10 rounded-xl h-full">
            <Clock className="w-10 h-10 text-text-muted mb-3" />
            <p className="text-base font-semibold text-white mb-1">Financial Data — Phase 2</p>
            <p className="text-sm text-text-secondary max-w-xs">
              Cash position, burn rate, and margin data will be available once accounting integration is live.
            </p>
            <span className="mt-4 px-3 py-1 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20">
              Coming in Phase 2
            </span>
          </div>
        </section>
      </div>

      {/* ── Business Inputs (real API) ── */}
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
