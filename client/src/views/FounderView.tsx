import { useState } from 'react'
import { User, TrendingUp, CheckSquare, DollarSign, ShoppingCart, Lock, LogOut } from 'lucide-react'
import { SectionHeader } from '@/components/cards/SectionHeader'
import { MetricCard } from '@/components/cards/MetricCard'
import { MiniAreaChart } from '@/components/charts/MiniAreaChart'
import { mockBusiness } from '@/api/mock'
import { formatCurrency, formatPercent } from '@/lib/utils'

const INITIAL_ACTION_ITEMS = [
  { id: 1, title: 'Review Q1 financial performance report', priority: 'high', dueDate: 'Mar 31', done: false },
  { id: 2, title: 'Approve new COO hire — ALMO OS expansion', priority: 'high', dueDate: 'Mar 25', done: false },
  { id: 3, title: 'Strategic review: expand to UAE market?', priority: 'medium', dueDate: 'Apr 5', done: false },
  { id: 4, title: 'Brand photoshoot for ALMO product catalog', priority: 'medium', dueDate: 'Apr 10', done: false },
]

function FounderGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === '1234') {
      onUnlock()
    } else {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-slide-in-up">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center shadow-glow-purple">
        <Lock className="w-7 h-7 text-white" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-1">Founder Portal</h2>
        <p className="text-sm text-text-secondary">Enter your PIN to access Alaa's strategic view</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-xs">
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="Enter PIN"
          maxLength={8}
          className={`w-full bg-glass border rounded-lg px-4 py-3 text-center text-white text-lg tracking-widest font-mono focus:outline-none transition-colors ${
            error ? 'border-accent-red/60 text-accent-red' : 'border-glass-border focus:border-accent-purple/50'
          }`}
        />
        {error && <p className="text-xs text-accent-red" role="alert">Incorrect PIN. Try again.</p>}
        <button
          type="submit"
          disabled={pin.length < 4}
          className="w-full py-2.5 rounded-lg bg-accent-purple text-white font-medium hover:bg-accent-purple/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Enter Portal
        </button>
      </form>
      <p className="text-xs text-text-muted">Demo PIN: 1234</p>
    </div>
  )
}

export function FounderView() {
  const [unlocked, setUnlocked] = useState(false)
  const [actionItems, setActionItems] = useState(INITIAL_ACTION_ITEMS)
  const { salla, financial } = mockBusiness

  const toggleItem = (id: number) => {
    setActionItems(items =>
      items.map(item => item.id === id ? { ...item, done: !item.done } : item)
    )
  }

  const pendingCount = actionItems.filter(i => !i.done).length

  if (!unlocked) {
    return <FounderGate onUnlock={() => setUnlocked(true)} />
  }

  return (
    <div className="space-y-8 animate-slide-in-up">
      {/* Founder header */}
      <div className="glass-card p-5 flex items-center justify-between border border-accent-purple/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-lg font-bold text-white shadow-glow-purple">
            A
          </div>
          <div>
            <p className="text-lg font-bold text-white">Alaa's Founder Portal</p>
            <p className="text-sm text-text-secondary">Strategic visibility · ALMO Brand Founder</p>
          </div>
        </div>
        <button
          onClick={() => setUnlocked(false)}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-glass"
        >
          <LogOut className="w-3.5 h-3.5" />
          Lock
        </button>
      </div>

      <SectionHeader title="Strategic Overview" subtitle="Key business metrics" icon={TrendingUp} accent="purple" />
      <div data-testid="founder-overview-metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Monthly Revenue"
          value={formatCurrency(salla.revenueMTD)}
          subtitle={`${formatPercent((salla.revenueMTD / 400000) * 100)} of SAR 400K goal`}
          icon={DollarSign}
          accent="green"
          trend="up"
          trendValue="+22%"
        />
        <MetricCard
          label="Orders This Month"
          value="1,247"
          subtitle="47 today"
          icon={ShoppingCart}
          accent="blue"
          trend="up"
          trendValue="+15%"
        />
        <MetricCard
          label="Gross Margin"
          value={formatPercent(financial.grossMargin)}
          subtitle="Healthy range"
          icon={TrendingUp}
          accent="purple"
        />
        <MetricCard
          label="Cash Runway"
          value={`${financial.runwayMonths}mo`}
          subtitle={formatCurrency(financial.cashPosition)}
          icon={DollarSign}
          accent="yellow"
          trend="flat"
          trendValue="stable"
        />
      </div>

      <div className="glass-card p-5">
        <p className="metric-label mb-4">Revenue Trend</p>
        <MiniAreaChart
          data={salla.ordersTrend}
          xKey="date"
          yKey="revenue"
          color="#8b5cf6"
          height={160}
          tooltipFormatter={(v) => formatCurrency(v)}
        />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Action Items" subtitle="Decisions waiting for Alaa" icon={CheckSquare} accent="blue" />
          {pendingCount > 0 && (
            <span className="text-xs font-semibold bg-accent-orange/10 text-accent-orange border border-accent-orange/20 px-2.5 py-1 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <div className="space-y-2">
          {actionItems.map((item) => (
            <div
              key={item.id}
              className={`glass-card p-4 flex items-center gap-4 transition-all ${item.done ? 'opacity-50' : ''}`}
            >
              <input
                type="checkbox"
                id={`action-${item.id}`}
                checked={item.done}
                onChange={() => toggleItem(item.id)}
                className="w-4 h-4 rounded border-glass-border accent-accent-purple cursor-pointer"
              />
              <label htmlFor={`action-${item.id}`} className="flex-1 min-w-0 cursor-pointer">
                <p className={`text-sm ${item.done ? 'line-through text-text-muted' : 'text-white'}`}>
                  {item.title}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">Due {item.dueDate}</p>
              </label>
              <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded border flex-shrink-0 ${
                item.priority === 'high'
                  ? 'bg-accent-orange/10 text-accent-orange border-accent-orange/20'
                  : 'bg-glass text-text-secondary border-glass-border'
              }`}>
                {item.priority}
              </span>
            </div>
          ))}
        </div>
        {actionItems.every(i => i.done) && (
          <div className="glass-card p-4 text-center mt-3 border border-accent-green/20">
            <p className="text-sm text-accent-green">All action items complete</p>
          </div>
        )}
      </section>

      <div className="glass-card p-5 flex items-center gap-4 border border-accent-purple/10">
        <User className="w-5 h-5 text-accent-purple flex-shrink-0" />
        <div>
          <p className="text-sm text-white font-medium">Alaa — ALMO Brand Founder</p>
          <p className="text-xs text-text-secondary">Role-gated strategic view · Salla data from mock layer</p>
        </div>
      </div>
    </div>
  )
}
