import { useState } from 'react'
import { motion } from 'motion/react'

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

const GATEWAY_LOGS = [
  { ts: '2026-03-26T07:15:32Z', level: 'INFO',  msg: 'Session started: DCEO · task_id=892' },
  { ts: '2026-03-26T07:15:45Z', level: 'INFO',  msg: 'Session ended: DCEO · 47 tokens · $0.002' },
  { ts: '2026-03-26T07:16:01Z', level: 'INFO',  msg: 'Session started: CTO · task_id=893' },
  { ts: '2026-03-26T07:16:15Z', level: 'WARN',  msg: 'Rate limit approaching: 80% of hourly quota' },
  { ts: '2026-03-26T07:16:22Z', level: 'INFO',  msg: 'Session ended: CTO · 1,243 tokens · $0.009' },
  { ts: '2026-03-26T07:17:05Z', level: 'ERROR', msg: 'Connection refused: ws://127.0.0.1:18789' },
  { ts: '2026-03-26T07:17:06Z', level: 'ERROR', msg: 'Retry 1 of 5 in 2s...' },
  { ts: '2026-03-26T07:17:08Z', level: 'INFO',  msg: 'Reconnecting to OpenClaw gateway...' },
  { ts: '2026-03-26T07:17:10Z', level: 'INFO',  msg: 'WebSocket connected: ws://127.0.0.1:18789' },
  { ts: '2026-03-26T07:18:00Z', level: 'INFO',  msg: 'Heartbeat: DCEO · idle' },
  { ts: '2026-03-26T07:18:05Z', level: 'INFO',  msg: 'Task dispatch: ALMO-094 → Scout' },
  { ts: '2026-03-26T07:18:30Z', level: 'INFO',  msg: 'Session started: Scout · task_id=894' },
]

const AGENT_ERRORS = [
  { agent: 'Scout', error: 'TikTok scraper timeout after 30s — rate limited by platform', ts: '07:22:14' },
  { agent: 'CTO',   error: 'GitHub API call failed: 401 Unauthorized — token may be expired', ts: '06:45:02' },
  { agent: 'CFO',   error: 'Airtable sync failed: API key missing in environment', ts: '04:11:39' },
]

const CRON_HISTORY = [
  { job: 'daily-briefing',    status: 'success', ran: '07:00:00', duration: '12s' },
  { job: 'airtable-sync',     status: 'failed',  ran: '06:00:00', duration: '4s' },
  { job: 'memory-janitor',    status: 'success', ran: '05:00:00', duration: '3s' },
  { job: 'order-fetcher',     status: 'success', ran: '04:00:00', duration: '8s' },
  { job: 'security-sentinel', status: 'success', ran: '03:00:00', duration: '2s' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function logLineColor(level: string) {
  if (level === 'ERROR') return 'text-[#ff6e84]'
  if (level === 'WARN')  return 'text-yellow-400'
  return 'text-[#acaaae]'
}

function levelBadgeClass(level: string) {
  if (level === 'ERROR') return 'text-[#ff6e84]'
  if (level === 'WARN')  return 'text-yellow-400'
  return 'text-[#cacafe]'
}

// ─── Logs Page ────────────────────────────────────────────────────────────────

export default function Logs() {
  const [activeTab, setActiveTab]     = useState<'gateway' | 'errors' | 'cron'>('gateway')
  const [lines, setLines]             = useState('100')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showDebug, setShowDebug]     = useState(false)

  const tabs = [
    { key: 'gateway', label: 'Gateway Logs' },
    { key: 'errors',  label: 'Agent Errors' },
    { key: 'cron',    label: 'Cron History' },
  ] as const

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
          System Logs
        </div>
        <h1 className="text-4xl font-black text-primary">Logs</h1>
        <p className="text-sm text-on-surface-variant mt-1">Real-time gateway, agent, and cron output</p>
      </motion.div>

      {/* Controls */}
      <motion.div variants={itemVariants} className="flex items-center gap-3 flex-wrap">
        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container-high/60 backdrop-blur-xl border border-primary/[0.08] rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={[
                'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
                activeTab === t.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:text-primary',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Lines select */}
          <select
            value={lines}
            onChange={(e) => setLines(e.target.value)}
            className="bg-surface-container-high/60 backdrop-blur-xl border border-primary/[0.08] text-on-surface-variant text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary/30"
          >
            {['50', '100', '200', '500'].map((n) => (
              <option key={n} value={n} className="bg-[#0e0e11]">Lines: {n}</option>
            ))}
          </select>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
              autoRefresh
                ? 'bg-secondary/10 text-secondary border-secondary/30'
                : 'bg-surface-container-high/60 text-on-surface-variant border-primary/[0.08]',
            ].join(' ')}
          >
            <span className="material-symbols-outlined text-[16px]">
              {autoRefresh ? 'sync' : 'sync_disabled'}
            </span>
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>

          {/* Debug button */}
          <button
            onClick={() => setShowDebug(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-surface-container-high/60 border border-primary/[0.08] text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">build</span>
            Debug
          </button>
        </div>
      </motion.div>

      {/* Terminal area */}
      <motion.div variants={itemVariants} className="glass-card p-0 overflow-hidden">
        <div className="bg-black/40 rounded-2xl p-4 font-mono text-[12px] min-h-[420px] space-y-0.5">
          {activeTab === 'gateway' && GATEWAY_LOGS.slice(0, Number(lines)).map((line, i) => (
            <div key={i} className={`flex gap-2 leading-6 ${logLineColor(line.level)}`}>
              <span className="text-[#acaaae]/50 shrink-0">{line.ts}</span>
              <span className={`shrink-0 font-bold w-[42px] ${levelBadgeClass(line.level)}`}>{line.level}</span>
              <span>{line.msg}</span>
            </div>
          ))}

          {activeTab === 'errors' && (
            <div className="space-y-4 pt-2">
              {AGENT_ERRORS.map((e, i) => (
                <div key={i} className="border border-[#ff6e84]/20 rounded-xl p-3 bg-[#ff6e84]/[0.03]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#ff6e84] font-bold">{e.agent}</span>
                    <span className="text-[#acaaae]/50">{e.ts}</span>
                  </div>
                  <div className="text-[#ff6e84]/80">{e.error}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'cron' && (
            <div className="space-y-2 pt-2">
              {CRON_HISTORY.map((c, i) => (
                <div key={i} className="flex items-center gap-4 py-2 border-b border-primary/[0.04] last:border-0">
                  <span className={c.status === 'success' ? 'text-secondary' : 'text-[#ff6e84]'}>
                    <span className="material-symbols-outlined text-[14px]">
                      {c.status === 'success' ? 'check_circle' : 'error'}
                    </span>
                  </span>
                  <span className="text-[#acaaae] flex-1">{c.job}</span>
                  <span className="text-[#acaaae]/50">{c.ran}</span>
                  <span className="text-[#acaaae]/50">{c.duration}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="px-4 py-2.5 border-t border-primary/[0.08] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-[11px] text-secondary font-mono">Connected to ws://127.0.0.1:18789</span>
        </div>
      </motion.div>

      {/* Debug panel overlay */}
      {showDebug && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowDebug(false)}>
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-[420px] h-full bg-surface-container-high/95 backdrop-blur-xl border-l border-primary/[0.08] p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary">
                Debug Agent Analysis
              </div>
              <button
                onClick={() => setShowDebug(false)}
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bg-black/40 rounded-xl p-4 font-mono text-[12px] space-y-2 text-[#acaaae]">
              <div className="text-[#ff6e84]">▶ Analyzing log stream...</div>
              <div className="text-secondary">✓ Parsed 12 log lines</div>
              <div className="text-[#ff6e84]">✗ 2 ERROR events detected</div>
              <div className="mt-3 text-primary font-bold">Root Cause Analysis:</div>
              <div>OpenClaw gateway connection dropped briefly at 07:17:05.</div>
              <div>Self-healed in 5 seconds (2 retries).</div>
              <div className="mt-3 text-yellow-400">⚠ 1 WARN event detected</div>
              <div>Rate limit at 80% of hourly quota at 07:16:15.</div>
              <div className="mt-3 text-primary font-bold">Recommendations:</div>
              <div>1. Add exponential backoff to connection retry logic.</div>
              <div>2. Set rate limit alert threshold at 70% to give earlier warning.</div>
              <div>3. Monitor token usage velocity — at current rate, quota will be reached within 2h.</div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-secondary/[0.05] border border-secondary/20">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
                Health Summary
              </div>
              <div className="text-sm text-secondary">
                Gateway stable · 99.9% uptime last 24h
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
