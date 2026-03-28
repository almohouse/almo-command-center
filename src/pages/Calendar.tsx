import { useState } from 'react'
import { motion } from 'motion/react'
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

// ─── Types ────────────────────────────────────────────────────────────────────

type DotType = 'heartbeat' | 'success' | 'warning' | 'error'

interface DayDots {
  [day: number]: DotType[]
}

interface RecurringJob {
  id: string
  name: string
  schedule: string
  agent: string
  runsToday: number
  status: 'ok' | 'warning' | 'error'
  lastRuns: string[]
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MARCH_DAYS = 31

// Build dots: every day gets blue heartbeat; green on 7,14,21; yellow on 10; red on 15
function buildDots(): DayDots {
  const dots: DayDots = {}
  for (let d = 1; d <= MARCH_DAYS; d++) {
    dots[d] = ['heartbeat']
    if (d === 7 || d === 14 || d === 21) dots[d].push('success')
    if (d === 10) dots[d].push('warning')
    if (d === 15) dots[d].push('error')
  }
  return dots
}

const DAY_DOTS = buildDots()

const DOT_COLORS: Record<DotType, string> = {
  heartbeat: 'bg-blue-400',
  success: 'bg-green-400',
  warning: 'bg-amber-400',
  error: 'bg-error',
}

const RECURRING_JOBS: RecurringJob[] = [
  {
    id: 'memory-janitor',
    name: 'Memory Janitor',
    schedule: 'Every 5 min',
    agent: 'CTO',
    runsToday: 288,
    status: 'ok',
    lastRuns: [
      '2026-03-27 23:55:01',
      '2026-03-27 23:50:00',
      '2026-03-27 23:45:02',
      '2026-03-27 23:40:01',
      '2026-03-27 23:35:00',
    ],
  },
  {
    id: 'security-sentinel',
    name: 'Security Sentinel',
    schedule: 'Every 5 min',
    agent: 'CTO',
    runsToday: 287,
    status: 'ok',
    lastRuns: [
      '2026-03-27 23:54:58',
      '2026-03-27 23:49:59',
      '2026-03-27 23:44:57',
      '2026-03-27 23:39:58',
      '2026-03-27 23:34:57',
    ],
  },
  {
    id: 'task-health',
    name: 'Task Health Monitor',
    schedule: 'Every 2 min',
    agent: 'DCEO',
    runsToday: 720,
    status: 'ok',
    lastRuns: [
      '2026-03-27 23:58:03',
      '2026-03-27 23:56:02',
      '2026-03-27 23:54:01',
      '2026-03-27 23:52:00',
      '2026-03-27 23:50:01',
    ],
  },
  {
    id: 'dceo-heartbeat',
    name: 'DCEO Heartbeat',
    schedule: 'Interval',
    agent: 'DCEO',
    runsToday: 2,
    status: 'ok',
    lastRuns: [
      '2026-03-27 12:00:05',
      '2026-03-27 09:00:03',
    ],
  },
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const AGENTS = ['CTO', 'DCEO', 'CFO', 'CMO', 'Scout']
const SCHEDULE_OPTIONS = [
  'Every 5 min',
  'Every hour',
  'Daily at 9am',
  'Weekly Monday 9am',
  'Custom cron',
]

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary mb-4">
      {children}
    </div>
  )
}

// ─── Calendar Page ────────────────────────────────────────────────────────────

export default function Calendar() {
  // Month offset: 0 = March 2026 (index 2), base year 2026
  const BASE_YEAR = 2026
  const BASE_MONTH = 2 // March = index 2
  const [monthOffset, setMonthOffset] = useState(0)
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    agent: 'CTO',
    schedule: 'Every 5 min',
    description: '',
  })

  const displayMonthIndex = (BASE_MONTH + monthOffset + 12) % 12
  const displayYear = BASE_YEAR + Math.floor((BASE_MONTH + monthOffset) / 12)
  const displayMonthName = MONTHS[displayMonthIndex]

  // Compute first day of week and days in month for the displayed month
  const firstDay = new Date(displayYear, displayMonthIndex, 1).getDay() // 0=Sun
  const daysInMonth = new Date(displayYear, displayMonthIndex + 1, 0).getDate()

  // For March 2026 specifically use our precomputed data
  const isMarch2026 = monthOffset === 0
  const calendarCells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)
  // Pad to complete last row
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)

  function handleCreateRoutine() {
    if (!newRoutine.name.trim()) return
    fetch('/api/routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRoutine),
    }).catch(() => {})
    setNewRoutine({ name: '', agent: 'CTO', schedule: 'Every 5 min', description: '' })
    setShowCreateForm(false)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-16"
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
            Operations
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-primary text-glow">Calendar</h1>
            <InfoIcon text="View and manage scheduled routines and cron jobs. Color dots show event types." />
          </div>
          <p className="text-sm text-on-surface-variant mt-2">Scheduled jobs and system routines</p>
        </div>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary font-semibold hover:bg-secondary/20 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Create Routine
        </button>
      </motion.div>

      {/* ── Create Routine Form ───────────────────────────────────────────── */}
      {showCreateForm && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="glass-card p-6"
        >
          <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-4">New Routine</div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-1.5">Name</label>
              <input
                type="text"
                placeholder="e.g. Daily Digest"
                value={newRoutine.name}
                onChange={(e) => setNewRoutine((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-1.5">Agent</label>
              <select
                value={newRoutine.agent}
                onChange={(e) => setNewRoutine((p) => ({ ...p, agent: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface focus:border-primary/30 focus:outline-none transition-all"
              >
                {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-1.5">Schedule</label>
              <select
                value={newRoutine.schedule}
                onChange={(e) => setNewRoutine((p) => ({ ...p, schedule: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface focus:border-primary/30 focus:outline-none transition-all"
              >
                {SCHEDULE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-1.5">Description</label>
              <input
                type="text"
                placeholder="Brief description"
                value={newRoutine.description}
                onChange={(e) => setNewRoutine((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreateRoutine}
              className="px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold hover:bg-primary/20 transition-all"
            >
              Create Routine
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-primary transition-all text-sm"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Calendar Grid ─────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setMonthOffset((v) => v - 1)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-on-surface-variant hover:text-primary hover:bg-primary/[0.04] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            {MONTHS[(displayMonthIndex - 1 + 12) % 12].slice(0, 3)}
          </button>
          <div className="text-lg font-black text-primary">
            {displayMonthName} {displayYear}
          </div>
          <button
            onClick={() => setMonthOffset((v) => v + 1)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-on-surface-variant hover:text-primary hover:bg-primary/[0.04] transition-all"
          >
            {MONTHS[(displayMonthIndex + 1) % 12].slice(0, 3)}
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-[10px] font-bold tracking-[0.15em] text-on-surface-variant uppercase py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-14 rounded-xl" />
            }
            const today = day === 27 && isMarch2026
            const dots = isMarch2026 ? (DAY_DOTS[day] ?? []) : ['heartbeat' as DotType]
            return (
              <div
                key={day}
                className={[
                  'h-14 rounded-xl flex flex-col items-center justify-start pt-2 gap-1 transition-all cursor-default',
                  today
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-primary/[0.03] border border-transparent',
                ].join(' ')}
              >
                <span className={`text-[13px] font-bold ${today ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {day}
                </span>
                <div className="flex gap-[3px] flex-wrap justify-center">
                  {dots.slice(0, 4).map((dotType, di) => (
                    <span
                      key={di}
                      className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[dotType]}`}
                      title={dotType}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-5 pt-4 border-t border-primary/[0.06] flex-wrap">
          {(Object.entries(DOT_COLORS) as [DotType, string][]).map(([type, cls]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cls}`} />
              <span className="text-[11px] text-on-surface-variant capitalize">{type}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Recurring Jobs ────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SectionHeader>Recurring Jobs</SectionHeader>
        <div className="space-y-3">
          {RECURRING_JOBS.map((job) => {
            const isExpanded = expandedJob === job.id
            return (
              <div key={job.id} className="glass-card overflow-hidden">
                <button
                  onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-primary/[0.02] transition-all"
                >
                  {/* Status dot */}
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${job.status === 'ok' ? 'bg-green-400 animate-pulse' : job.status === 'warning' ? 'bg-amber-400' : 'bg-error animate-pulse'}`}
                  />

                  {/* Name + schedule */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-primary">{job.name}</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      {job.schedule} · Agent: {job.agent}
                    </div>
                  </div>

                  {/* Runs today */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-primary">{job.runsToday.toLocaleString()}</div>
                    <div className="text-[10px] text-on-surface-variant">runs today</div>
                  </div>

                  {/* Status badge */}
                  <span className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                    job.status === 'ok'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : job.status === 'warning'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-error/10 text-error border-error/20'
                  }`}>
                    {job.status === 'ok' ? '✓ OK' : job.status === 'warning' ? '⚠ WARN' : '✗ ERR'}
                  </span>

                  {/* Expand chevron */}
                  <span className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {/* Expanded last runs */}
                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-primary/[0.06]">
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mt-3 mb-2">
                      Last {job.lastRuns.length} Runs
                    </div>
                    <div className="space-y-1.5">
                      {job.lastRuns.map((ts, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                          <span className="font-mono text-[11px] text-on-surface-variant">{ts}</span>
                          <span className="text-[10px] text-green-400 ml-auto">✓ success</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
