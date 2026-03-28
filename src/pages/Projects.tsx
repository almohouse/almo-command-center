import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useAudioPlayer } from '@/data/audio-player'
import { MENTIONABLES } from '@/data/agents'
import InfoIcon from '@/components/shared/InfoIcon'
import {
  useStore,
  type Project, type ProjectStatus, type Task, type Priority,
  PROJECT_STATUS_BADGE, GOAL_COLORS, STATUS_ACCENT,
  getCurrentUser, relTime, fmtDate, fmtTimestamp, renderMentionText, generateProjectSummary,
} from '@/data/store'
import MentionTextarea from '@/components/shared/MentionTextarea'
import TaskDetailModal from '@/components/shared/TaskDetailModal'
import { api } from '@/lib/api'

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_STATUSES: ProjectStatus[] = ['active', 'planned', 'paused', 'cancelled', 'completed']
const PROJECT_TYPES = ['PL', 'MK', 'IF', 'RS', 'OP', 'FN', 'CX', 'BD']
const TYPE_LABELS: Record<string, string> = {
  PL: 'Product Launch', MK: 'Marketing', IF: 'Infrastructure', RS: 'Research',
  OP: 'Operations', FN: 'Finance', CX: 'Customer Experience', BD: 'Business Development',
}

// ─── Projects Page ────────────────────────────────────────────────────────────

export default function Projects() {
  const store = useStore()
  const navigate = useNavigate()
  const audioPlayer = useAudioPlayer()
  const [audioGenerating, setAudioGenerating] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddTaskForm, setShowAddTaskForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editDraft, setEditDraft] = useState<Partial<Project>>({})
  const [comment, setComment] = useState('')
  const [newProject, setNewProject] = useState({ type: 'PL', shortName: '', description: '', lead: 'CTO', assignedBy: 'Moe', targetEndDate: '' })
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', assignee: 'CTO', assignedBy: 'Moe', priority: 'medium' as Priority })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selectedProject = selectedProjectId ? store.projects.find(p => p.id === selectedProjectId) ?? null : null
  const selectedTask = selectedTaskId ? store.tasks.find(t => t.id === selectedTaskId) ?? null : null
  const projectTasks = selectedProject ? store.getProjectTasks(selectedProject.id) : []

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsData, tasksData] = await Promise.all([
          api.projects.list() as Promise<any[]>,
          api.tasks.list() as Promise<any[]>,
        ])
        // Seed projects into store
        projectsData.forEach((p: any) => {
          const proj = {
            id: p.id,
            name: p.name,
            description: p.description || '',
            status: p.status || 'planned',
            lead: p.lead || '',
            assignedBy: p.assigned_by || '',
            targetEndDate: p.target_end_date || null,
            goal: p.goal || '',
            risks: p.risks || [],
            dependencies: p.dependencies || [],
            comments: p.comments || [],
            createdAt: p.created_at || '',
            updatedAt: p.updated_at || '',
          }
          if (!store.projects.find(existing => existing.id === proj.id)) {
            store.addProject(proj as any)
          }
        })
        // Seed tasks
        tasksData.forEach((t: any) => {
          const task = {
            id: t.id,
            title: t.title,
            description: t.description || '',
            status: t.status || 'Backlog',
            priority: t.priority || 'medium',
            project: t.project_id || t.project || '',
            assignee: t.assignee || '',
            assignedBy: t.assigned_by || '',
            dueDate: t.due_date || null,
            createdAt: t.created_at || '',
            updatedAt: t.updated_at || '',
            statusHistory: t.status_history || [],
            attachments: t.attachments || [],
            comments: t.comments || [],
          }
          if (!store.tasks.find(existing => existing.id === task.id)) {
            store.addTask(task as any)
          }
        })
      } catch {
        setError('Backend offline — showing local data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function handleCreateProject() {
    if (!newProject.shortName.trim()) return
    const id = `2026-${newProject.type}-${newProject.shortName.toUpperCase().replace(/\s+/g, '-')}`
    const project: Project = {
      id, name: newProject.shortName, description: newProject.description,
      status: 'planned', lead: newProject.lead, assignedBy: newProject.assignedBy,
      targetEndDate: newProject.targetEndDate || null,
      goal: TYPE_LABELS[newProject.type] ?? 'Operations',
      risks: [], dependencies: [], comments: [],
      createdAt: '2026-03-28', updatedAt: '2026-03-28',
    }
    store.addProject(project)
    api.projects.create({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      lead: project.lead,
      assigned_by: project.assignedBy,
      target_end_date: project.targetEndDate,
      goal: project.goal,
    }).catch(() => {})
    setNewProject({ type: 'PL', shortName: '', description: '', lead: 'CTO', assignedBy: 'Moe', targetEndDate: '' })
    setShowAddForm(false)
  }

  function handleStatusChange(newStatus: ProjectStatus) {
    if (!selectedProject) return
    store.updateProject(selectedProject.id, { status: newStatus })
    api.projects.update(selectedProject.id, { status: newStatus }).catch(() => {})
    // Cascade: pause → block all non-done tasks, cancel → block all
    if (newStatus === 'paused' || newStatus === 'cancelled') {
      projectTasks.filter(t => t.status !== 'Done').forEach(t => {
        store.changeTaskStatus(t.id, 'Blocked')
      })
    }
  }

  function handleAddTaskInProject() {
    if (!newTask.title.trim() || !selectedProject) return
    const task: Task = {
      id: store.nextTaskId(),
      title: newTask.title,
      description: newTask.description,
      status: 'Backlog',
      priority: newTask.priority,
      project: selectedProject.id,
      assignee: newTask.assignee,
      assignedBy: newTask.assignedBy,
      dueDate: newTask.dueDate || null,
      createdAt: '2026-03-28', updatedAt: '2026-03-28',
      statusHistory: [{ from: null, to: 'Backlog', at: '2026-03-28', by: getCurrentUser() }],
      attachments: [], comments: [],
    }
    store.addTask(task)
    setNewTask({ title: '', description: '', dueDate: '', assignee: 'CTO', assignedBy: 'Moe', priority: 'medium' })
    setShowAddTaskForm(false)
  }

  function handleSaveEdit() {
    if (!selectedProject) return
    store.updateProject(selectedProject.id, editDraft)
    api.projects.update(selectedProject.id, editDraft).catch(() => {})
    setEditing(false)
    setEditDraft({})
  }

  function handlePostComment() {
    if (!comment.trim() || !selectedProject) return
    store.addProjectComment(selectedProject.id, {
      id: `pc-${Date.now()}`, author: getCurrentUser(), text: comment, createdAt: new Date().toISOString(),
    })
    setComment('')
  }

  function openProjectDetail(id: string) {
    setSelectedProjectId(id)
    setEditing(false)
    setEditDraft({})
    setShowAddTaskForm(false)
  }

  // ─── Render ───

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-16">
      {loading && (
        <motion.div variants={itemVariants} className="glass-card p-8 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-secondary/30 border-t-secondary animate-spin" />
          <span className="ml-3 text-sm text-on-surface-variant">Loading projects...</span>
        </motion.div>
      )}
      {error && (
        <motion.div variants={itemVariants} className="glass-card p-4 border border-amber-500/20">
          <span className="text-xs text-amber-400">{error}</span>
        </motion.div>
      )}
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">Operations</div>
          <h1 className="text-4xl font-black text-primary text-glow">Projects</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            {store.projects.length} projects · {store.projects.filter(p => p.status === 'active').length} active
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              setAudioGenerating(true)
              try { await fetch('/api/audio/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: 'projects' }) }) } catch { /* dev */ }
              setAudioGenerating(false)
              audioPlayer.play({ title: 'Projects Summary', subtitle: 'Operations · AI Generated', duration: '2:15' })
            }}
            disabled={audioGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">{audioGenerating ? 'hourglass_empty' : 'play_arrow'}</span>
            {audioGenerating ? 'Generating...' : 'Audio Summary'}
          </button>
          <button onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary font-semibold hover:bg-secondary/20 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>New Project
          </button>
        </div>
      </motion.div>

      {/* New Project Form */}
      {showAddForm && (
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase">New Project</div>
            <button onClick={() => setShowAddForm(false)} className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Type</div>
              <select value={newProject.type} onChange={e => setNewProject(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
              >{PROJECT_TYPES.map(t => <option key={t} value={t}>{t} — {TYPE_LABELS[t]}</option>)}</select>
            </div>
            <div>
              <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Name</div>
              <input type="text" placeholder="Project name" value={newProject.shortName}
                onChange={e => setNewProject(p => ({ ...p, shortName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
            </div>
            <div>
              <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Lead Agent</div>
              <select value={newProject.lead} onChange={e => setNewProject(p => ({ ...p, lead: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
              >{MENTIONABLES.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select>
            </div>
            <div>
              <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Assigned By</div>
              <select value={newProject.assignedBy} onChange={e => setNewProject(p => ({ ...p, assignedBy: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
              >{MENTIONABLES.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select>
            </div>
            <div>
              <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Target End Date</div>
              <input type="date" value={newProject.targetEndDate} onChange={e => setNewProject(p => ({ ...p, targetEndDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
            </div>
            <div className="flex items-end">
              <button onClick={handleCreateProject}
                className="w-full py-2 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold hover:bg-secondary/20 transition-all"
              >Create</button>
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Description</div>
            <input type="text" placeholder="Brief description" value={newProject.description}
              onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
          </div>
        </motion.div>
      )}

      {/* Project Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-3 gap-5">
          {store.projects.map(project => {
            const tasks = store.getProjectTasks(project.id)
            const done = tasks.filter(t => t.status === 'Done').length
            const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
            const badge = PROJECT_STATUS_BADGE[project.status]
            const goalColor = GOAL_COLORS[project.goal] ?? 'bg-surface-container-high text-on-surface-variant border-primary/[0.08]'

            return (
              <motion.div key={project.id} variants={itemVariants}
                onClick={() => openProjectDetail(project.id)}
                className="glass-card p-6 cursor-pointer hover:border-primary/20 transition-all flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-mono text-[10px] text-on-surface-variant tracking-[0.04em] mt-0.5">{project.id}</div>
                  <span className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border shrink-0 ${badge.classes}`}>
                    {badge.label}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-primary leading-snug">{project.name}</h3>
                  {project.description && <p className="text-[12px] text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">{project.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border ${goalColor}`}>{project.goal}</span>
                  <span className="text-[11px] text-on-surface-variant">Lead: <span className="text-primary font-semibold">{project.lead}</span></span>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-on-surface-variant mb-1.5">
                    <span>{done}/{tasks.length} tasks</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${pct}%`,
                      background: pct >= 80 ? '#cacafe' : pct >= 40 ? '#ff9fe3' : '#acaaae',
                      boxShadow: pct > 0 ? `0 0 8px ${pct >= 80 ? '#cacafe50' : '#ff9fe350'}` : 'none',
                    }} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-primary/[0.05]">
                  <span className="text-[10px] text-on-surface-variant">Updated {relTime(project.updatedAt)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/tasks?project=${encodeURIComponent(project.id)}`) }}
                    className="text-[10px] text-secondary hover:text-primary transition-colors font-semibold flex items-center gap-1"
                  >
                    View Tasks
                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Project Detail Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedProject && !selectedTaskId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
            onClick={() => setSelectedProjectId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              onClick={e => e.stopPropagation()}
              className="w-[720px] max-h-[90vh] overflow-y-auto rounded-2xl"
              style={{ background: 'rgba(18, 18, 22, 0.97)', backdropFilter: 'blur(32px)', border: '1px solid rgba(230, 230, 250, 0.08)' }}
            >
              <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[11px] text-on-surface-variant tracking-[0.05em] mb-2">{selectedProject.id}</div>
                    {editing ? (
                      <input type="text" value={editDraft.name ?? selectedProject.name}
                        onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                        className="text-2xl font-black text-primary bg-transparent border-b border-primary/30 focus:outline-none w-full"
                      />
                    ) : (
                      <h2 className="text-2xl font-black text-primary leading-tight">{selectedProject.name}</h2>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button onClick={() => { if (editing) handleSaveEdit(); else { setEditing(true); setEditDraft({}) } }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                      title={editing ? 'Save' : 'Edit'}
                    >
                      <span className="material-symbols-outlined text-[18px]">{editing ? 'check' : 'edit'}</span>
                    </button>
                    <button onClick={() => setSelectedProjectId(null)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                </div>

                {/* Description */}
                {editing ? (
                  <textarea value={editDraft.description ?? selectedProject.description} rows={3}
                    onChange={e => setEditDraft(d => ({ ...d, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface focus:border-primary/30 focus:outline-none transition-all resize-none"
                  />
                ) : selectedProject.description ? (
                  <p className="text-sm text-on-surface leading-relaxed">{selectedProject.description}</p>
                ) : null}

                {/* Status chips */}
                <div>
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">Status</div>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_STATUSES.map(s => {
                      const b = PROJECT_STATUS_BADGE[s]
                      return (
                        <button key={s} onClick={() => handleStatusChange(s)}
                          className={[
                            'px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-[0.08em] uppercase border transition-all',
                            selectedProject.status === s ? `${b.classes}` : 'text-on-surface-variant border-primary/[0.08] hover:border-primary/20',
                          ].join(' ')}
                        >{b.label}</button>
                      )
                    })}
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">Lead</div>
                    {editing ? (
                      <select value={editDraft.lead ?? selectedProject.lead}
                        onChange={e => setEditDraft(d => ({ ...d, lead: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:outline-none"
                      >{MENTIONABLES.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select>
                    ) : (
                      <span className="text-sm text-primary font-semibold">{selectedProject.lead}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">Assigned By</div>
                    {editing ? (
                      <select value={editDraft.assignedBy ?? selectedProject.assignedBy}
                        onChange={e => setEditDraft(d => ({ ...d, assignedBy: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:outline-none"
                      >{MENTIONABLES.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select>
                    ) : (
                      <span className="text-sm text-on-surface">{selectedProject.assignedBy}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">Target End</div>
                    {editing ? (
                      <input type="date" value={editDraft.targetEndDate ?? selectedProject.targetEndDate ?? ''}
                        onChange={e => setEditDraft(d => ({ ...d, targetEndDate: e.target.value || null }))}
                        className="w-full px-3 py-1.5 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:outline-none"
                      />
                    ) : (
                      <span className="text-sm text-on-surface">{selectedProject.targetEndDate ? fmtDate(selectedProject.targetEndDate) : '—'}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">Goal</div>
                    <span className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border ${GOAL_COLORS[selectedProject.goal] ?? ''}`}>
                      {selectedProject.goal}
                    </span>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="px-5 py-4 rounded-xl bg-secondary/[0.06] border border-secondary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[16px] text-secondary">auto_awesome</span>
                    <div className="text-[11px] font-bold tracking-[0.15em] text-secondary uppercase">Project Summary</div>
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed">{generateProjectSummary(selectedProject, store.tasks)}</p>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold tracking-[0.2em] uppercase">Progress</span>
                      <InfoIcon text="Percentage of tasks completed out of total tasks in this project." />
                    </div>
                    <span>{projectTasks.filter(t => t.status === 'Done').length}/{projectTasks.length} tasks complete</span>
                  </div>
                  <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    {(() => {
                      const pct = projectTasks.length > 0 ? Math.round((projectTasks.filter(t => t.status === 'Done').length / projectTasks.length) * 100) : 0
                      return <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 80 ? '#cacafe' : '#ff9fe3', boxShadow: `0 0 8px ${pct >= 80 ? '#cacafe50' : '#ff9fe350'}` }} />
                    })()}
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
                      Tasks <span className="text-on-surface-variant/40">({projectTasks.length})</span>
                    </div>
                    <button onClick={() => setShowAddTaskForm(v => !v)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-secondary hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>Add Task
                    </button>
                  </div>

                  {/* Inline add task */}
                  {showAddTaskForm && (
                    <div className="glass-card p-4 mb-3 space-y-3">
                      <input type="text" placeholder="Task title..." value={newTask.title}
                        onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddTaskInProject()}
                        className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/30 focus:outline-none transition-all"
                        autoFocus
                      />
                      <div className="grid grid-cols-4 gap-2">
                        <select value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))}
                          className="px-2 py-1.5 rounded-lg bg-surface-container border border-primary/[0.06] text-[11px] text-on-surface focus:outline-none"
                        >{MENTIONABLES.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select>
                        <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as Priority }))}
                          className="px-2 py-1.5 rounded-lg bg-surface-container border border-primary/[0.06] text-[11px] text-on-surface focus:outline-none"
                        >
                          <option value="critical">Critical</option><option value="high">High</option>
                          <option value="medium">Medium</option><option value="low">Low</option>
                        </select>
                        <input type="date" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))}
                          className="px-2 py-1.5 rounded-lg bg-surface-container border border-primary/[0.06] text-[11px] text-on-surface focus:outline-none" />
                        <button onClick={handleAddTaskInProject}
                          className="py-1.5 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary text-[11px] font-bold hover:bg-secondary/20 transition-all"
                        >Create</button>
                      </div>
                    </div>
                  )}

                  {/* Task list */}
                  {projectTasks.length > 0 ? (
                    <div className="space-y-1">
                      {projectTasks.map(task => (
                        <button key={task.id} onClick={() => setSelectedTaskId(task.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/[0.04] transition-all text-left"
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_ACCENT[task.status] }} />
                          <span className="font-mono text-[10px] text-on-surface-variant/60 w-16 shrink-0">{task.id}</span>
                          <span className="text-sm text-primary font-medium flex-1 truncate">{task.title}</span>
                          <span className="text-[10px] text-on-surface-variant shrink-0">{task.assignee}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0"
                            style={{ color: STATUS_ACCENT[task.status], borderColor: STATUS_ACCENT[task.status] + '40', background: STATUS_ACCENT[task.status] + '15' }}
                          >{task.status}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-on-surface-variant/40 text-center py-4">No tasks yet</div>
                  )}
                </div>

                {/* Risks */}
                <div>
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">
                    Risks <span className="text-on-surface-variant/40">({selectedProject.risks.length})</span>
                  </div>
                  {selectedProject.risks.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProject.risks.map(r => (
                        <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-container-high/50 border border-primary/[0.06]">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${r.severity === 'high' ? 'bg-error' : r.severity === 'medium' ? 'bg-amber-400' : 'bg-green-400/60'}`} />
                          <span className="text-sm text-on-surface flex-1">{r.text}</span>
                          <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-on-surface-variant/50">{r.severity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-on-surface-variant/40">No risks identified</div>
                  )}
                </div>

                {/* Dependencies */}
                {selectedProject.dependencies.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">Dependencies</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.dependencies.map(depId => {
                        const dep = store.projects.find(p => p.id === depId)
                        return (
                          <button key={depId} onClick={() => openProjectDetail(depId)}
                            className="px-3 py-1.5 rounded-lg bg-surface-container-high/50 border border-primary/[0.06] text-sm text-primary font-medium hover:border-primary/20 transition-all"
                          >{dep?.name ?? depId}</button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div className="border-t border-primary/[0.06] pt-5">
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-4">
                    Comments <span className="text-on-surface-variant/40">({selectedProject.comments.length})</span>
                  </div>
                  {selectedProject.comments.length > 0 && (
                    <div className="space-y-4 mb-5">
                      {selectedProject.comments.map(c => (
                        <div key={c.id} className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-black text-primary shrink-0 mt-0.5">{c.author[0]}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-primary">{c.author}</span>
                              <span className="text-[10px] text-on-surface-variant">{fmtTimestamp(c.createdAt)}</span>
                            </div>
                            <p className="text-sm text-on-surface leading-relaxed">{renderMentionText(c.text)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <MentionTextarea value={comment} onChange={setComment} placeholder="Write a comment... (type @ to mention)" rows={3} />
                  <button onClick={handlePostComment}
                    className="mt-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
                  >Post Comment</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Detail Modal (opens on top of project modal) */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onStatusChange={store.changeTaskStatus}
        onAddComment={store.addTaskComment}
      />
    </motion.div>
  )
}
