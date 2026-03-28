import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAudioPlayer } from '@/data/audio-player'
import InfoIcon from '@/components/shared/InfoIcon'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts'

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const KPI_CARDS = [
  { label: 'Monthly Revenue', value: '18,400 SAR', change: '+12% MoM', positive: true, info: 'Total gross revenue for the current month. Track against your 25K SAR target.' },
  { label: 'Avg Order Value', value: '612 SAR', change: '+5% MoM', positive: true, info: 'Average revenue per order. Higher AOV means more efficient customer acquisition spend.' },
  { label: 'Active Customers', value: '47', change: '+8 this month', positive: true, info: 'Customers who placed at least one order this month. Growth indicates healthy demand.' },
  { label: 'Gross Margin', value: '34%', change: 'vs 31% last month', positive: true, info: 'Revenue minus COGS as a percentage. Target 35%+ for premium hardware positioning.' },
]

const REVENUE_FIXED = [
  { day: 'Mar 1', value: 720 }, { day: 'Mar 2', value: 1340 }, { day: 'Mar 3', value: 980 },
  { day: 'Mar 4', value: 2100 }, { day: 'Mar 5', value: 1650 }, { day: 'Mar 6', value: 880 },
  { day: 'Mar 7', value: 2450 }, { day: 'Mar 8', value: 1200 }, { day: 'Mar 9', value: 1890 },
  { day: 'Mar 10', value: 3100 }, { day: 'Mar 11', value: 760 }, { day: 'Mar 12', value: 2200 },
  { day: 'Mar 13', value: 1450 }, { day: 'Mar 14', value: 2800 }, { day: 'Mar 15', value: 1100 },
  { day: 'Mar 16', value: 1750 }, { day: 'Mar 17', value: 940 }, { day: 'Mar 18', value: 2600 },
  { day: 'Mar 19', value: 1380 }, { day: 'Mar 20', value: 2050 }, { day: 'Mar 21', value: 1700 },
  { day: 'Mar 22', value: 3200 }, { day: 'Mar 23', value: 820 }, { day: 'Mar 24', value: 1490 },
  { day: 'Mar 25', value: 2350 }, { day: 'Mar 26', value: 1600 }, { day: 'Mar 27', value: 1197 },
  { day: 'Mar 28', value: 0 }, { day: 'Mar 29', value: 0 }, { day: 'Mar 30', value: 0 },
]

const CAMPAIGNS = [
  { name: 'Ramadan Pre-Launch', spend: '4,200 SAR', leads: 38, cac: '110 SAR', status: 'active' },
  { name: 'Cocoon Pro Retargeting', spend: '1,800 SAR', leads: 21, cac: '86 SAR', status: 'paused' },
  { name: 'B2B Cold Outreach', spend: '600 SAR', leads: 5, cac: '120 SAR', status: 'active' },
  { name: 'Referral Program', spend: '300 SAR', leads: 14, cac: '21 SAR', status: 'active' },
]

const TOP_CUSTOMERS = [
  { name: 'محمد العمري', orders: 12, total: '8,640 SAR', city: 'الرياض', segment: 'VIP' },
  { name: 'فيصل الشهري', orders: 9, total: '6,480 SAR', city: 'جدة', segment: 'VIP' },
  { name: 'عبدالله القحطاني', orders: 7, total: '3,920 SAR', city: 'الدمام', segment: 'Regular' },
  { name: 'سارة الدوسري', orders: 6, total: '3,500 SAR', city: 'الرياض', segment: 'Regular' },
  { name: 'خالد المطيري', orders: 5, total: '2,900 SAR', city: 'أبها', segment: 'Regular' },
]

const INVENTORY_ITEMS = [
  { sku: 'COC-PRO-01', name: 'Cocoon Pro', stock: 42, reorder: 20, status: 'ok' },
  { sku: 'COC-LTE-01', name: 'Cocoon Lite', stock: 8, reorder: 15, status: 'alert' },
  { sku: 'KBD-TRY-01', name: 'Keyboard Tray', stock: 0, reorder: 10, status: 'oos' },
  { sku: 'BLK-WGT-01', name: 'Weighted Blanket', stock: 3, reorder: 10, status: 'alert' },
  { sku: 'DSK-PAD-01', name: 'Desk Pad XL', stock: 67, reorder: 25, status: 'ok' },
]

const RISK_REGISTER = [
  { risk: 'Cash runway below 5K SAR', severity: 'critical', owner: 'CFO', status: 'Open' },
  { risk: 'Keyboard Tray stock depleted', severity: 'high', owner: 'Scout', status: 'In Progress' },
  { risk: 'Aramco deal delay beyond Q2', severity: 'medium', owner: 'DCEO', status: 'Monitoring' },
  { risk: 'Weighted Blanket supplier lead time', severity: 'medium', owner: 'CTO', status: 'Open' },
  { risk: 'Ramadan campaign budget overrun', severity: 'low', owner: 'CMO', status: 'Monitoring' },
]

const TABS = ['Executive', 'Marketing', 'Customers', 'Inventory'] as const
type Tab = typeof TABS[number]

const SEVERITY_CLASSES: Record<string, string> = {
  critical: 'bg-error/10 text-error border-error/30',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  low: 'bg-surface-container-high text-on-surface-variant border-primary/[0.08]',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ children, info }: { children: React.ReactNode; info?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary">{children}</div>
      {info && <InfoIcon text={info} />}
    </div>
  )
}

// ─── BI Page ──────────────────────────────────────────────────────────────────

export default function BI() {
  const navigate = useNavigate()
  const audioPlayer = useAudioPlayer()
  const [audioGenerating, setAudioGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('Executive')
  const [timeRange, setTimeRange] = useState('march-2026')
  const connected = true // set to false to see empty state

  if (!connected) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 pb-16"
      >
        <motion.div variants={itemVariants} className="glass-card p-16 flex flex-col items-center gap-6 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant">analytics</span>
          <div>
            <div className="text-xl font-black text-primary mb-2">No data source connected</div>
            <div className="text-sm text-on-surface-variant">Connect Airtable to see live business intelligence data</div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary font-semibold hover:bg-secondary/20 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">settings</span>
            Connect Airtable → Settings
          </button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-16"
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
          Business Intelligence
        </div>
        <h1 className="text-4xl font-black text-primary text-glow">BI Dashboard</h1>
        <p className="text-sm text-on-surface-variant mt-2">March 2026 · Saudi market performance</p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={async () => {
              setAudioGenerating(true)
              try { await fetch('/api/audio/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: 'bi-dashboard' }) }) } catch { /* dev */ }
              setAudioGenerating(false)
              audioPlayer.play({ title: 'BI Dashboard Summary', subtitle: 'Intelligence · AI Generated', duration: '3:10' })
            }}
            disabled={audioGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">{audioGenerating ? 'hourglass_empty' : 'play_arrow'}</span>
            {audioGenerating ? 'Generating...' : 'Audio Summary'}
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all"
          >
            <option value="march-2026">March 2026</option>
            <option value="february-2026">February 2026</option>
            <option value="january-2026">January 2026</option>
            <option value="q1-2026">Q1 2026</option>
          </select>
        </div>
      </motion.div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SectionHeader>Key Performance Indicators</SectionHeader>
        <div className="grid grid-cols-4 gap-4">
          {KPI_CARDS.map((kpi) => (
            <div key={kpi.label} className="glass-card p-6">
              <div className="flex items-center gap-2">
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
                  {kpi.label}
                </div>
                <InfoIcon text={kpi.info} />
              </div>
              <div className="text-3xl font-black text-primary mt-3">{kpi.value}</div>
              <div className={`text-[11px] mt-1 font-semibold ${kpi.positive ? 'text-secondary' : 'text-error'}`}>
                {kpi.change}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Tab Bar ───────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-1 p-1 glass-card rounded-2xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                activeTab === tab
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-on-surface-variant hover:text-primary',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      {activeTab === 'Executive' && (
        <motion.div
          key="executive"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Revenue Chart */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
              Revenue Trend — March 2026
            </div>
            <div className="text-3xl font-black text-primary mb-6">18,400 SAR MTD</div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_FIXED} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="biRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#cacafe" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#cacafe" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#acaaae', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fill: '#acaaae', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}`}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: 'rgba(31,31,35,0.92)',
                      border: '1px solid rgba(230,230,250,0.08)',
                      borderRadius: 8,
                      fontSize: 11,
                      color: '#e6e6fa',
                      padding: '6px 10px',
                    }}
                    formatter={(v: unknown) => [`${(v as number).toLocaleString()} SAR`, '']}
                    labelStyle={{ color: '#acaaae', marginBottom: 2 }}
                    cursor={{ stroke: 'rgba(230,230,250,0.1)', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#cacafe"
                    strokeWidth={2}
                    fill="url(#biRevGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#e6e6fa', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Top Metrics Summary */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Orders', value: '47', sub: 'March 2026' },
              { label: 'Returning Customers', value: '68%', sub: 'of all buyers' },
              { label: 'Avg Delivery Time', value: '2.4 days', sub: 'within KSA' },
            ].map((m) => (
              <div key={m.label} className="glass-card p-5">
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">{m.label}</div>
                <div className="text-3xl font-black text-primary mt-2">{m.value}</div>
                <div className="text-[11px] text-on-surface-variant mt-1">{m.sub}</div>
              </div>
            ))}
          </motion.div>

          {/* Risk Register */}
          <motion.div variants={itemVariants}>
            <SectionHeader>Risk Register</SectionHeader>
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/[0.06]">
                    {['Risk', 'Severity', 'Owner', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase px-5 py-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RISK_REGISTER.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all"
                    >
                      <td className="px-5 py-3.5 text-sm text-on-surface">{row.risk}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border ${SEVERITY_CLASSES[row.severity]}`}>
                          {row.severity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-on-surface-variant">{row.owner}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] text-secondary">{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'Marketing' && (
        <motion.div
          key="marketing"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
            {[
              { label: 'Customer Acquisition Cost', value: '84 SAR', sub: 'blended avg' },
              { label: 'Conversion Rate', value: '3.2%', sub: 'site → purchase' },
              { label: 'ROAS', value: '4.1×', sub: 'return on ad spend' },
            ].map((m) => (
              <div key={m.label} className="glass-card p-6">
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">{m.label}</div>
                <div className="text-3xl font-black text-primary mt-3">{m.value}</div>
                <div className="text-[11px] text-on-surface-variant mt-1">{m.sub}</div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants}>
            <SectionHeader>Campaign Performance</SectionHeader>
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/[0.06]">
                    {['Campaign', 'Spend', 'Leads', 'CAC', 'Status'].map((h) => (
                      <th key={h} className="text-left text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CAMPAIGNS.map((c, i) => (
                    <tr key={i} className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all">
                      <td className="px-5 py-3.5 text-sm text-on-surface">{c.name}</td>
                      <td className="px-5 py-3.5 text-sm text-on-surface-variant">{c.spend}</td>
                      <td className="px-5 py-3.5 text-sm text-primary font-semibold">{c.leads}</td>
                      <td className="px-5 py-3.5 text-sm text-on-surface-variant">{c.cac}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border ${c.status === 'active' ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-surface-container-high text-on-surface-variant border-primary/[0.08]'}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'Customers' && (
        <motion.div
          key="customers"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <motion.div variants={itemVariants}>
            <SectionHeader>Top Customers</SectionHeader>
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/[0.06]">
                    {['Customer', 'City', 'Orders', 'Total Spend', 'Segment'].map((h) => (
                      <th key={h} className="text-left text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TOP_CUSTOMERS.map((c, i) => (
                    <tr key={i} className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all">
                      <td className="px-5 py-3.5 text-sm text-primary font-semibold" style={{ fontFamily: 'inherit' }}>{c.name}</td>
                      <td className="px-5 py-3.5 text-sm text-on-surface-variant">{c.city}</td>
                      <td className="px-5 py-3.5 text-sm text-on-surface">{c.orders}</td>
                      <td className="px-5 py-3.5 text-sm text-primary font-semibold">{c.total}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border ${c.segment === 'VIP' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' : 'bg-surface-container-high text-on-surface-variant border-primary/[0.08]'}`}>
                          {c.segment}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'Inventory' && (
        <motion.div
          key="inventory"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total SKUs', value: '5', sub: 'tracked products' },
              { label: 'Reorder Alerts', value: '2', sub: 'below threshold' },
              { label: 'Out of Stock', value: '1', sub: 'SKU unavailable' },
            ].map((m) => (
              <div key={m.label} className="glass-card p-6">
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">{m.label}</div>
                <div className="text-3xl font-black text-primary mt-3">{m.value}</div>
                <div className="text-[11px] text-on-surface-variant mt-1">{m.sub}</div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants}>
            <SectionHeader>Stock Levels</SectionHeader>
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/[0.06]">
                    {['SKU', 'Product', 'Stock', 'Reorder At', 'Status'].map((h) => (
                      <th key={h} className="text-left text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INVENTORY_ITEMS.map((item, i) => (
                    <tr key={i} className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-on-surface-variant">{item.sku}</td>
                      <td className="px-5 py-3.5 text-sm text-on-surface">{item.name}</td>
                      <td className="px-5 py-3.5 text-sm text-primary font-semibold">{item.stock}</td>
                      <td className="px-5 py-3.5 text-sm text-on-surface-variant">{item.reorder}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border ${
                          item.status === 'ok'
                            ? 'bg-secondary/10 text-secondary border-secondary/20'
                            : item.status === 'alert'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-error/10 text-error border-error/30'
                        }`}>
                          {item.status === 'oos' ? 'Out of Stock' : item.status === 'alert' ? 'Reorder' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
