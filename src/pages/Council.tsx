import { useState } from 'react'
import { motion } from 'motion/react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ChiefStatus = 'running' | 'idle' | 'not-deployed'

interface Chief {
  id: string
  name: string
  status: ChiefStatus
  alwaysPresent?: boolean
  canDeselect?: boolean
}

interface PastMeeting {
  id: string
  title: string
  date: string
  participants: string[]
  outcome: string
}

interface TranscriptLine {
  speaker: string
  text: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CHIEFS: Chief[] = [
  { id: 'dceo', name: 'DCEO', status: 'running', alwaysPresent: true },
  { id: 'cto', name: 'CTO', status: 'running' },
  { id: 'cfo', name: 'CFO', status: 'idle' },
  { id: 'cmo', name: 'CMO', status: 'not-deployed' },
  { id: 'cxo', name: 'CXO', status: 'not-deployed' },
  { id: 'cgo', name: 'CGO', status: 'not-deployed' },
  { id: 'coo', name: 'COO', status: 'not-deployed' },
  { id: 'csco', name: 'CSCO', status: 'not-deployed' },
  { id: 'crdo', name: 'CRDO', status: 'idle' },
]

const MEETING_RULES = [
  'DCEO moderates and ensures all voices are heard.',
  'Each chief speaks only to their domain expertise.',
  'Decisions require consensus from present chiefs.',
  'MoM Agent records all outcomes and action items.',
  'Meetings auto-close after 30 minutes of inactivity.',
]

const MOCK_TRANSCRIPT: TranscriptLine[] = [
  {
    speaker: 'DCEO',
    text: "I'm convening this council to evaluate the keyboard tray product's market readiness and determine whether to advance to Stage 4 sourcing. CRDO, please lead with market intelligence.",
  },
  {
    speaker: 'CRDO',
    text: 'Market scout data shows strong TikTok velocity in the Saudi market. The keyboard tray category is up 38% MoM. Three competitors have entered the space in the last 60 days, signaling validated demand.',
  },
  {
    speaker: 'CFO',
    text: 'Landed cost analysis shows margin at 34%, above our 30% floor. At a 200-unit MOQ, working capital requirement is 18,400 SAR. Cash runway supports this order without disrupting operations.',
  },
  {
    speaker: 'DCEO',
    text: 'Based on the evidence presented, I recommend we advance to Stage 4 sourcing. CRDO to identify 3 qualified suppliers. CFO to model unit economics at 300 and 500 unit scale.',
  },
  {
    speaker: 'MoM',
    text: '[Recording] Council consensus: ADVANCE Keyboard Tray to Stage 4 sourcing. Action items logged. Meeting concluded at 11:47 AM.',
  },
]

const PAST_MEETINGS: PastMeeting[] = [
  {
    id: 'mtg-03',
    title: 'Product Pipeline Review',
    date: 'Mar 25, 2026',
    participants: ['DCEO', 'CFO', 'CRDO'],
    outcome: 'Advance to Stage 4',
  },
  {
    id: 'mtg-02',
    title: 'Budget Review Q1',
    date: 'Mar 22, 2026',
    participants: ['DCEO', 'CFO'],
    outcome: 'Q1 budget approved',
  },
  {
    id: 'mtg-01',
    title: 'Quarterly Planning',
    date: 'Mar 15, 2026',
    participants: ['All chiefs'],
    outcome: 'Q2 strategy set',
  },
]

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<ChiefStatus, string> = {
  running: 'bg-secondary animate-pulse',
  idle: 'bg-on-surface-variant/30',
  'not-deployed': '',
}

function ChiefStatusDot({ status }: { status: ChiefStatus }) {
  if (status === 'not-deployed') {
    return <span className="w-2 h-2 rounded-full border border-on-surface-variant/30 shrink-0 inline-block" />
  }
  return <span className={`w-2 h-2 rounded-full shrink-0 inline-block ${STATUS_DOT[status]}`} />
}

/** Parse @mentions in transcript text and wrap in styled span */
function TranscriptText({ text }: { text: string }) {
  const parts = text.split(/(@\w+)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="text-primary font-bold">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Council() {
  const [isActive, setIsActive] = useState(false)
  const [selectedChiefs, setSelectedChiefs] = useState<Set<string>>(new Set(['dceo', 'cto']))
  const [meetingTitle, setMeetingTitle] = useState('Product Pipeline Review')
  const [showNewMeetingInput, setShowNewMeetingInput] = useState(false)
  const [newMeetingTitle, setNewMeetingTitle] = useState('')
  const [meetings] = useState<PastMeeting[]>(PAST_MEETINGS)

  function toggleChief(id: string) {
    // DCEO and MoM always present
    if (id === 'dceo') return
    setSelectedChiefs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function startMeeting() {
    if (selectedChiefs.size < 2) return
    setIsActive(true)
  }

  function endMeeting() {
    setIsActive(false)
  }

  function handleNewMeeting() {
    if (showNewMeetingInput) {
      if (newMeetingTitle.trim()) setMeetingTitle(newMeetingTitle.trim())
      setShowNewMeetingInput(false)
      setNewMeetingTitle('')
    } else {
      setShowNewMeetingInput(true)
    }
  }

  const activePanelChiefs = CHIEFS.filter((c) => selectedChiefs.has(c.id))
  const canStart = selectedChiefs.size >= 2

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex overflow-hidden"
      style={{ height: 'calc(100vh - 64px)', marginTop: '-2rem', marginLeft: '-2rem', marginRight: '-2rem' }}
    >
      {/* ── Chiefs Panel ───────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col border-r border-primary/[0.08] overflow-hidden"
        style={{ width: 288, minWidth: 288 }}
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-primary/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary">Council</div>
            <button
              onClick={handleNewMeeting}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              New Meeting
            </button>
          </div>
          {showNewMeetingInput && (
            <input
              autoFocus
              value={newMeetingTitle}
              onChange={(e) => setNewMeetingTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNewMeeting()}
              placeholder="Meeting title..."
              className="w-full bg-surface-container-high border border-primary/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/30"
            />
          )}
        </div>

        {/* Chief checkboxes */}
        <div className="flex-1 overflow-y-auto py-3">
          <div className="px-5 mb-2">
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              Select Participants
            </div>
          </div>
          {CHIEFS.map((chief) => {
            const isChecked = selectedChiefs.has(chief.id)
            const isLocked = chief.id === 'dceo'
            return (
              <button
                key={chief.id}
                onClick={() => toggleChief(chief.id)}
                disabled={isLocked}
                className={`w-full flex items-center gap-3 px-5 py-2.5 transition-all text-left ${
                  isLocked ? 'cursor-default' : 'hover:bg-primary/[0.04]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                    isChecked
                      ? 'bg-primary/20 border-primary/40'
                      : 'border-primary/[0.15] bg-transparent'
                  }`}
                >
                  {isChecked && (
                    <span className="material-symbols-outlined text-[12px] text-primary">check</span>
                  )}
                </div>
                <ChiefStatusDot status={chief.status} />
                <span
                  className={`text-sm font-semibold flex-1 ${
                    chief.status === 'not-deployed'
                      ? 'text-on-surface-variant/50'
                      : isChecked
                      ? 'text-primary'
                      : 'text-on-surface'
                  }`}
                >
                  {chief.name}
                  {isLocked && (
                    <span className="text-[10px] text-on-surface-variant ml-2 font-normal">moderator</span>
                  )}
                </span>
              </button>
            )
          })}

          {/* MoM Agent (always present) */}
          <div className="flex items-center gap-3 px-5 py-2.5 opacity-60">
            <div className="w-4 h-4 rounded border border-primary/40 bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[12px] text-primary">check</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-secondary/40 shrink-0" />
            <span className="text-sm text-on-surface-variant flex-1">MoM Agent</span>
            <span className="text-[9px] text-on-surface-variant/50">always</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-primary/[0.08] space-y-2">
          {!isActive ? (
            <button
              onClick={startMeeting}
              disabled={!canStart}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-all font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]">play_circle</span>
              Start Meeting
            </button>
          ) : (
            <button
              onClick={endMeeting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-all font-semibold text-sm"
            >
              <span className="material-symbols-outlined text-[16px]">stop_circle</span>
              End Meeting
            </button>
          )}
        </div>

        {/* Past meetings */}
        <div className="border-t border-primary/[0.08] py-4 px-5 overflow-y-auto max-h-48">
          <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">
            Past Meetings
          </div>
          <div className="space-y-2">
            {meetings.map((m) => (
              <div key={m.id} className="glass-card px-3 py-2">
                <div className="text-xs font-semibold text-primary truncate">{m.title}</div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">
                  {m.date} · {m.participants.join(', ')}
                </div>
                <div className="text-[10px] text-secondary mt-0.5">→ {m.outcome}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Meeting Area ───────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex-1 overflow-y-auto px-8 py-8">
        {!isActive ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="glass-card p-12 text-center max-w-md">
              <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30 mb-4 block">
                groups
              </span>
              <div className="text-xl font-bold text-primary mb-2">No Active Meeting</div>
              <div className="text-sm text-on-surface-variant leading-relaxed">
                Select agents from the panel and click{' '}
                <span className="text-secondary font-semibold">Start Meeting</span> to convene a
                council session.
              </div>
              {!canStart && (
                <div className="mt-4 text-xs text-yellow-400/80">
                  Select at least 2 participants to start.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Meeting header */}
            <div className="glass-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-primary">{meetingTitle}</h1>
                  <div className="text-[11px] text-on-surface-variant mt-1">
                    Started Mar 27, 2026 · 11:32 AM
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error/10 border border-error/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                  <span className="text-[10px] font-bold text-error tracking-[0.1em] uppercase">Recording</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {activePanelChiefs.map((c) => (
                  <span
                    key={c.id}
                    className="text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border bg-primary/[0.06] text-primary border-primary/20"
                  >
                    {c.name}
                  </span>
                ))}
                <span className="text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border bg-secondary/10 text-secondary border-secondary/20">
                  MoM
                </span>
              </div>
            </div>

            {/* Meeting rules */}
            <div className="glass-card p-6">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">
                Meeting Rules
              </div>
              <ol className="space-y-1.5">
                {MEETING_RULES.map((rule, i) => (
                  <li key={i} className="text-sm text-on-surface-variant flex gap-2">
                    <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                    {rule}
                  </li>
                ))}
              </ol>
            </div>

            {/* Transcript */}
            <div>
              <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary mb-4">
                Transcript
              </div>
              <div className="space-y-3">
                {MOCK_TRANSCRIPT.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.4 }}
                    className={`glass-card p-4 ${line.speaker === 'MoM' ? 'border-secondary/20' : ''}`}
                  >
                    <div className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase mb-2">
                      @{line.speaker}
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      <TranscriptText text={line.text} />
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Outcome card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              className="glass-card p-6 border border-secondary/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[18px] text-secondary">verified</span>
                <div className="text-[11px] font-bold tracking-[0.2em] text-secondary uppercase">
                  Council Outcome
                </div>
              </div>
              <p className="text-sm text-on-surface leading-relaxed font-semibold">
                Council consensus: <span className="text-primary">ADVANCE</span> Keyboard Tray to Stage
                4 sourcing.
              </p>
              <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                Action items: CRDO to identify 3 qualified suppliers by Mar 31. CFO to model unit
                economics at 300 and 500 unit scale.
              </p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
