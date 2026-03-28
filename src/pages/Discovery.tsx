import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useToast } from '@/data/toast'
import InfoIcon from '@/components/shared/InfoIcon'

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

const PIPELINE_STAGES = [
  { step: 1, label: 'Trend Detection',       status: 'done'    as const },
  { step: 2, label: 'Market Validation',     status: 'done'    as const },
  { step: 3, label: 'Demand Analysis',       status: 'done'    as const },
  { step: 4, label: 'Competitor Mapping',    status: 'done'    as const },
  { step: 5, label: 'Supplier Identification', status: 'active' as const },
  { step: 6, label: 'Landed Cost Analysis',  status: 'pending' as const },
  { step: 7, label: 'Margin Calculation',    status: 'pending' as const },
  { step: 8, label: 'Launch Decision',       status: 'pending' as const },
]

const THINKING_LOG = [
  { ts: '10:22:15', agent: 'Scout', msg: 'Analyzing Saudi TikTok trends for ergonomic products...' },
  { ts: '10:22:18', agent: 'Scout', msg: 'Found 847 videos with #ErgoDesk hashtag in KSA (30d)' },
  { ts: '10:22:22', agent: 'Scout', msg: 'Checking Noon.com pricing for keyboard trays...' },
  { ts: '10:22:25', agent: 'Scout', msg: '3 competing products found. Price range: 89-340 SAR' },
  { ts: '10:22:31', agent: 'CRDO',  msg: 'Calculating landed cost from Chinese suppliers...' },
  { ts: '10:22:35', agent: 'CRDO',  msg: 'MOQ: 500 units, Unit cost: $8.50, Freight: $1.20/unit' },
  { ts: '10:22:40', agent: 'CRDO',  msg: 'Projected selling price: 149 SAR, Margin: 38%' },
]

const RECENT_SEARCHES = ['Keyboard Tray', 'Weighted Blanket', 'Ergonomic Chair', 'Standing Desk']

interface NominationCard {
  id: string
  name: string
  stage: string
  stageNum: number
  signal: string
  signalIcon: string
  priceRange: string
  margin: number
  risk: 'Low' | 'Medium' | 'High'
}

const NOMINATIONS: NominationCard[] = [
  {
    id: '1',
    name: 'Keyboard Tray',
    stage: 'Supplier Identification',
    stageNum: 5,
    signal: '🔥 High TikTok velocity (847 videos/month)',
    signalIcon: 'trending_up',
    priceRange: '149-199 SAR',
    margin: 38,
    risk: 'Medium',
  },
  {
    id: '2',
    name: 'Ergonomic Monitor Arm',
    stage: 'Demand Analysis',
    stageNum: 3,
    signal: 'Growing demand, +62% YoY',
    signalIcon: 'show_chart',
    priceRange: '249-349 SAR',
    margin: 32,
    risk: 'Low',
  },
]

const RISK_COLOR = { Low: 'text-secondary', Medium: 'text-yellow-400', High: 'text-[#ff6e84]' }

// ─── Discovery Page ───────────────────────────────────────────────────────────

export default function Discovery() {
  const navigate = useNavigate()
  const [researchQuery, setResearchQuery]   = useState('')
  const [showThinkingLog, setShowThinkingLog] = useState(false)
  const [nominations, setNominations]       = useState<NominationCard[]>(NOMINATIONS)
  const globalToast = useToast()

  function showToast(msg: string) {
    globalToast.show(msg)
  }

  async function handleResearch() {
    if (!researchQuery.trim()) return
    try {
      await fetch('/api/discovery/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: researchQuery }),
      })
    } catch { /* dev: no backend */ }
    setShowThinkingLog(true)
  }

  function handleAdvance(id: string) {
    showToast('Product advanced to next stage')
    setNominations((prev) => prev.filter((n) => n.id !== id))
  }

  function handleKill(id: string) {
    showToast('Product removed from pipeline')
    setNominations((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-16"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
          Scout + CRDO Research Engine
        </div>
        <h1 className="text-4xl font-black text-primary">Product Discovery</h1>
        <p className="text-sm text-on-surface-variant mt-1">8-stage pipeline from trend detection to launch decision</p>
      </motion.div>

      {/* Search / Research input */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">
          Research a New Product Opportunity
        </div>
        <div className="flex gap-3">
          <input
            value={researchQuery}
            onChange={(e) => setResearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
            placeholder="e.g. Ergonomic footrest, lumbar support pillow..."
            className="flex-1 bg-surface-container-high/60 border border-primary/[0.08] rounded-xl px-4 py-2.5 text-sm text-primary placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/30"
          />
          <button
            onClick={handleResearch}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/15 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            Research Now
          </button>
        </div>

        {/* Recent searches */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[11px] text-on-surface-variant/60">Recent:</span>
          {RECENT_SEARCHES.map((s) => (
            <button
              key={s}
              onClick={() => setResearchQuery(s)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-container-high border border-primary/[0.06] text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* 8-stage pipeline progress */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
            Discovery Pipeline — Keyboard Tray
          </div>
          <InfoIcon text="8-stage pipeline tracks a product from initial trend detection through to launch decision. Each stage must pass before advancing." />
        </div>

        {/* Stage progress bar */}
        <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-secondary rounded-full transition-all"
            style={{ width: `${(5 / 8) * 100}%`, boxShadow: '0 0 8px #cacafe' }}
          />
        </div>

        {/* Stage steps */}
        <div className="grid grid-cols-8 gap-1">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.step} className="flex flex-col items-center gap-1.5">
              <div className={[
                'w-8 h-8 rounded-full border-2 flex items-center justify-center text-[12px] font-black transition-all',
                stage.status === 'done'
                  ? 'bg-secondary/20 border-secondary text-secondary'
                  : stage.status === 'active'
                    ? 'bg-primary/20 border-primary text-primary animate-pulse'
                    : 'bg-surface-container-high border-primary/[0.08] text-on-surface-variant/40',
              ].join(' ')}>
                {stage.status === 'done' ? (
                  <span className="material-symbols-outlined text-[14px]">check</span>
                ) : stage.status === 'active' ? (
                  <span className="material-symbols-outlined text-[14px]">sync</span>
                ) : (
                  stage.step
                )}
              </div>
              <span className={`text-[9px] text-center leading-tight font-semibold tracking-tight ${
                stage.status === 'done' ? 'text-secondary' :
                stage.status === 'active' ? 'text-primary' : 'text-on-surface-variant/40'
              }`}>
                {stage.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Thinking log */}
      {showThinkingLog && (
        <motion.div variants={itemVariants} className="glass-card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-primary/[0.08] flex items-center justify-between">
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              Agent Thinking Log
            </div>
            <button
              onClick={() => setShowThinkingLog(false)}
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <div className="bg-black/40 p-4 font-mono text-[11px] space-y-1">
            {THINKING_LOG.map((line, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-on-surface-variant/40 shrink-0">[{line.ts}]</span>
                <span className={line.agent === 'CRDO' ? 'text-[#ff9fe3] shrink-0' : 'text-[#cacafe] shrink-0'}>
                  {line.agent}:
                </span>
                <span className="text-on-surface-variant">{line.msg}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Product Nomination Cards */}
      <motion.div variants={itemVariants}>
        <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary mb-4">
          Product Nominations
        </div>
        <div className="grid grid-cols-2 gap-5">
          {nominations.map((product) => (
            <motion.div key={product.id} variants={itemVariants} className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-black text-primary">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
                      Stage {product.stageNum}: {product.stage}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-primary">{product.signalIcon}</span>
                </div>
              </div>

              <div className="space-y-2.5 mb-5">
                {[
                  { label: 'Market Signal',  value: product.signal },
                  { label: 'Price Range',    value: product.priceRange },
                  { label: 'Proj. Margin',   value: `${product.margin}%`, highlight: true },
                  { label: 'Risk Level',     value: product.risk, color: RISK_COLOR[product.risk] },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase">
                      {row.label}
                    </span>
                    <span className={`text-sm font-semibold ${row.color || (row.highlight ? 'text-secondary' : 'text-on-surface-variant')}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAdvance(product.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary text-[12px] font-bold hover:bg-secondary/15 transition-all"
                >
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  Advance
                </button>
                <button
                  onClick={() => handleKill(product.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ff6e84]/[0.06] border border-[#ff6e84]/20 text-[#ff6e84] text-[12px] font-bold hover:bg-[#ff6e84]/10 transition-all"
                >
                  <span className="material-symbols-outlined text-[13px]">cancel</span>
                  Kill
                </button>
                <button
                  onClick={() => navigate('/council')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/[0.06] border border-purple-500/20 text-purple-400 text-[12px] font-bold hover:bg-purple-500/10 transition-all"
                >
                  <span className="material-symbols-outlined text-[13px]">groups</span>
                  Discuss
                </button>
                <button
                  onClick={async () => {
                    try {
                      await fetch(`/api/discovery/report/${product.id}`)
                    } catch { /* dev */ }
                    showToast(`Full report: ${product.name}`)
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-high/60 border border-primary/[0.08] text-on-surface-variant text-[12px] font-semibold hover:text-primary transition-all ml-auto"
                >
                  <span className="material-symbols-outlined text-[13px]">description</span>
                  Full Report
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
