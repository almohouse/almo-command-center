import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { MODELS, type AgentData, type AgentStatus } from '@/data/agents'
import { useToast } from '@/data/toast'

// ─── Status helpers ──────────────────────────────────────────────────────────

const statusDotClasses: Record<AgentStatus, string> = {
  running: 'bg-secondary animate-pulse',
  idle: 'bg-on-surface-variant/30',
  'not-deployed': 'border border-on-surface-variant/20',
}

const statusBadge: Record<AgentStatus, { label: string; cls: string }> = {
  running: {
    label: 'Running',
    cls: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  idle: {
    label: 'Idle',
    cls: 'bg-surface-container-high text-on-surface-variant border-primary/[0.06]',
  },
  'not-deployed': {
    label: 'Not Deployed',
    cls: 'bg-surface-container-high text-on-surface-variant/50 border-primary/[0.04]',
  },
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentProfileCardProps {
  agent: AgentData
  compact?: boolean
  onAgentUpdate?: (updated: AgentData) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AgentProfileCard({ agent, compact = false, onAgentUpdate }: AgentProfileCardProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const [mode, setMode] = useState<'display' | 'edit'>('display')
  const [memoryExpanded, setMemoryExpanded] = useState(false)

  // Edit state
  const [editName, setEditName] = useState(agent.name)
  const [editTitle, setEditTitle] = useState(agent.title)
  const [editModel, setEditModel] = useState(agent.model)
  const [editPersonality, setEditPersonality] = useState(agent.personality)
  const [editDescription, setEditDescription] = useState(agent.description)
  const [editSkills, setEditSkills] = useState<string[]>([...agent.skills])
  const [editHeartbeat, setEditHeartbeat] = useState(agent.heartbeatInterval)
  const [editTelegram, setEditTelegram] = useState(agent.telegramBot ?? '')
  const [newSkill, setNewSkill] = useState('')

  const isNotDeployed = agent.status === 'not-deployed'
  const dot = statusDotClasses[agent.status]
  const badge = statusBadge[agent.status]

  function resetEditState() {
    setEditName(agent.name)
    setEditTitle(agent.title)
    setEditModel(agent.model)
    setEditPersonality(agent.personality)
    setEditDescription(agent.description)
    setEditSkills([...agent.skills])
    setEditHeartbeat(agent.heartbeatInterval)
    setEditTelegram(agent.telegramBot ?? '')
    setNewSkill('')
  }

  function handleEdit() {
    resetEditState()
    setMode('edit')
  }

  function handleCancel() {
    setMode('display')
  }

  function handleSave() {
    const updated: AgentData = {
      ...agent,
      name: editName,
      title: editTitle,
      model: editModel,
      personality: editPersonality,
      description: editDescription,
      skills: editSkills,
      heartbeatInterval: editHeartbeat,
      telegramBot: editTelegram || null,
    }
    onAgentUpdate?.(updated)
    toast.show('Profile updated — changes take effect on next run')
    setMode('display')
  }

  function handleAddSkill() {
    const trimmed = newSkill.trim()
    if (trimmed && !editSkills.includes(trimmed)) {
      setEditSkills([...editSkills, trimmed])
      setNewSkill('')
    }
  }

  function handleRemoveSkill(skill: string) {
    setEditSkills(editSkills.filter(s => s !== skill))
  }

  function handleChat() {
    navigate(`/chat?agent=${agent.id}`)
  }

  function handleWake() {
    toast.show('Wake signal sent')
  }

  // ─── Compact mode ────────────────────────────────────────────────────────

  if (compact) {
    return (
      <div className={`glass-card p-4 transition-all ${isNotDeployed ? 'opacity-50' : 'hover:border-primary/20'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/[0.08] flex items-center justify-center text-base shrink-0">
            {agent.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary truncate">{agent.name}</span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
            </div>
            <div className="text-[10px] text-on-surface-variant truncate">{agent.title}</div>
          </div>
          <span className={`text-[9px] font-bold tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-full border shrink-0 ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
      </div>
    )
  }

  // ─── Edit mode ───────────────────────────────────────────────────────────

  if (mode === 'edit') {
    return (
      <div className="glass-card p-5 transition-all">
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-1.5">Name</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all"
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-1.5">Title</label>
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all"
            />
          </div>

          {/* Model */}
          <div>
            <label className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-1.5">Model</label>
            <select
              value={editModel}
              onChange={e => setEditModel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface focus:border-primary/30 focus:outline-none transition-all"
            >
              {MODELS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Personality */}
          <div>
            <label className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-1.5">Personality</label>
            <textarea
              value={editPersonality}
              onChange={e => setEditPersonality(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-1.5">Description</label>
            <textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-1.5">Skills</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {editSkills.map(skill => (
                <span key={skill} className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                  {skill}
                  <button onClick={() => handleRemoveSkill(skill)} className="text-secondary/60 hover:text-secondary transition-colors">
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                placeholder="Add skill..."
                className="flex-1 px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
              />
              <button
                onClick={handleAddSkill}
                className="px-3 py-2 rounded-lg bg-primary/[0.06] border border-primary/[0.08] text-xs font-semibold text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all"
              >
                Add
              </button>
            </div>
          </div>

          {/* Heartbeat */}
          <div>
            <label className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-1.5">Heartbeat Interval (min)</label>
            <input
              type="number"
              value={editHeartbeat}
              onChange={e => setEditHeartbeat(Number(e.target.value))}
              min={1}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface focus:border-primary/30 focus:outline-none transition-all"
            />
          </div>

          {/* Telegram */}
          <div>
            <label className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-1.5">Telegram Bot</label>
            <input
              value={editTelegram}
              onChange={e => setEditTelegram(e.target.value)}
              placeholder="@bot_username"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all"
            />
          </div>

          {/* Avatar placeholder */}
          <div>
            <label className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-1.5">Avatar</label>
            <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/[0.08] flex items-center justify-center text-2xl">
              {agent.emoji}
            </div>
            <div className="text-[10px] text-on-surface-variant mt-1">Upload coming soon — using emoji for now</div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-all font-semibold text-sm"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all font-semibold text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Display mode ────────────────────────────────────────────────────────

  return (
    <div className={`glass-card p-5 transition-all ${isNotDeployed ? 'opacity-50' : 'hover:border-primary/20'}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/[0.08] flex items-center justify-center text-xl shrink-0">
          {agent.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-primary">{agent.name}</span>
            <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
            <span className={`text-[9px] font-bold tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-full border ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <div className="text-[11px] text-on-surface-variant mt-0.5">{agent.title}</div>
        </div>
      </div>

      {/* Model */}
      <div className="font-mono text-[10px] text-on-surface-variant/60 mt-2">{agent.model}</div>

      {/* Description */}
      <p className="text-xs text-on-surface-variant mt-2 leading-relaxed line-clamp-2">{agent.description}</p>

      {/* Personality */}
      {agent.personality && (
        <p className="text-xs text-on-surface-variant/80 mt-2 italic leading-relaxed line-clamp-2">
          &ldquo;{agent.personality}&rdquo;
        </p>
      )}

      {/* Skills */}
      {agent.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {agent.skills.map(skill => (
            <span
              key={skill}
              className="text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      {!isNotDeployed && (
        <div className="flex items-center gap-4 mt-3 text-[10px] text-on-surface-variant/60">
          <span>{agent.tasksAssigned} assigned</span>
          <span className="w-px h-3 bg-primary/[0.08]" />
          <span>{agent.tasksInProgress} in progress</span>
          {agent.monthlyCost > 0 && (
            <>
              <span className="w-px h-3 bg-primary/[0.08]" />
              <span>${agent.monthlyCost.toFixed(2)}/mo</span>
            </>
          )}
        </div>
      )}

      {/* Memory snippets */}
      {agent.memorySnippets.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setMemoryExpanded(!memoryExpanded)}
            className="flex items-center gap-1 text-[10px] font-bold tracking-[0.08em] uppercase text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">
              {memoryExpanded ? 'expand_less' : 'expand_more'}
            </span>
            Memory ({agent.memorySnippets.length})
          </button>
          <AnimatePresence>
            {memoryExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1.5">
                  {agent.memorySnippets.map((snippet, i) => (
                    <div key={i} className="text-[10px] text-on-surface-variant/70 pl-3 border-l border-primary/[0.06] leading-relaxed">
                      {snippet}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleChat}
          disabled={isNotDeployed}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/[0.06] border border-primary/[0.08] text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none"
        >
          <span className="material-symbols-outlined text-[14px]">forum</span>
          Chat
        </button>
        <button
          onClick={handleEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/[0.06] border border-primary/[0.08] text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all text-xs font-semibold"
        >
          <span className="material-symbols-outlined text-[14px]">edit</span>
          Edit
        </button>
        <button
          onClick={handleWake}
          disabled={isNotDeployed}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/[0.06] border border-primary/[0.08] text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none"
        >
          <span className="material-symbols-outlined text-[14px]">bolt</span>
          Wake
        </button>
      </div>
    </div>
  )
}
