import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAudioPlayer } from '@/data/audio-player'
import InfoIcon from '@/components/shared/InfoIcon'
import { api } from '@/lib/api'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from 'recharts'

// ─── Clock ────────────────────────────────────────────────────────────────────

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatClock(date: Date) {
  let h = date.getHours()
  const m = date.getMinutes()
  const s = date.getSeconds()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return {
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    colonVisible: s % 2 === 0,
    ampm,
  }
}

// Animated SVG icons for each time of day
function NightIcon({ size }: { size: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none"
      animate={{ rotate: [0, 6, -4, 2, 0], y: [0, -4, 2, -2, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Moon crescent */}
      <motion.path
        d="M50 12C36 12 24 24 24 38s12 26 26 26c6 0 11.5-2 16-5.4C60.4 63 53 66 45 66 28.4 66 15 52.6 15 36S28.4 6 45 6c3.5 0 6.8.5 10 1.5C52.6 9 50.8 10.4 50 12z"
        fill="#e6e6fa"
        opacity={0.8}
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Stars */}
      {[[62, 14, 2.5], [70, 28, 1.8], [58, 50, 2], [72, 46, 1.5], [66, 62, 2.2]].map(([cx, cy, r], i) => (
        <motion.circle key={i} cx={cx} cy={cy} r={r} fill="#e6e6fa"
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      ))}
    </motion.svg>
  )
}

function SunriseIcon({ size }: { size: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none"
      animate={{ y: [0, -3, 1, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Horizon line */}
      <line x1="8" y1="52" x2="72" y2="52" stroke="#fbbf24" strokeWidth="1.5" opacity={0.4} />
      {/* Sun rising */}
      <motion.circle cx="40" cy="48" r="14" fill="#fbbf24" opacity={0.7}
        animate={{ cy: [50, 44, 50], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Rays */}
      {[0, 45, 90, 135, 180].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const x1 = 40 + Math.cos(rad) * 20
        const y1 = 48 + Math.sin(rad) * -20
        const x2 = 40 + Math.cos(rad) * 28
        const y2 = 48 + Math.sin(rad) * -28
        return (
          <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          />
        )
      })}
      {/* Ground glow */}
      <motion.ellipse cx="40" cy="56" rx="30" ry="6" fill="#fbbf24"
        animate={{ opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  )
}

function SunIcon({ size }: { size: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none"
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
    >
      {/* Core */}
      <circle cx="40" cy="40" r="14" fill="#93c5fd" opacity={0.6} />
      <motion.circle cx="40" cy="40" r="14" fill="#93c5fd"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Rays */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180
        return (
          <motion.line key={i}
            x1={40 + Math.cos(angle) * 20} y1={40 + Math.sin(angle) * 20}
            x2={40 + Math.cos(angle) * 28} y2={40 + Math.sin(angle) * 28}
            stroke="#93c5fd" strokeWidth="2" strokeLinecap="round"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
          />
        )
      })}
    </motion.svg>
  )
}

function SunsetIcon({ size }: { size: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 80 80" fill="none"
      animate={{ y: [0, 2, -1, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Horizon */}
      <line x1="8" y1="52" x2="72" y2="52" stroke="#f97316" strokeWidth="1.5" opacity={0.4} />
      {/* Sun sinking */}
      <motion.circle cx="40" cy="48" r="14" fill="#f97316" opacity={0.6}
        animate={{ cy: [46, 52, 46], opacity: [0.7, 0.4, 0.7] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Warm rays upward */}
      {[0, 36, 72, 108, 144, 180].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        return (
          <motion.line key={i}
            x1={40 + Math.cos(rad) * 18} y1={48 - Math.sin(rad) * 18}
            x2={40 + Math.cos(rad) * 26} y2={48 - Math.sin(rad) * 26}
            stroke="#ff9fe3" strokeWidth="1.5" strokeLinecap="round"
            animate={{ opacity: [0.15, 0.5, 0.15] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
          />
        )
      })}
      {/* Ground glow */}
      <motion.ellipse cx="40" cy="56" rx="30" ry="6" fill="#f97316"
        animate={{ opacity: [0.06, 0.14, 0.06] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  )
}

function TimeOfDayIcon({ hour, size }: { hour: number; size: number }) {
  if (hour >= 5 && hour < 12) return <SunriseIcon size={size} />
  if (hour >= 12 && hour < 17) return <SunIcon size={size} />
  if (hour >= 17 && hour < 21) return <SunsetIcon size={size} />
  return <NightIcon size={size} />
}

function getTimeOfDayGlow(h: number): string {
  if (h >= 5 && h < 12) return 'radial-gradient(ellipse at 80% 50%, rgba(251,191,36,0.12) 0%, transparent 70%)'
  if (h >= 12 && h < 17) return 'radial-gradient(ellipse at 80% 50%, rgba(147,197,253,0.10) 0%, transparent 70%)'
  if (h >= 17 && h < 21) return 'radial-gradient(ellipse at 80% 50%, rgba(249,115,22,0.12) 0%, transparent 70%)'
  return 'radial-gradient(ellipse at 80% 50%, rgba(100,80,180,0.12) 0%, transparent 70%)'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 21) return 'Good evening'
  return 'Good night'
}

function getDateString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Riyadh',
  })
}

// ─── Fallback data (shown while loading or when backend is offline) ──────────

const FALLBACK_SUMMARY = {
  userName: 'Moe',
  yesterday: { orders: 0, revenue: 0 },
  mtd: { revenue: 0 },
}

const FALLBACK_METRICS = {
  todayActual: 0,
  monthlyTarget: 0,
  mtdRevenue: 0,
  monthlyForecast: 0,
  forecastAccuracy: 0,
  hasTargetSet: false,
}

const FALLBACK_ALERTS: { id: string; type: string; title: string; severity: string }[] = []

const FALLBACK_REVENUE_7D: { day: string; value: number }[] = []
const FALLBACK_ORDERS_7D: { day: string; value: number }[] = []

const FALLBACK_TOP_PRODUCT = { name: '—', revenueShare: 0 }

const FALLBACK_TOP_SELLING: { name: string; units: number; revenue: number; trend: 'up' | 'down' | 'flat' }[] = []

const FALLBACK_INVENTORY_ALERTS: { sku: string; product: string; stock: number; threshold: number; severity: 'critical' | 'warning' | 'ok' }[] = []

const FALLBACK_MILESTONES: { date: string; title: string; type: string; daysAway: number }[] = []

const FALLBACK_AGENTS: { id: string; name: string; status: 'running' | 'idle' | 'error'; lastActivity: string }[] = []

const CADENCES = [
  { key: 'daily', label: 'Yesterday' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'quarterly', label: 'This Quarter' },
] as const

type ActionPriority = 'urgent' | 'medium' | 'low'


const PRIORITY_BORDER: Record<ActionPriority, string> = {
  urgent: 'border-l-red-500',
  medium: 'border-l-amber-400',
  low: 'border-l-on-surface-variant/30',
}

const PRIORITY_BADGE: Record<ActionPriority, string> = {
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  low: 'bg-surface-container-high text-on-surface-variant border-primary/[0.06]',
}

type AgentStatus = 'running' | 'idle' | 'error'

const STATUS_DOT_CLASS: Record<AgentStatus, string> = {
  running: 'bg-secondary animate-pulse',
  idle: 'bg-on-surface-variant/30',
  error: 'bg-error animate-pulse',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SparkBars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  return (
    <div className="flex items-end gap-[2px] h-8 mt-4">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${(v / max) * 100}%`,
            background: i === data.length - 1 ? color : `${color}38`,
            boxShadow: i === data.length - 1 ? `0 0 8px ${color}` : 'none',
          }}
        />
      ))}
    </div>
  )
}

function SectionHeader({ children, info }: { children: React.ReactNode; info?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary">{children}</div>
      {info && <InfoIcon text={info} />}
    </div>
  )
}

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

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const audioPlayer = useAudioPlayer()
  const [generatingAudio, setGeneratingAudio] = useState<string | null>(null)
  const [dismissedActions, setDismissedActions] = useState<Set<string>>(new Set())

  // ─── API state ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [backendOffline, setBackendOffline] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summaryData, setSummaryData] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [actionItemsData, setActionItemsData] = useState<any>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      const [summary, actions] = await Promise.all([
        api.dashboard.summary(),
        api.dashboard.actionItems(),
      ])
      setSummaryData(summary)
      setActionItemsData(actions)
      setBackendOffline(false)
    } catch {
      setBackendOffline(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  // ─── Derive display data from API response or fallbacks ─────────────────
  const s = summaryData || {}
  const SUMMARY = {
    userName: s.userName ?? FALLBACK_SUMMARY.userName,
    yesterday: s.yesterday ?? FALLBACK_SUMMARY.yesterday,
    mtd: s.mtd ?? FALLBACK_SUMMARY.mtd,
  }
  const METRICS = {
    todayActual: s.todayActual ?? FALLBACK_METRICS.todayActual,
    monthlyTarget: s.monthlyTarget ?? FALLBACK_METRICS.monthlyTarget,
    mtdRevenue: s.mtdRevenue ?? s.mtd?.revenue ?? FALLBACK_METRICS.mtdRevenue,
    monthlyForecast: s.monthlyForecast ?? FALLBACK_METRICS.monthlyForecast,
    forecastAccuracy: s.forecastAccuracy ?? FALLBACK_METRICS.forecastAccuracy,
    hasTargetSet: s.monthlyTarget != null && s.monthlyTarget > 0,
  }
  const ALERTS: { id: string; type: string; title: string; severity: string }[] = s.alerts ?? FALLBACK_ALERTS
  const REVENUE_7D: { day: string; value: number }[] = s.revenue7d ?? FALLBACK_REVENUE_7D
  const ORDERS_7D: { day: string; value: number }[] = s.orders7d ?? FALLBACK_ORDERS_7D
  const TOP_PRODUCT = s.topProduct ?? FALLBACK_TOP_PRODUCT
  const TOP_SELLING: { name: string; units: number; revenue: number; trend: 'up' | 'down' | 'flat' }[] = s.topSelling ?? FALLBACK_TOP_SELLING
  const INVENTORY_ALERTS: { sku: string; product: string; stock: number; threshold: number; severity: 'critical' | 'warning' | 'ok' }[] = s.inventoryAlerts ?? FALLBACK_INVENTORY_ALERTS
  const MILESTONES: { date: string; title: string; type: string; daysAway: number }[] = s.milestones ?? FALLBACK_MILESTONES
  const AGENTS: { id: string; name: string; status: 'running' | 'idle' | 'error'; lastActivity: string }[] = s.agents ?? FALLBACK_AGENTS

  const a = actionItemsData || {}
  const ACTION_ITEMS: {
    id: string; icon: string; title: string; description: string;
    priority: ActionPriority; age: string;
    action: { label: string; route: string | null };
  }[] = a.items ?? a ?? []

  const clockDate = useClock()
  const clock = formatClock(clockDate)
  const currentHour = clockDate.getHours()
  const glow = getTimeOfDayGlow(currentHour)
  const greeting = getGreeting()
  const dateStr = getDateString()
  const mtdProgress = METRICS.monthlyTarget > 0 ? Math.round((METRICS.mtdRevenue / METRICS.monthlyTarget) * 100) : 0
  const forecastProgress = METRICS.monthlyTarget > 0 ? Math.round((METRICS.monthlyForecast / METRICS.monthlyTarget) * 100) : 0
  const activeAgentCount = AGENTS.filter((a) => a.status === 'running').length
  const tasksInProgress = s.tasksInProgress ?? 0
  const pendingApprovalsCount = ALERTS.filter((a) => a.type === 'gate').length

  const CADENCE_LABELS: Record<string, string> = {
    daily: 'Yesterday Summary',
    weekly: 'This Week Summary',
    monthly: 'This Month Summary',
    quarterly: 'This Quarter Summary',
  }

  async function handleAudio(cadence: string) {
    if (audioPlayer.playing && audioPlayer.track?.title === CADENCE_LABELS[cadence]) {
      audioPlayer.pause()
      return
    }
    setGeneratingAudio(cadence)
    try {
      await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cadence }),
      })
    } catch {
      // dev: no backend yet
    }
    setGeneratingAudio(null)
    audioPlayer.play({
      title: CADENCE_LABELS[cadence] ?? cadence,
      subtitle: 'ALMO Business · AI Generated',
      duration: cadence === 'daily' ? '1:15' : cadence === 'weekly' ? '2:30' : cadence === 'monthly' ? '3:45' : '5:00',
    })
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-10 pb-16"
    >
      {/* ── Backend offline banner ──────────────────────────────────────── */}
      {backendOffline && (
        <motion.div variants={itemVariants}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-400/30 bg-amber-400/[0.05] backdrop-blur-xl"
        >
          <span className="material-symbols-outlined text-[16px] text-amber-400">cloud_off</span>
          <span className="text-[11px] font-bold tracking-[0.1em] text-amber-400 uppercase">
            Backend offline — showing cached data
          </span>
        </motion.div>
      )}

      {/* ── Loading skeleton ───────────────────────────────────────────── */}
      {loading && (
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="glass-card p-8 animate-pulse">
            <div className="h-4 w-32 bg-primary/10 rounded mb-4" />
            <div className="h-12 w-80 bg-primary/10 rounded mb-3" />
            <div className="h-4 w-64 bg-primary/10 rounded" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-3 w-20 bg-primary/10 rounded mb-3" />
                <div className="h-8 w-24 bg-primary/10 rounded mb-2" />
                <div className="h-3 w-16 bg-primary/10 rounded" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── 1. Greeting + Overnight Summary ─────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass-card p-8 relative overflow-hidden">

        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: glow }}
        />

        {/* Dim clock + icon background layer */}
        <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-end pr-8 gap-5">
          {/* Clock digits */}
          <div className="flex items-center" style={{ opacity: 0.06 }}>
            <span className="font-mono font-black text-primary leading-none" style={{ fontSize: 110 }}>
              {clock.hours}
            </span>
            <span
              className="font-mono font-black text-primary leading-none"
              style={{ fontSize: 110, opacity: clock.colonVisible ? 1 : 0, transition: 'opacity 0.15s' }}
            >
              :
            </span>
            <span className="font-mono font-black text-primary leading-none" style={{ fontSize: 110 }}>
              {clock.minutes}
            </span>
            <span className="font-mono font-bold text-primary leading-none ml-2 self-start mt-4" style={{ fontSize: 24 }}>
              {clock.ampm}
            </span>
          </div>
          {/* Animated time-of-day icon */}
          <div style={{ opacity: 0.18 }}>
            <TimeOfDayIcon hour={currentHour} size={120} />
          </div>
        </div>

        {/* Foreground content */}
        <div className="relative z-10">
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-4">
          {dateStr}
        </div>
        <h1 className="text-5xl font-black text-primary text-glow leading-tight">
          {greeting}, {SUMMARY.userName}.
        </h1>
        <p className="text-base text-on-surface-variant mt-3 leading-relaxed" data-speakable="true">
          Yesterday:{' '}
          <span className="text-primary font-semibold">
            {SUMMARY.yesterday.orders} orders
          </span>{' '}
          ({SUMMARY.yesterday.revenue.toLocaleString()} SAR).{' '}
          Month-to-date:{' '}
          <span className="text-primary font-semibold">
            {SUMMARY.mtd.revenue.toLocaleString()} SAR
          </span>
          .
        </p>
        <div className="flex flex-wrap gap-2 mt-6">
          {CADENCES.map((c) => {
            const isGenerating = generatingAudio === c.key
            const isPlaying = audioPlayer.playing && audioPlayer.track?.title === CADENCE_LABELS[c.key]
            return (
              <button
                key={c.key}
                onClick={() => handleAudio(c.key)}
                className={[
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                  isPlaying
                    ? 'bg-secondary/20 text-secondary border border-secondary/30'
                    : 'bg-surface-container-high border border-primary/[0.08] text-on-surface-variant hover:text-primary hover:border-primary/20',
                ].join(' ')}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isGenerating ? 'hourglass_empty' : isPlaying ? 'pause' : 'play_arrow'}
                </span>
                {isGenerating ? 'Generating...' : c.label}
              </button>
            )
          })}
        </div>
        </div>{/* end foreground */}
      </motion.div>

      {/* ── 2. Business Metric Cards ─────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SectionHeader>Business Health</SectionHeader>
        <div className="grid grid-cols-4 gap-4">
          {/* Today Actual */}
          <motion.div
            variants={itemVariants}
            className="glass-card p-6 cursor-pointer hover:border-primary/20 transition-all"
            onClick={() => navigate('/sales')}
          >
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              Today Actual
            </div>
            <div className="text-3xl font-black text-primary mt-3">
              {METRICS.todayActual.toLocaleString()} SAR
            </div>
            <div className="text-[11px] text-on-surface-variant mt-1">
              vs. {SUMMARY.yesterday.revenue.toLocaleString()} SAR yesterday
            </div>
            <SparkBars data={[5, 8, 3, 11, 7, 12, 0]} color="#e6e6fa" />
          </motion.div>

          {/* Monthly Target */}
          <motion.div
            variants={itemVariants}
            className="glass-card p-6 cursor-pointer hover:border-primary/20 transition-all"
            onClick={() => navigate('/goals')}
          >
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              Monthly Target
            </div>
            {METRICS.hasTargetSet ? (
              <>
                <div className="text-3xl font-black text-primary mt-3">{mtdProgress}%</div>
                <div className="text-[11px] text-on-surface-variant mt-1 mb-3">
                  {METRICS.mtdRevenue.toLocaleString()} / {METRICS.monthlyTarget.toLocaleString()} SAR
                </div>
                <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all"
                    style={{
                      width: `${Math.min(mtdProgress, 100)}%`,
                      boxShadow: '0 0 8px #cacafe',
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="mt-3 text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/settings')
                  }}
                  className="text-secondary hover:text-primary transition-colors underline underline-offset-2"
                >
                  Set your monthly target → Settings
                </button>
              </div>
            )}
          </motion.div>

          {/* Monthly Forecast */}
          <motion.div
            variants={itemVariants}
            className="glass-card p-6 cursor-pointer hover:border-primary/20 transition-all"
            onClick={() => navigate('/sales')}
          >
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              Monthly Forecast
            </div>
            <div className="text-3xl font-black text-primary mt-3">
              {METRICS.monthlyForecast.toLocaleString()} SAR
            </div>
            <div className="text-[11px] text-on-surface-variant mt-1 mb-3">
              {forecastProgress}% of target
            </div>
            <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(forecastProgress, 100)}%`,
                  background: forecastProgress >= 80 ? '#cacafe' : '#ff9fe3',
                  boxShadow: `0 0 8px ${forecastProgress >= 80 ? '#cacafe' : '#ff9fe3'}`,
                }}
              />
            </div>
          </motion.div>

          {/* Forecast Accuracy */}
          <motion.div
            variants={itemVariants}
            className="glass-card p-6 cursor-pointer hover:border-primary/20 transition-all"
            onClick={() => navigate('/bi')}
          >
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              Forecast Accuracy
            </div>
            <div className="text-3xl font-black text-primary mt-3">
              {METRICS.forecastAccuracy}%
            </div>
            <div className="text-[11px] text-on-surface-variant mt-1">last 30 days</div>
            <SparkBars data={[82, 85, 79, 88, 91, 84, 87]} color="#cacafe" />
          </motion.div>
        </div>
      </motion.div>

      {/* ── 3. Critical Alerts (conditional) ────────────────────────────── */}
      {ALERTS.length > 0 && (
        <motion.div variants={itemVariants}>
          <SectionHeader>Critical Alerts</SectionHeader>
          <div className="space-y-3">
            {ALERTS.map((alert) => (
              <div
                key={alert.id}
                className={[
                  'flex items-center justify-between px-5 py-4 rounded-2xl border backdrop-blur-xl',
                  alert.severity === 'error'
                    ? 'bg-error/[0.05] border-error/30'
                    : 'bg-yellow-500/[0.05] border-yellow-500/30',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      'material-symbols-outlined text-[18px]',
                      alert.severity === 'error' ? 'text-error' : 'text-yellow-400',
                    ].join(' ')}
                  >
                    {alert.type === 'gate' ? 'approval' : 'warning'}
                  </span>
                  <span className="text-sm text-on-surface">{alert.title}</span>
                </div>
                {alert.type === 'gate' && (
                  <button
                    onClick={() => navigate('/approvals')}
                    className="flex items-center gap-1 text-[11px] font-bold tracking-[0.1em] text-secondary hover:text-primary transition-colors shrink-0 ml-4"
                  >
                    Review
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── 3b. Needs Your Attention ──────────────────────────────────── */}
      {ACTION_ITEMS.filter((a) => !dismissedActions.has(a.id)).length > 0 && (
        <motion.div variants={itemVariants}>
          <SectionHeader info="Items only you can unblock. Complete these to keep ALMO OS running at full capacity.">
            Needs Your Attention
          </SectionHeader>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {ACTION_ITEMS.filter((a) => !dismissedActions.has(a.id)).map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
                  className={[
                    'flex items-center gap-4 px-5 py-4 rounded-2xl border border-primary/[0.08] backdrop-blur-xl bg-surface-container-high/60 border-l-[3px]',
                    PRIORITY_BORDER[item.priority],
                  ].join(' ')}
                >
                  {/* Icon */}
                  <span className="text-lg shrink-0">{item.icon}</span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">{item.title}</span>
                      <span className={[
                        'text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border',
                        PRIORITY_BADGE[item.priority],
                      ].join(' ')}>
                        {item.priority}
                      </span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">{item.description}</div>
                  </div>

                  {/* Age */}
                  <span className="text-[10px] text-on-surface-variant/60 shrink-0">{item.age}</span>

                  {/* Action button */}
                  {item.action.route ? (
                    <button
                      onClick={() => navigate(item.action.route!)}
                      className="flex items-center gap-1 text-[11px] font-bold tracking-[0.1em] text-secondary hover:text-primary transition-colors shrink-0 whitespace-nowrap"
                    >
                      {item.action.label}
                    </button>
                  ) : (
                    <button
                      onClick={() => setDismissedActions((prev) => new Set(prev).add(item.id))}
                      className="flex items-center gap-1 text-[11px] font-bold tracking-[0.1em] text-secondary hover:text-primary transition-colors shrink-0 whitespace-nowrap"
                    >
                      {item.action.label}
                    </button>
                  )}

                  {/* Dismiss (×) */}
                  <button
                    onClick={() => setDismissedActions((prev) => new Set(prev).add(item.id))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 transition-all shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── 4. Business Trends ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SectionHeader>Business Trends</SectionHeader>
        <div className="grid grid-cols-3 gap-4">
          {/* Revenue 7-day */}
          <div className="glass-card p-6">
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              Revenue (7-Day)
            </div>
            <div className="text-xl font-black text-primary mt-2 mb-4">19,400 SAR</div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_7D} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#cacafe" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#cacafe" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" hide />
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
                    fill="url(#revGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#e6e6fa', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders 7-day */}
          <div className="glass-card p-6">
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              Orders (7-Day)
            </div>
            <div className="text-xl font-black text-primary mt-2 mb-4">47 orders</div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ORDERS_7D} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff9fe3" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ff9fe3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" hide />
                  <RechartsTooltip
                    contentStyle={{
                      background: 'rgba(31,31,35,0.92)',
                      border: '1px solid rgba(230,230,250,0.08)',
                      borderRadius: 8,
                      fontSize: 11,
                      color: '#e6e6fa',
                      padding: '6px 10px',
                    }}
                    formatter={(v: unknown) => [`${v as number} orders`, '']}
                    labelStyle={{ color: '#acaaae', marginBottom: 2 }}
                    cursor={{ stroke: 'rgba(230,230,250,0.1)', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#ff9fe3"
                    strokeWidth={2}
                    fill="url(#ordGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#ff9fe3', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Product */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
                Top Product
              </div>
              <div className="text-xl font-black text-primary mt-2">{TOP_PRODUCT.name}</div>
              <div className="text-[11px] text-on-surface-variant mt-1">
                {TOP_PRODUCT.revenueShare}% of revenue
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-[10px] text-on-surface-variant mb-1.5">
                <span>Revenue share</span>
                <span>{TOP_PRODUCT.revenueShare}%</span>
              </div>
              <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${TOP_PRODUCT.revenueShare}%`,
                    boxShadow: '0 0 8px #e6e6fa',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 5. At-a-Glance — Business Updates ─────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SectionHeader>At-a-Glance — Business Updates</SectionHeader>
        <div className="grid grid-cols-3 gap-4">

          {/* Top Selling Products */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px] text-secondary">local_fire_department</span>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Top Selling</div>
            </div>
            <div className="space-y-3">
              {TOP_SELLING.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-on-surface-variant/40 w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-primary truncate">{p.name}</div>
                    <div className="text-[10px] text-on-surface-variant">
                      {p.units} units · {p.revenue.toLocaleString()} SAR
                    </div>
                  </div>
                  <span className={[
                    'material-symbols-outlined text-[14px]',
                    p.trend === 'up' ? 'text-green-400' : p.trend === 'down' ? 'text-error' : 'text-on-surface-variant/40',
                  ].join(' ')}>
                    {p.trend === 'up' ? 'trending_up' : p.trend === 'down' ? 'trending_down' : 'trending_flat'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px] text-tertiary">inventory_2</span>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Inventory Alerts</div>
            </div>
            <div className="space-y-3">
              {INVENTORY_ALERTS.map((item) => (
                <div key={item.sku} className="flex items-center gap-3">
                  <span className={[
                    'w-2 h-2 rounded-full shrink-0',
                    item.severity === 'critical' ? 'bg-error animate-pulse' : item.severity === 'warning' ? 'bg-yellow-400' : 'bg-green-400/60',
                  ].join(' ')} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-primary truncate">{item.product}</div>
                    <div className="text-[10px] text-on-surface-variant">
                      {item.stock} left · reorder at {item.threshold}
                    </div>
                  </div>
                  <div className={[
                    'text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border shrink-0',
                    item.severity === 'critical'
                      ? 'bg-error/10 text-error border-error/20'
                      : item.severity === 'warning'
                        ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                        : 'bg-green-400/10 text-green-400 border-green-400/20',
                  ].join(' ')}>
                    {item.severity === 'critical' ? 'Low' : item.severity === 'warning' ? 'Watch' : 'OK'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px] text-primary">flag</span>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Upcoming Milestones</div>
            </div>
            <div className="space-y-3">
              {MILESTONES.map((m) => (
                <div key={m.title} className="flex items-start gap-3">
                  <div className="text-[11px] font-bold text-on-surface-variant/60 w-12 shrink-0 pt-0.5">{m.date}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-primary truncate">{m.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={[
                        'text-[9px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded',
                        m.type === 'marketing' ? 'bg-tertiary/15 text-tertiary'
                          : m.type === 'b2b' ? 'bg-secondary/15 text-secondary'
                          : m.type === 'finance' ? 'bg-yellow-400/15 text-yellow-400'
                          : 'bg-primary/10 text-primary/70',
                      ].join(' ')}>
                        {m.type}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        {m.daysAway === 1 ? 'tomorrow' : `in ${m.daysAway} days`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </motion.div>

      {/* ── 6. Agent Activity ────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SectionHeader>Agent Activity</SectionHeader>
        <div className="glass-card p-6">
          <p className="text-sm text-on-surface-variant mb-5">
            <span className="text-primary font-semibold">{activeAgentCount} agents active</span>
            {' · '}
            <span>{tasksInProgress} tasks in progress</span>
            {' · '}
            <span>{pendingApprovalsCount} pending approvals</span>
          </p>
          <div className="space-y-1">
            {AGENTS.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-primary/[0.03] transition-all"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_CLASS[agent.status]}`}
                />
                <button
                  onClick={() => navigate(`/org?agent=${agent.id}`)}
                  className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {agent.name}
                </button>
                <span
                  className={[
                    'text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border',
                    agent.status === 'running'
                      ? 'bg-secondary/10 text-secondary border-secondary/20'
                      : agent.status === 'error'
                        ? 'bg-error/10 text-error border-error/20'
                        : 'bg-surface-container-high text-on-surface-variant border-primary/[0.06]',
                  ].join(' ')}
                >
                  {agent.status}
                </span>
                <span className="ml-auto text-[11px] text-on-surface-variant">
                  {agent.lastActivity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
