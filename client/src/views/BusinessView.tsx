import { ShoppingCart, TrendingUp, Star, DollarSign, AlertTriangle, Package } from 'lucide-react'
import { SectionHeader } from '@/components/cards/SectionHeader'
import { MetricCard } from '@/components/cards/MetricCard'
import { MiniAreaChart } from '@/components/charts/MiniAreaChart'
import { SparkLine } from '@/components/charts/SparkLine'
import { RadialGauge } from '@/components/charts/RadialGauge'
import { mockBusiness } from '@/api/mock'
import { formatCurrency, formatPercent, formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

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
    </div>
  )
}
