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

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost'

interface Lead {
  id: string
  company: string
  stage: Stage
  value: number
  contact: string
  industry: string
  lastActivity: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const LEADS: Lead[] = [
  { id: '1', company: 'Aramco HQ',       stage: 'Proposal',      value: 480000, contact: 'Khalid Al-Rashid',  industry: 'Energy',         lastActivity: '2d ago' },
  { id: '2', company: 'SABIC Riyadh',    stage: 'Qualification',  value: 320000, contact: 'Nora Al-Faraj',    industry: 'Petrochemicals', lastActivity: '5d ago' },
  { id: '3', company: 'NEOM Project',    stage: 'Prospecting',    value: 1200000, contact: 'Ahmed Al-Ghamdi', industry: 'Megaproject',    lastActivity: '1d ago' },
  { id: '4', company: 'STC HQ',          stage: 'Negotiation',    value: 180000, contact: 'Faisal Al-Otaibi', industry: 'Telecom',        lastActivity: '3h ago' },
  { id: '5', company: 'Saudi Airlines',  stage: 'Closed Won',     value: 95000,  contact: 'Sara Al-Zahrani',  industry: 'Aviation',       lastActivity: '1w ago' },
  { id: '6', company: 'Riyad Bank',      stage: 'Prospecting',    value: 240000, contact: 'Mohammed Al-Amri', industry: 'Finance',        lastActivity: 'new' },
]

const STAGE_BADGE: Record<Stage, string> = {
  Prospecting:   'bg-[#acaaae]/10 text-[#acaaae] border-[#acaaae]/20',
  Qualification: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  Proposal:      'bg-[#cacafe]/10 text-[#cacafe] border-[#cacafe]/20',
  Negotiation:   'bg-purple-400/10 text-purple-400 border-purple-400/20',
  'Closed Won':  'bg-secondary/10 text-secondary border-secondary/20',
  'Closed Lost': 'bg-[#ff6e84]/10 text-[#ff6e84] border-[#ff6e84]/20',
}

const STAGE_ORDER: Stage[] = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

// ─── Sub-components ───────────────────────────────────────────────────────────

function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border ${STAGE_BADGE[stage]}`}>
      {stage}
    </span>
  )
}

// ─── B2B Page ─────────────────────────────────────────────────────────────────

export default function B2B() {
  const [leads, setLeads]             = useState<Lead[]>(LEADS)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLead, setNewLead]         = useState({
    company: '', contact: '', stage: 'Prospecting' as Stage,
    value: '', industry: '', notes: '',
  })

  const totalPipeline = leads.reduce((s, l) => s + l.value, 0)
  const inProgress    = leads.filter((l) => !l.stage.startsWith('Closed')).length
  const closedWon     = leads.filter((l) => l.stage === 'Closed Won').length
  const winRate       = leads.filter((l) => l.stage.startsWith('Closed')).length
    ? Math.round((closedWon / leads.filter((l) => l.stage.startsWith('Closed')).length) * 100)
    : 0
  const avgDeal       = leads.length ? Math.round(totalPipeline / leads.length) : 0

  function handleAddLead() {
    if (!newLead.company) return
    const lead: Lead = {
      id: String(Date.now()),
      company:      newLead.company,
      stage:        newLead.stage,
      value:        Number(newLead.value) || 0,
      contact:      newLead.contact,
      industry:     newLead.industry,
      lastActivity: 'just now',
    }
    setLeads((prev) => [lead, ...prev])
    setShowAddForm(false)
    setNewLead({ company: '', contact: '', stage: 'Prospecting', value: '', industry: '', notes: '' })
  }

  function moveToNextStage(lead: Lead) {
    const idx = STAGE_ORDER.indexOf(lead.stage)
    if (idx < STAGE_ORDER.length - 1) {
      const next = STAGE_ORDER[idx + 1]
      setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, stage: next } : l))
      setSelectedLead((prev) => prev ? { ...prev, stage: next } : null)
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-16"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            Sales Pipeline
          </div>
          <h1 className="text-4xl font-black text-primary">B2B</h1>
          <p className="text-sm text-on-surface-variant mt-1">Enterprise pipeline — Saudi market</p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/15 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Lead
        </button>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={itemVariants}>
        <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary mb-4">Pipeline Summary</div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Pipeline',  value: `${(totalPipeline / 1000).toFixed(0)}K SAR`, sub: `${leads.length} deals` },
            { label: 'Deals in Progress', value: String(inProgress), sub: 'active stages' },
            { label: 'Win Rate',        value: `${winRate}%`,  sub: 'closed deals' },
            { label: 'Avg Deal Size',   value: `${(avgDeal / 1000).toFixed(0)}K SAR`, sub: 'per deal' },
          ].map((card) => (
            <motion.div key={card.label} variants={itemVariants} className="glass-card p-6">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
                {card.label}
              </div>
              <div className="text-3xl font-black text-primary mt-3">{card.value}</div>
              <div className="text-[11px] text-on-surface-variant mt-1">{card.sub}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Inline add form */}
      {showAddForm && (
        <motion.div
          variants={itemVariants}
          className="glass-card p-6"
        >
          <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary mb-4">New Lead</div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Company Name', key: 'company', placeholder: 'e.g. Saudi Aramco' },
              { label: 'Contact Name', key: 'contact', placeholder: 'e.g. Khalid Al-Rashid' },
              { label: 'Industry',     key: 'industry', placeholder: 'e.g. Energy' },
            ].map((f) => (
              <div key={f.key}>
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">
                  {f.label}
                </div>
                <input
                  value={(newLead as Record<string, string>)[f.key]}
                  onChange={(e) => setNewLead((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-surface-container-high/60 border border-primary/[0.08] rounded-xl px-3 py-2 text-sm text-primary placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/30"
                />
              </div>
            ))}
            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">
                Stage
              </div>
              <select
                value={newLead.stage}
                onChange={(e) => setNewLead((prev) => ({ ...prev, stage: e.target.value as Stage }))}
                className="w-full bg-surface-container-high/60 border border-primary/[0.08] rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary/30"
              >
                {STAGE_ORDER.map((s) => (
                  <option key={s} value={s} className="bg-[#0e0e11]">{s}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">
                Value (SAR)
              </div>
              <input
                type="number"
                value={newLead.value}
                onChange={(e) => setNewLead((prev) => ({ ...prev, value: e.target.value }))}
                placeholder="e.g. 250000"
                className="w-full bg-surface-container-high/60 border border-primary/[0.08] rounded-xl px-3 py-2 text-sm text-primary placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/30"
              />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">
                Notes
              </div>
              <input
                value={newLead.notes}
                onChange={(e) => setNewLead((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes..."
                className="w-full bg-surface-container-high/60 border border-primary/[0.08] rounded-xl px-3 py-2 text-sm text-primary placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/30"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddLead}
              className="px-6 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/15 transition-all"
            >
              Save Lead
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-2 rounded-xl bg-surface-container-high/60 border border-primary/[0.08] text-on-surface-variant text-sm font-semibold hover:text-primary transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <motion.div variants={itemVariants} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/[0.08]">
                {['Company', 'Stage', 'Value (SAR)', 'Contact', 'Industry', 'Last Activity', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase px-5 py-3.5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr
                  key={lead.id}
                  className={`border-b border-primary/[0.04] last:border-0 hover:bg-primary/[0.02] transition-all ${
                    i % 2 === 0 ? '' : 'bg-primary/[0.01]'
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-primary">{lead.company}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StageBadge stage={lead.stage} />
                  </td>
                  <td className="px-5 py-3.5 text-on-surface-variant font-mono">
                    {lead.value.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-on-surface-variant">{lead.contact}</td>
                  <td className="px-5 py-3.5 text-on-surface-variant">{lead.industry}</td>
                  <td className="px-5 py-3.5 text-on-surface-variant text-[11px]">{lead.lastActivity}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="text-[11px] font-bold tracking-[0.1em] text-secondary hover:text-primary transition-colors uppercase"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Lead detail panel overlay */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setSelectedLead(null)}>
          <motion.div
            initial={{ x: 480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-[460px] h-full bg-surface-container-high/95 backdrop-blur-xl border-l border-primary/[0.08] p-6 overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-primary">{selectedLead.company}</h2>
                <div className="mt-1.5">
                  <StageBadge stage={selectedLead.stage} />
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-on-surface-variant hover:text-primary transition-colors mt-1">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: 'Contact',       value: selectedLead.contact },
                { label: 'Industry',      value: selectedLead.industry },
                { label: 'Deal Value',    value: `${selectedLead.value.toLocaleString()} SAR` },
                { label: 'Last Activity', value: selectedLead.lastActivity },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-2 border-b border-primary/[0.06]">
                  <span className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
                    {row.label}
                  </span>
                  <span className="text-sm text-primary">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">
              Activity Timeline
            </div>
            <div className="space-y-3 mb-6">
              {[
                { event: 'Deal created', time: '2 weeks ago' },
                { event: 'Initial meeting scheduled', time: '10d ago' },
                { event: 'Proposal sent', time: '5d ago' },
                { event: 'Follow-up email sent', time: '2d ago' },
              ].map((ev, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" />
                  <div>
                    <div className="text-sm text-on-surface-variant">{ev.event}</div>
                    <div className="text-[11px] text-on-surface-variant/50">{ev.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action button */}
            {selectedLead.stage !== 'Closed Won' && selectedLead.stage !== 'Closed Lost' && (
              <button
                onClick={() => moveToNextStage(selectedLead)}
                className="w-full px-5 py-3 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary text-sm font-bold hover:bg-secondary/15 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                Move to Next Stage
              </button>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
