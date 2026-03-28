import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Bar, Legend, Line, ComposedChart, ReferenceLine } from 'recharts'
import { useAudioPlayer } from '@/data/audio-player'
import { useStore, GOAL_COLORS } from '@/data/store'
import InfoIcon from '@/components/shared/InfoIcon'
import { api } from '@/lib/api'

// ─── Animation ────────────────────────────────────────────────────────────────

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }
const itemVariants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } } }

// ─── Types ────────────────────────────────────────────────────────────────────

type KPIStatus = 'on-track' | 'at-risk' | 'behind'

interface KPI { id: string; name: string; target: number; current: number; unit: string; format: 'currency' | 'percent' | 'number' | 'days'; status: KPIStatus; projectIds: string[] }
interface StrategicObjective { id: string; title: string; icon: string; color: 'green' | 'purple' | 'blue' | 'amber'; description: string; kpis: KPI[] }
interface KeyResult { text: string; target: number; current: number; unit: string }
interface OKR { id: string; quarter: string; objective: string; owner: string; keyResults: KeyResult[] }

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_VISION = "To become the Middle East's most trusted comfort engineering brand"
const INITIAL_MISSION = "Design, source, and deliver premium comfort products that enhance daily life for Saudi consumers and businesses"

const OBJECTIVE_COLORS = {
  green:  { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', bar: '#4ade80', glow: '0 0 6px #4ade80' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', bar: '#c084fc', glow: '0 0 6px #c084fc' },
  blue:   { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', bar: '#60a5fa', glow: '0 0 6px #60a5fa' },
  amber:  { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', bar: '#fbbf24', glow: '0 0 6px #fbbf24' },
}

const KPI_STATUS_STYLE: Record<KPIStatus, string> = {
  'on-track': 'bg-green-500/10 text-green-400 border-green-500/20',
  'at-risk': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'behind': 'bg-red-500/10 text-red-400 border-red-500/20',
}

const INITIAL_OBJECTIVES: StrategicObjective[] = [
  { id: 'revenue', title: 'Revenue Growth', icon: 'trending_up', color: 'green', description: 'Hit 500K SAR annual revenue through D2C and B2B channels', kpis: [
    { id: 'k1', name: 'Annual Revenue', target: 500_000, current: 52_800, unit: 'SAR', format: 'currency', status: 'at-risk', projectIds: ['Product Launch', '2026-BD-ARAMCO', '2026-MK-RMDN'] },
    { id: 'k2', name: 'Average Order Value', target: 750, current: 612, unit: 'SAR', format: 'currency', status: 'at-risk', projectIds: ['Product Launch', '2026-BD-ARAMCO'] },
    { id: 'k3', name: 'B2B Deals Closed', target: 3, current: 0, unit: 'deals', format: 'number', status: 'behind', projectIds: ['2026-BD-ARAMCO'] },
  ]},
  { id: 'product', title: 'Product Excellence', icon: 'diamond', color: 'purple', description: 'Launch world-class comfort products with exceptional quality', kpis: [
    { id: 'k4', name: 'New SKUs Launched', target: 3, current: 1, unit: 'SKUs', format: 'number', status: 'on-track', projectIds: ['Product Launch', 'Discovery'] },
    { id: 'k5', name: 'Avg Product Rating', target: 4.5, current: 4.3, unit: '/ 5', format: 'number', status: 'on-track', projectIds: ['Product Launch'] },
  ]},
  { id: 'market', title: 'Market Expansion', icon: 'public', color: 'blue', description: 'Grow the Saudi customer base and reach new cities', kpis: [
    { id: 'k6', name: 'Active Customers', target: 200, current: 47, unit: 'customers', format: 'number', status: 'behind', projectIds: ['2026-MK-RMDN', '2026-BD-ARAMCO'] },
    { id: 'k7', name: 'Cities Reached', target: 5, current: 3, unit: 'cities', format: 'number', status: 'on-track', projectIds: ['2026-MK-RMDN'] },
  ]},
  { id: 'ops', title: 'Operational Efficiency', icon: 'speed', color: 'amber', description: 'Reduce costs and improve reliability of the supply chain', kpis: [
    { id: 'k8', name: 'COGS Reduction', target: 20, current: 12, unit: '%', format: 'percent', status: 'on-track', projectIds: ['2026-OP-SUPPLY', 'Operations'] },
    { id: 'k9', name: 'Avg Fulfillment Time', target: 3, current: 4.2, unit: 'days', format: 'days', status: 'at-risk', projectIds: ['Operations', '2026-OP-SUPPLY'] },
    { id: 'k10', name: 'ZATCA Compliance', target: 100, current: 40, unit: '%', format: 'percent', status: 'behind', projectIds: ['Operations'] },
  ]},
]

const INITIAL_OKRS: OKR[] = [
  { id: 'okr1', quarter: 'Q2 2026', objective: 'Launch weighted blanket and keyboard tray to market', owner: 'CRDO', keyResults: [
    { text: 'Complete supplier contracts for both products', target: 2, current: 1, unit: 'contracts' },
    { text: 'Ship first 100 units of weighted blanket', target: 100, current: 0, unit: 'units' },
    { text: 'Achieve 50 pre-orders via Ramadan campaign', target: 50, current: 12, unit: 'pre-orders' },
  ]},
  { id: 'okr2', quarter: 'Q2 2026', objective: 'Close first enterprise B2B deal', owner: 'DCEO', keyResults: [
    { text: 'Submit Aramco proposal deck', target: 1, current: 0, unit: 'proposal' },
    { text: 'Generate 5 qualified B2B leads', target: 5, current: 2, unit: 'leads' },
    { text: 'Achieve B2B AOV of 5,000+ SAR', target: 5_000, current: 0, unit: 'SAR' },
  ]},
  { id: 'okr3', quarter: 'Q2 2026', objective: 'Build operational backbone for scale', owner: 'CFO', keyResults: [
    { text: 'Achieve ZATCA e-invoice compliance', target: 100, current: 40, unit: '%' },
    { text: 'Deploy Mission Control v1 to production', target: 1, current: 0, unit: 'deploy' },
    { text: 'Reduce supply chain cost by 15%', target: 15, current: 12, unit: '%' },
  ]},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtKPI(value: number, format: string): string {
  if (format === 'currency') return value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K` : String(value)
  if (format === 'percent') return `${value}%`
  if (format === 'days') return `${value}d`
  return String(value)
}

function pct(current: number, target: number) { return Math.min(Math.round((current / target) * 100), 100) }

function SectionHeader({ children, info }: { children: React.ReactNode; info?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary">{children}</div>
      {info && <InfoIcon text={info} />}
    </div>
  )
}

function EditButton({ editing, onToggle }: { editing: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all shrink-0" title={editing ? 'Save' : 'Edit'}>
      <span className="material-symbols-outlined text-[16px]">{editing ? 'check' : 'edit'}</span>
    </button>
  )
}

function generate5YearData(annualTarget: number, monthlyRevenue: number, yoyGrowth: number, profitMargin: number) {
  const data = []
  let forecastRev = monthlyRevenue * 12
  let targetRev = annualTarget
  for (let y = 0; y < 5; y++) {
    const year = 2026 + y
    if (y > 0) {
      forecastRev = forecastRev * 1.15
      targetRev = targetRev * (1 + yoyGrowth / 100)
    }
    const gapPct = targetRev > 0 ? Math.round(((targetRev - forecastRev) / targetRev) * 100) : 0
    data.push({
      year: String(year),
      forecast: Math.round(forecastRev),
      target: Math.round(targetRev),
      forecastProfit: Math.round(forecastRev * profitMargin / 100),
      targetProfit: Math.round(targetRev * profitMargin / 100),
      gapPct: Math.max(0, gapPct),
      cagr: y > 0 ? Math.round((Math.pow(targetRev / annualTarget, 1 / y) - 1) * 100) : 0,
    })
  }
  return data
}

// ─── Goals Page ───────────────────────────────────────────────────────────────

export default function Goals() {
  const navigate = useNavigate()
  const store = useStore()
  const audioPlayer = useAudioPlayer()

  const [vision, setVision] = useState(INITIAL_VISION)
  const [mission, setMission] = useState(INITIAL_MISSION)
  const [editingVision, setEditingVision] = useState(false)
  const [yearlyProfitTarget, setYearlyProfitTarget] = useState(75_000)
  const [yoyGrowthTarget, setYoyGrowthTarget] = useState(80)
  const [profitMargin, setProfitMargin] = useState(15)
  const [editingFinancials, setEditingFinancials] = useState(false)
  const [objectives, setObjectives] = useState(INITIAL_OBJECTIVES)
  const [editingObjId, setEditingObjId] = useState<string | null>(null)
  const [okrs, setOkrs] = useState(INITIAL_OKRS)
  const [editingOkrId, setEditingOkrId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [audioGenerating, setAudioGenerating] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisGenerating, setAnalysisGenerating] = useState(false)
  const [analysisReady, setAnalysisReady] = useState(false)
  const [showProjectMap, setShowProjectMap] = useState(false)
  const [chartView, setChartView] = useState<'revenue' | 'profit' | 'both'>('both')

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.goals.list() as any[]
        if (data.length > 0) {
          // Try to map backend goals to our objective/okr format
          // The backend may return goals with different structure
          const backendObjectives = data.filter((g: any) => g.type === 'objective' || g.kpis)
          const backendOkrs = data.filter((g: any) => g.type === 'okr' || g.key_results || g.keyResults)

          if (backendObjectives.length > 0) {
            setObjectives(backendObjectives.map((obj: any) => ({
              id: obj.id,
              title: obj.title,
              icon: obj.icon || 'flag',
              color: obj.color || 'green',
              description: obj.description || '',
              kpis: (obj.kpis || []).map((k: any) => ({
                id: k.id,
                name: k.name,
                target: k.target,
                current: k.current,
                unit: k.unit || '',
                format: k.format || 'number',
                status: k.status || 'on-track',
                projectIds: k.project_ids || k.projectIds || [],
              })),
            })))
          }

          if (backendOkrs.length > 0) {
            setOkrs(backendOkrs.map((okr: any) => ({
              id: okr.id,
              quarter: okr.quarter || 'Q2 2026',
              objective: okr.objective,
              owner: okr.owner || '',
              keyResults: (okr.key_results || okr.keyResults || []).map((kr: any) => ({
                text: kr.text,
                target: kr.target,
                current: kr.current,
                unit: kr.unit || '',
              })),
            })))
          }

          // Check for vision/mission
          const visionGoal = data.find((g: any) => g.id === 'vision' || g.type === 'vision')
          const missionGoal = data.find((g: any) => g.id === 'mission' || g.type === 'mission')
          if (visionGoal?.text) setVision(visionGoal.text)
          if (missionGoal?.text) setMission(missionGoal.text)
        }
      } catch {
        setError('Backend offline — showing local data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Computed
  const monthlyCurrent = 18_400
  const annualRevenueTarget = Math.round(yearlyProfitTarget / (profitMargin / 100))
  const monthlyRevenueTarget = Math.round(annualRevenueTarget / 12)
  const monthlyProfitTarget = Math.round(yearlyProfitTarget / 12)
  const revenueCurrent = 52_800
  const monthlyPct = pct(monthlyCurrent, monthlyRevenueTarget)
  const projectedAnnual = monthlyCurrent * 12
  const forecastData = generate5YearData(annualRevenueTarget, monthlyCurrent, yoyGrowthTarget, profitMargin)
  const riskPct = Math.max(0, Math.min(100, Math.round(100 - (projectedAnnual / annualRevenueTarget) * 100)))
  const riskLabel = riskPct <= 20 ? 'Low' : riskPct <= 50 ? 'Medium' : 'High'
  const riskColor = riskPct <= 20 ? 'text-green-400' : riskPct <= 50 ? 'text-amber-400' : 'text-error'

  // Handlers
  async function handleAudioSummary() {
    setAudioGenerating(true)
    try { await fetch('/api/audio/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: 'goals' }) }) } catch { /* dev */ }
    setAudioGenerating(false)
    audioPlayer.play({ title: 'Goals & Strategy Summary', subtitle: '2026 Annual Plan · AI Generated', duration: '3:12' })
  }

  async function handleGenerateAnalysis() {
    setShowAnalysis(true)
    if (analysisReady) return
    setAnalysisGenerating(true)
    await new Promise(r => setTimeout(r, 1200))
    setAnalysisReady(true)
    setAnalysisGenerating(false)
  }

  function handleDeepResearch() {
    const gap = annualRevenueTarget - revenueCurrent
    navigate('/crdo', { state: { prefill: {
      reqType: 'Market Analysis',
      reqTitle: 'Strategic Gap Analysis — 2026 Annual Revenue Target',
      reqDesc: `Deep research request (Tier 3): ALMO is tracking at ${pct(revenueCurrent, annualRevenueTarget)}% of its ${(annualRevenueTarget / 1000).toFixed(0)}K SAR annual revenue target through Q1 2026.\n\nCurrent monthly run rate: ${(monthlyCurrent / 1000).toFixed(1)}K SAR vs ${(monthlyRevenueTarget / 1000).toFixed(1)}K SAR target. Projected annual: ~${(projectedAnnual / 1000).toFixed(0)}K SAR. Gap: ${(gap / 1000).toFixed(0)}K SAR.\n\nResearch: 1) Saudi comfort market analysis 2) Growth levers 3) Ramadan ROI 4) B2B acceleration 5) Product launch sequencing`,
      reqPriority: 'High',
    }}})
  }

  // AI analysis data
  const alignmentLines = objectives.map(obj => {
    const onTrack = obj.kpis.filter(k => k.status === 'on-track').length
    const atRisk = obj.kpis.filter(k => k.status === 'at-risk').length
    const behind = obj.kpis.filter(k => k.status === 'behind').length
    const worst = obj.kpis.reduce((a, b) => pct(a.current, a.target) < pct(b.current, b.target) ? a : b)
    return { obj, onTrack, atRisk, behind, worst }
  })
  const recommendations = [
    { severity: 'critical' as const, title: 'Revenue Run Rate Gap', text: `At ${(monthlyCurrent / 1000).toFixed(1)}K/month, projected ~${(projectedAnnual / 1000).toFixed(0)}K SAR — ${riskPct}% short of ${(annualRevenueTarget / 1000).toFixed(0)}K target.` },
    { severity: 'high' as const, title: 'B2B Pipeline Empty', text: 'Zero B2B deals closed. Aramco proposal still in Backlog. Escalate immediately.' },
    { severity: 'high' as const, title: 'ZATCA Compliance Blocked', text: 'ZATCA at 40%. Invoicing task blocked on Fatoora sandbox. Regulatory risk.' },
    { severity: 'medium' as const, title: 'Ramadan Campaign Window', text: 'Content calendar in Review. Ramadan is imminent — expedite approval.' },
  ]
  const SEVERITY_DOT: Record<string, string> = { critical: 'bg-error', high: 'bg-amber-400', medium: 'bg-blue-400' }

  // Custom tooltip for chart
  function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
    if (!active || !payload) return null
    const d = forecastData.find(d => d.year === label)
    return (
      <div className="px-4 py-3 rounded-xl text-[11px]" style={{ background: 'rgba(25,25,29,0.96)', border: '1px solid rgba(230,230,250,0.1)' }}>
        <div className="text-primary font-bold mb-2">{label}</div>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-on-surface-variant">{p.name}:</span>
            <span className="text-primary font-semibold">{(p.value / 1000).toFixed(0)}K SAR</span>
          </div>
        ))}
        {d && <div className="mt-2 pt-2 border-t border-primary/[0.08] text-on-surface-variant">Gap: <span className="text-tertiary font-semibold">{d.gapPct}%</span>{d.cagr > 0 && <> · CAGR: <span className="text-secondary font-semibold">{d.cagr}%</span></>}</div>}
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-16">

      {loading && (
        <motion.div variants={itemVariants} className="glass-card p-8 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-secondary/30 border-t-secondary animate-spin" />
          <span className="ml-3 text-sm text-on-surface-variant">Loading goals...</span>
        </motion.div>
      )}
      {error && (
        <motion.div variants={itemVariants} className="glass-card p-4 border border-amber-500/20">
          <span className="text-xs text-amber-400">{error}</span>
        </motion.div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">Business</div>
        <h1 className="text-4xl font-black text-primary text-glow">Goals & Strategy</h1>
        <p className="text-sm text-on-surface-variant mt-2">2026 Strategic Plan — ALMO Comfort Engineering</p>
        <div className="flex gap-3 mt-4">
          <button onClick={handleAudioSummary} disabled={audioGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">{audioGenerating ? 'hourglass_empty' : 'play_arrow'}</span>
            {audioGenerating ? 'Generating...' : 'Audio Summary'}
          </button>
          <button onClick={handleGenerateAnalysis}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            AI Analysis
          </button>
        </div>
      </motion.div>

      {/* ── AI Analysis (below header) ──────────────────────────────────── */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            {analysisGenerating ? (
              <div className="glass-card p-12 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-secondary/30 border-t-secondary animate-spin" />
                <span className="ml-3 text-sm text-on-surface-variant">Analyzing strategic position...</span>
              </div>
            ) : analysisReady ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[18px] text-secondary">compare_arrows</span>
                    <div className="text-[11px] font-bold tracking-[0.15em] text-secondary uppercase">Goal Alignment</div>
                    <InfoIcon text="Compares your strategic targets against actual progress. Highlights which objectives are on track and where the gaps are." />
                    <button onClick={() => setShowAnalysis(false)} className="ml-auto text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-[16px]">close</span></button>
                  </div>
                  <div className="space-y-4">
                    {alignmentLines.map(({ obj, onTrack, atRisk, behind, worst }) => {
                      const c = OBJECTIVE_COLORS[obj.color]
                      return (
                        <div key={obj.id} className="flex items-start gap-3">
                          <span className={`material-symbols-outlined text-[16px] mt-0.5 ${c.text}`}>{obj.icon}</span>
                          <div>
                            <div className={`text-sm font-semibold ${c.text}`}>{obj.title}</div>
                            <div className="text-xs text-on-surface-variant mt-0.5">
                              {onTrack > 0 && <span className="text-green-400">{onTrack} on track</span>}
                              {atRisk > 0 && <span className="text-amber-400">{onTrack > 0 ? ' · ' : ''}{atRisk} at risk</span>}
                              {behind > 0 && <span className="text-red-400">{(onTrack + atRisk) > 0 ? ' · ' : ''}{behind} behind</span>}
                            </div>
                            <div className="text-[11px] text-on-surface-variant/60 mt-1">Gap: {worst.name} at {pct(worst.current, worst.target)}%</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[18px] text-secondary">lightbulb</span>
                    <div className="text-[11px] font-bold tracking-[0.15em] text-secondary uppercase">Recommendations</div>
                    <InfoIcon text="AI-generated action items prioritized by severity. Critical items need immediate attention." />
                  </div>
                  <div className="space-y-3">
                    {recommendations.map((r, i) => (
                      <div key={i} className="flex gap-3">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[r.severity]}`} />
                        <div>
                          <div className="text-xs font-semibold text-primary">{r.title}</div>
                          <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">{r.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleDeepResearch}
                    className="mt-4 flex items-center gap-2 px-5 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm font-semibold hover:bg-secondary/20 transition-all w-full justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">science</span>
                    Deep Research via CRDO
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Vision & Mission ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass-card p-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Vision & Mission</div>
            <InfoIcon text="The north star of the company. Vision is where you want to go. Mission is how you get there. Review quarterly." />
          </div>
          <EditButton editing={editingVision} onToggle={() => setEditingVision(v => !v)} />
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[18px] text-secondary">visibility</span>
              <div className="text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase">Vision</div>
            </div>
            {editingVision ? (
              <textarea value={vision} onChange={e => setVision(e.target.value)} rows={3}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-primary/[0.08] text-base text-primary/90 italic focus:border-primary/30 focus:outline-none resize-none" />
            ) : (
              <p className="text-lg text-primary/90 leading-relaxed italic">"{vision}"</p>
            )}
          </div>
          <div className="border-l border-primary/[0.08] pl-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[18px] text-secondary">rocket_launch</span>
              <div className="text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase">Mission</div>
            </div>
            {editingVision ? (
              <textarea value={mission} onChange={e => setMission(e.target.value)} rows={3}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-primary/[0.08] text-base text-primary/90 italic focus:border-primary/30 focus:outline-none resize-none" />
            ) : (
              <p className="text-lg text-primary/90 leading-relaxed italic">"{mission}"</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Financial Targets ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Editable yearly profit and YOY growth targets. Monthly revenue, monthly profit, and annual revenue are auto-calculated from these inputs.">Financial Targets</SectionHeader>
        <div className="glass-card p-6">
          <div className="flex items-center justify-end mb-4">
            <EditButton editing={editingFinancials} onToggle={() => setEditingFinancials(v => !v)} />
          </div>
          <div className="grid grid-cols-3 gap-6 mb-6 pb-6 border-b border-primary/[0.06]">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em]">Yearly Profit Target</div>
                <InfoIcon text="Your annual net profit goal. All revenue targets are reverse-calculated from this using your profit margin percentage." />
              </div>
              {editingFinancials ? (
                <div className="flex items-center gap-1"><input type="number" value={yearlyProfitTarget} onChange={e => setYearlyProfitTarget(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.08] text-lg font-black text-primary focus:outline-none focus:border-primary/30" /><span className="text-xs text-on-surface-variant shrink-0">SAR</span></div>
              ) : <div className="text-2xl font-black text-primary">{yearlyProfitTarget.toLocaleString()} SAR</div>}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em]">YOY Growth Target</div>
                <InfoIcon text="Year-over-year growth rate applied to revenue targets. Used in the 5-year forecast to project where you need to be each year." />
              </div>
              {editingFinancials ? (
                <div className="flex items-center gap-1"><input type="number" value={yoyGrowthTarget} onChange={e => setYoyGrowthTarget(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.08] text-lg font-black text-primary focus:outline-none focus:border-primary/30" /><span className="text-xs text-on-surface-variant shrink-0">%</span></div>
              ) : <div className="text-2xl font-black text-primary">{yoyGrowthTarget}%</div>}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em]">Profit Margin</div>
                <InfoIcon text="Net profit as a percentage of revenue. Used to convert between revenue and profit targets across all calculations." />
              </div>
              {editingFinancials ? (
                <div className="flex items-center gap-1"><input type="number" value={profitMargin} onChange={e => setProfitMargin(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.08] text-lg font-black text-primary focus:outline-none focus:border-primary/30" /><span className="text-xs text-on-surface-variant shrink-0">%</span></div>
              ) : <div className="text-2xl font-black text-primary">{profitMargin}%</div>}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-1.5 mb-1"><div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em]">Annual Revenue Target</div><InfoIcon text="Yearly Profit Target divided by Profit Margin. This is how much total revenue you need to hit your profit goal." /></div>
              <div className="text-xl font-black text-primary">{annualRevenueTarget.toLocaleString()} SAR</div>
              <div className="text-[10px] text-on-surface-variant">auto-calculated</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1"><div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em]">Monthly Revenue Target</div><InfoIcon text="Annual Revenue Target divided by 12. The monthly pace needed to hit the annual goal." /></div>
              <div className="text-xl font-black text-primary">{monthlyRevenueTarget.toLocaleString()} SAR</div>
              <div className="text-[10px] text-on-surface-variant">auto-calculated</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1"><div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em]">Monthly Profit Target</div><InfoIcon text="Yearly Profit Target divided by 12. The monthly profit you need to sustain." /></div>
              <div className="text-xl font-black text-primary">{monthlyProfitTarget.toLocaleString()} SAR</div>
              <div className="text-[10px] text-on-surface-variant">auto-calculated</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1"><div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em]">Target Achievability</div><InfoIcon text="Risk percentage based on the gap between your current projected annual revenue and the target. Higher gap = higher risk of missing targets." /></div>
              <div className={`text-xl font-black ${riskColor}`}>{riskPct}% gap</div>
              <div className={`text-[10px] font-bold ${riskColor}`}>{riskLabel} Risk</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="flex justify-between text-[10px] text-on-surface-variant mb-1.5">
                <span>March Revenue: {monthlyCurrent.toLocaleString()} / {monthlyRevenueTarget.toLocaleString()} SAR</span><span>{monthlyPct}%</span>
              </div>
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${monthlyPct}%`, background: monthlyPct >= 80 ? '#cacafe' : '#ff9fe3', boxShadow: `0 0 8px ${monthlyPct >= 80 ? '#cacafe50' : '#ff9fe350'}` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-on-surface-variant mb-1.5">
                <span>Annual: {revenueCurrent.toLocaleString()} / {annualRevenueTarget.toLocaleString()} SAR</span><span>{pct(revenueCurrent, annualRevenueTarget)}%</span>
              </div>
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct(revenueCurrent, annualRevenueTarget)}%`, background: '#cacafe', boxShadow: '0 0 8px #cacafe50' }} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 5-Year Forecast ───────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Compares your forecasted trajectory (15% organic growth from current run rate) against your target trajectory (based on YOY growth input). The gap shows execution risk.">5-Year Forecast vs Target</SectionHeader>
        <div className="glass-card p-6">
          {/* Filters */}
          <div className="flex items-center gap-2 mb-4">
            {(['both', 'revenue', 'profit'] as const).map(v => (
              <button key={v} onClick={() => setChartView(v)}
                className={['px-3 py-1 rounded-lg text-[10px] font-bold tracking-[0.08em] uppercase border transition-all',
                  chartView === v ? 'bg-primary/10 text-primary border-primary/20' : 'text-on-surface-variant border-primary/[0.06] hover:text-primary',
                ].join(' ')}
              >{v === 'both' ? 'Revenue & Profit' : v}</button>
            ))}
            <div className="ml-auto flex items-center gap-4 text-[10px] text-on-surface-variant">
              <span>YOY CAGR: <span className="text-secondary font-bold">{yoyGrowthTarget}%</span></span>
              <span>Organic: <span className="text-on-surface-variant font-bold">15%</span></span>
              <span>5Y Target: <span className="text-primary font-bold">{(forecastData[4].target / 1_000_000).toFixed(1)}M SAR</span></span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="year" tick={{ fill: '#acaaae', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#acaaae', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`} width={50} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                <ReferenceLine y={annualRevenueTarget} stroke="#e6e6fa" strokeDasharray="6 4" strokeOpacity={0.3} label={{ value: `${(annualRevenueTarget / 1000).toFixed(0)}K target`, position: 'right', fill: '#acaaae', fontSize: 9 }} />
                {(chartView === 'both' || chartView === 'revenue') && (
                  <>
                    <Bar dataKey="forecast" name="Forecast Revenue" fill="#cacafe" opacity={0.3} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" name="Target Revenue" fill="#cacafe" radius={[4, 4, 0, 0]} />
                    <Line dataKey="target" name="Target Trend" type="monotone" stroke="#e6e6fa" strokeWidth={2} strokeDasharray="6 3" dot={false} legendType="none" />
                  </>
                )}
                {(chartView === 'both' || chartView === 'profit') && (
                  <>
                    <Bar dataKey="forecastProfit" name="Forecast Profit" fill="#ff9fe3" opacity={0.3} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="targetProfit" name="Target Profit" fill="#ff9fe3" radius={[4, 4, 0, 0]} />
                    <Line dataKey="targetProfit" name="Profit Trend" type="monotone" stroke="#ff9fe3" strokeWidth={2} strokeDasharray="6 3" dot={false} legendType="none" />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* Year-over-year stats */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-primary/[0.06]">
            {forecastData.map((d, i) => (
              <div key={d.year} className="text-center">
                <div className="text-[10px] text-on-surface-variant">{d.year}</div>
                <div className="text-xs font-bold text-primary">{(d.target / 1000).toFixed(0)}K</div>
                {d.gapPct > 0 && <div className={`text-[9px] font-bold ${d.gapPct > 50 ? 'text-error' : d.gapPct > 20 ? 'text-amber-400' : 'text-green-400'}`}>{d.gapPct}% gap</div>}
                {i > 0 && <div className="text-[9px] text-on-surface-variant/50">{yoyGrowthTarget}% YOY</div>}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Strategic Objectives ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="The 3-5 pillars of the business strategy. Each has KPIs with targets. Projects are linked to show execution alignment.">Strategic Objectives</SectionHeader>
        <div className="grid grid-cols-2 gap-6">
          {objectives.map(obj => {
            const c = OBJECTIVE_COLORS[obj.color]
            const isEditing = editingObjId === obj.id
            return (
              <div key={obj.id} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-9 h-9 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined text-[18px] ${c.text}`}>{obj.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input type="text" value={obj.title} onChange={e => setObjectives(prev => prev.map(o => o.id === obj.id ? { ...o, title: e.target.value } : o))}
                        className={`text-sm font-bold ${c.text} bg-transparent border-b border-primary/20 focus:outline-none w-full`} />
                    ) : <div className={`text-sm font-bold ${c.text}`}>{obj.title}</div>}
                    {isEditing ? (
                      <input type="text" value={obj.description} onChange={e => setObjectives(prev => prev.map(o => o.id === obj.id ? { ...o, description: e.target.value } : o))}
                        className="text-[11px] text-on-surface-variant bg-transparent border-b border-primary/10 focus:outline-none w-full mt-0.5" />
                    ) : <div className="text-[11px] text-on-surface-variant">{obj.description}</div>}
                  </div>
                  <EditButton editing={isEditing} onToggle={() => {
                    if (isEditing) {
                      api.goals.update(obj.id, { title: obj.title, description: obj.description, kpis: obj.kpis }).catch(() => {})
                    }
                    setEditingObjId(isEditing ? null : obj.id)
                  }} />
                </div>
                <div className="mt-4 space-y-3">
                  {obj.kpis.map(kpi => {
                    const p = pct(kpi.current, kpi.target)
                    return (
                      <div key={kpi.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-on-surface">{kpi.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-on-surface-variant">{fmtKPI(kpi.current, kpi.format)} / {fmtKPI(kpi.target, kpi.format)}</span>
                            <span className={`text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border ${KPI_STATUS_STYLE[kpi.status]}`}>{kpi.status.replace('-', ' ')}</span>
                          </div>
                        </div>
                        <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: c.bar, boxShadow: c.glow }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-primary/[0.05]">
                  <div className="flex flex-wrap gap-1.5">
                    {[...new Set(obj.kpis.flatMap(k => k.projectIds))].map(pid => {
                      const proj = store.projects.find(p => p.id === pid)
                      if (!proj) return null
                      const gc = GOAL_COLORS[proj.goal] ?? 'bg-surface-container-high text-on-surface-variant border-primary/[0.06]'
                      return <button key={pid} onClick={() => navigate('/projects')} className={`text-[9px] font-bold tracking-[0.05em] px-2 py-0.5 rounded-full border ${gc} hover:opacity-80 transition-all`}>{proj.name}</button>
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Quarterly OKRs ────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="Objectives and Key Results for the current quarter. Each KR has a measurable target. Progress is tracked in real-time.">Quarterly OKRs — Q2 2026</SectionHeader>
        <div className="grid grid-cols-3 gap-6">
          {okrs.map(okr => {
            const avgPct = Math.round(okr.keyResults.reduce((s, kr) => s + pct(kr.current, kr.target), 0) / okr.keyResults.length)
            const isEditing = editingOkrId === okr.id
            return (
              <div key={okr.id} className="glass-card p-6">
                <div className="flex items-start justify-between mb-3">
                  {isEditing ? (
                    <textarea value={okr.objective} rows={2} onChange={e => setOkrs(prev => prev.map(o => o.id === okr.id ? { ...o, objective: e.target.value } : o))}
                      className="text-base font-bold text-primary bg-transparent border-b border-primary/20 focus:outline-none w-full pr-4 resize-none" />
                  ) : <div className="text-base font-bold text-primary leading-snug pr-4">{okr.objective}</div>}
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-black text-primary">{avgPct}%</div>
                    <EditButton editing={isEditing} onToggle={() => {
                      if (isEditing) {
                        api.goals.update(okr.id, { objective: okr.objective, key_results: okr.keyResults }).catch(() => {})
                      }
                      setEditingOkrId(isEditing ? null : okr.id)
                    }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center text-[9px] font-black text-primary">{okr.owner[0]}</div>
                  <span className="text-[11px] text-on-surface-variant">Owner: <span className="text-primary font-semibold">{okr.owner}</span></span>
                </div>
                <div className="space-y-3">
                  {okr.keyResults.map((kr, i) => {
                    const p = pct(kr.current, kr.target)
                    return (
                      <div key={i}>
                        <div className="text-xs text-on-surface leading-relaxed mb-1">{kr.text}</div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: p >= 60 ? '#cacafe' : p > 0 ? '#fbbf24' : '#ff6e84' }} />
                          </div>
                          <span className="text-[10px] text-on-surface-variant shrink-0 w-16 text-right">{kr.current}/{kr.target} {kr.unit}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Project Alignment Map ────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader info="Maps every active project to the KPIs it contributes to. Projects can serve multiple objectives.">Project Alignment Map</SectionHeader>
          <button onClick={() => setShowProjectMap(v => !v)} className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[14px]">{showProjectMap ? 'expand_less' : 'expand_more'}</span>{showProjectMap ? 'Collapse' : 'Expand'}
          </button>
        </div>
        <AnimatePresence>
          {showProjectMap && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="glass-card overflow-hidden">
                <table className="w-full">
                  <thead><tr className="border-b border-primary/[0.06]">
                    {['Project', 'Status', 'Category', 'Linked KPIs', 'Completion'].map(h => (
                      <th key={h} className="text-left text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-5 py-3">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {store.projects.map(proj => {
                      const tasks = store.getProjectTasks(proj.id)
                      const done = tasks.filter(t => t.status === 'Done').length
                      const cp = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
                      const linkedKpis = objectives.flatMap(o => o.kpis).filter(k => k.projectIds.includes(proj.id))
                      const gc = GOAL_COLORS[proj.goal] ?? 'bg-surface-container-high text-on-surface-variant border-primary/[0.06]'
                      return (
                        <tr key={proj.id} className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all">
                          <td className="px-5 py-3.5"><button onClick={() => navigate('/projects')} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">{proj.name}</button></td>
                          <td className="px-5 py-3.5"><span className="text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border bg-secondary/10 text-secondary border-secondary/20">{proj.status}</span></td>
                          <td className="px-5 py-3.5"><span className={`text-[10px] font-bold tracking-[0.05em] px-2 py-0.5 rounded-full border ${gc}`}>{proj.goal}</span></td>
                          <td className="px-5 py-3.5"><div className="flex flex-wrap gap-1">{linkedKpis.length > 0 ? linkedKpis.map(k => (
                            <span key={k.id} className="text-[9px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded border border-primary/[0.06]">{k.name}</span>
                          )) : <span className="text-[10px] text-on-surface-variant/40">—</span>}</div></td>
                          <td className="px-5 py-3.5"><div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-surface-container-highest rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${cp}%`, background: cp >= 80 ? '#cacafe' : '#ff9fe3' }} /></div>
                            <span className="text-[11px] text-on-surface-variant">{cp}%</span>
                          </div></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
