import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MENTIONABLES } from '@/data/agents'
import InfoIcon from '@/components/shared/InfoIcon'
import { api } from '@/lib/api'
import {
  useStore,
  type Task, type TaskStatus, type Priority, type Comment,
  TASK_COLUMNS, STATUS_ACCENT, PROJECTS_LIST,
  getCurrentUser, relTime, fmtDate,
} from '@/data/store'
import TaskDetailModal from '@/components/shared/TaskDetailModal'

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

// ─── Sortable Task Card ───────────────────────────────────────────────────────

function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeft: `3px solid ${STATUS_ACCENT[task.status]}`,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}
      className="glass-card p-4 cursor-grab active:cursor-grabbing hover:border-primary/20 transition-all"
    >
      <TaskCardContent task={task} />
    </div>
  )
}

function TaskCardContent({ task }: { task: Task }) {
  return (
    <>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] text-on-surface-variant">{task.id}</span>
        {task.dueDate && <span className="text-[10px] text-on-surface-variant">{fmtDate(task.dueDate)}</span>}
      </div>
      <div className="text-sm font-semibold text-primary leading-snug line-clamp-2 mb-2">{task.title}</div>
      <button
        onClick={(e) => { e.stopPropagation(); window.location.assign(`/tasks?project=${encodeURIComponent(task.project)}`) }}
        className="text-[11px] text-primary/60 mb-3 truncate hover:text-primary transition-colors text-left"
      >{task.project}</button>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-on-surface-variant">{task.assignee}</span>
        <div className="flex items-center gap-2">
          {task.comments.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-on-surface-variant">
              <span className="material-symbols-outlined text-[12px]">comment</span>
              {task.comments.length}
            </span>
          )}
          <span className="text-[10px] text-on-surface-variant">{relTime(task.updatedAt)}</span>
        </div>
      </div>
    </>
  )
}

function DroppableZone({ status, isEmpty }: { status: TaskStatus; isEmpty: boolean }) {
  const { setNodeRef } = useSortable({ id: status })
  if (!isEmpty) return <div ref={setNodeRef} className="min-h-[8px]" />
  return (
    <div ref={setNodeRef} className="glass-card p-4 border-dashed flex items-center justify-center min-h-[60px]">
      <span className="text-[11px] text-on-surface-variant/50">Drop here</span>
    </div>
  )
}

// ─── New Task Form ────────────────────────────────────────────────────────────

interface NewTaskForm {
  title: string
  description: string
  dueDate: string
  assignee: string
  assignedBy: string
  project: string
  priority: Priority
}

const EMPTY_FORM: NewTaskForm = {
  title: '', description: '', dueDate: '',
  assignee: 'CTO', assignedBy: 'Moe',
  project: 'MC-V2', priority: 'medium',
}

// ─── Tasks Page ───────────────────────────────────────────────────────────────

const COLUMN_INFO: Record<string, string> = {
  Backlog: 'Tasks waiting to be picked up. Drag here to deprioritize or queue for later.',
  'In Progress': 'Actively being worked on by an agent or human. Limited WIP keeps focus.',
  Review: 'Work complete, pending review or approval before marking done.',
  Blocked: 'Cannot proceed — waiting on a dependency, approval, or external input.',
  Done: 'Completed and verified. Tasks here count toward project progress.',
}

export default function Tasks() {
  const store = useStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterProject, setFilterProject] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [newTask, setNewTask] = useState<NewTaskForm>(EMPTY_FORM)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.tasks.list() as any[]
        // Map backend fields to store Task shape
        const mapped = data.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          status: t.status as TaskStatus,
          priority: t.priority as Priority,
          project: t.project_id || t.project || '',
          assignee: t.assignee || '',
          assignedBy: t.assigned_by || '',
          dueDate: t.due_date || null,
          createdAt: t.created_at || '',
          updatedAt: t.updated_at || '',
          statusHistory: t.status_history || [],
          attachments: t.attachments || [],
          comments: t.comments || [],
        }))
        // Seed the store so the rest of the page works
        mapped.forEach((task: Task) => {
          if (!store.tasks.find(existing => existing.id === task.id)) {
            store.addTask(task)
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const filtered = store.tasks.filter(t => {
    if (filterProject && t.project !== filterProject) return false
    if (filterPriority && t.priority !== filterPriority) return false
    return true
  })

  const activeTask = activeId ? store.tasks.find(t => t.id === activeId) ?? null : null
  const selectedTask = selectedTaskId ? store.tasks.find(t => t.id === selectedTaskId) ?? null : null

  function handleAddTask() {
    if (!newTask.title.trim()) return
    const task: Task = {
      id: store.nextTaskId(),
      title: newTask.title,
      description: newTask.description,
      status: 'Backlog',
      priority: newTask.priority,
      project: newTask.project,
      assignee: newTask.assignee,
      assignedBy: newTask.assignedBy,
      dueDate: newTask.dueDate || null,
      createdAt: '2026-03-28',
      updatedAt: '2026-03-28',
      statusHistory: [{ from: null, to: 'Backlog', at: '2026-03-28', by: getCurrentUser() }],
      attachments: [],
      comments: [],
    }
    store.addTask(task)
    api.tasks.create({
      title: newTask.title,
      description: newTask.description,
      status: 'Backlog',
      priority: newTask.priority,
      project_id: newTask.project,
      assignee: newTask.assignee,
      assigned_by: newTask.assignedBy,
      due_date: newTask.dueDate || null,
    }).catch(() => {})
    setNewTask(EMPTY_FORM)
    setShowAddForm(false)
  }

  function handleDragStart(event: DragStartEvent) { setActiveId(event.active.id as string) }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as string | undefined
    if (!overId) { setOverColumn(null); return }
    const col = TASK_COLUMNS.find(c => c.status === overId)
    if (col) { setOverColumn(col.status); return }
    const overTask = store.tasks.find(t => t.id === overId)
    if (overTask) { setOverColumn(overTask.status); return }
    setOverColumn(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverColumn(null)
    if (!over) return
    const taskId = active.id as string
    const overId = over.id as string
    let targetStatus: TaskStatus | null = null
    const col = TASK_COLUMNS.find(c => c.status === overId)
    if (col) targetStatus = col.status
    else {
      const overTask = store.tasks.find(t => t.id === overId)
      if (overTask) targetStatus = overTask.status
    }
    if (targetStatus) {
      const task = store.tasks.find(t => t.id === taskId)
      if (task && task.status !== targetStatus) {
        store.changeTaskStatus(taskId, targetStatus)
        api.tasks.update(taskId, { status: targetStatus }).catch(() => {})
      }
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-16">
      {loading && (
        <motion.div variants={itemVariants} className="glass-card p-8 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-secondary/30 border-t-secondary animate-spin" />
          <span className="ml-3 text-sm text-on-surface-variant">Loading tasks...</span>
        </motion.div>
      )}
      {error && (
        <motion.div variants={itemVariants} className="glass-card p-4 border border-amber-500/20">
          <span className="text-xs text-amber-400">{error}</span>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">Operations</div>
        <h1 className="text-4xl font-black text-primary text-glow">Task Board</h1>
        <p className="text-sm text-on-surface-variant mt-2">{store.tasks.length} tasks · {store.tasks.filter(t => t.status === 'In Progress').length} in progress</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex gap-3 flex-wrap items-center">
        <button onClick={() => setShowAddForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm font-semibold hover:bg-secondary/20 transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>New Task
        </button>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
          className="px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all"
        >
          <option value="">All Projects</option>
          {PROJECTS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option><option value="high">High</option>
          <option value="medium">Medium</option><option value="low">Low</option>
        </select>
        {(filterProject || filterPriority) && (
          <button onClick={() => { setFilterProject(''); setFilterPriority('') }}
            className="px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary text-sm transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>Clear
          </button>
        )}
        <span className="ml-auto text-sm text-on-surface-variant self-center">{filtered.length} tasks shown</span>
      </motion.div>

      {/* Add Task Form */}
      {showAddForm && (
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase">New Task</div>
            <button onClick={() => { setShowAddForm(false); setNewTask(EMPTY_FORM) }} className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <input type="text" placeholder="Task title..." value={newTask.title}
            onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
            className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-primary/[0.08] text-base font-semibold text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/30 focus:outline-none transition-all"
            autoFocus
          />
          <textarea placeholder="Add a description..." value={newTask.description}
            onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} rows={2}
            className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/30 focus:outline-none transition-all resize-none"
          />
          <div className="grid grid-cols-6 gap-3">
            <div>
              <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Due Date</div>
              <input type="date" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all" />
            </div>
            <div>
              <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Assignee</div>
              <select value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
              >{MENTIONABLES.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select>
            </div>
            <div>
              <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Assigned By</div>
              <select value={newTask.assignedBy} onChange={e => setNewTask(p => ({ ...p, assignedBy: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
              >{MENTIONABLES.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select>
            </div>
            <div>
              <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Project</div>
              <select value={newTask.project} onChange={e => setNewTask(p => ({ ...p, project: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
              >{PROJECTS_LIST.map(p => <option key={p} value={p}>{p}</option>)}</select>
            </div>
            <div>
              <div className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-[0.1em] mb-1">Priority</div>
              <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as Priority }))}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
              >
                <option value="critical">Critical</option><option value="high">High</option>
                <option value="medium">Medium</option><option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleAddTask}
                className="w-full py-2 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold hover:bg-secondary/20 transition-all"
              >Create</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Kanban Board */}
      <motion.div variants={itemVariants}>
        <DndContext sensors={sensors} collisionDetection={closestCenter}
          onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-5 gap-4">
            {TASK_COLUMNS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.status)
              const isOver = overColumn === col.status && activeId !== null
              return (
                <SortableContext key={col.status} id={col.status} items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className={['flex flex-col gap-3 min-w-0 rounded-2xl p-2 -m-2 transition-all', isOver ? 'ring-1 ring-primary/20 bg-primary/[0.03]' : ''].join(' ')}>
                    <div className={`flex items-center gap-2 pb-3 border-b ${col.borderColor}`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${col.dotColor}`} />
                      <span className={`text-[11px] font-bold tracking-[0.1em] uppercase ${col.color} truncate`}>{col.status}</span>
                      {COLUMN_INFO[col.status] && <InfoIcon text={COLUMN_INFO[col.status]} />}
                      <span className="ml-auto text-[11px] text-on-surface-variant font-semibold shrink-0">{colTasks.length}</span>
                    </div>
                    {colTasks.map(task => (
                      <SortableTaskCard key={task.id} task={task} onClick={() => setSelectedTaskId(task.id)} />
                    ))}
                    <DroppableZone status={col.status} isEmpty={colTasks.length === 0} />
                  </div>
                </SortableContext>
              )
            })}
          </div>
          <DragOverlay>
            {activeTask && (
              <div className="glass-card p-4 shadow-2xl rotate-2 w-[200px]"
                style={{ borderLeft: `3px solid ${STATUS_ACCENT[activeTask.status]}` }}
              >
                <TaskCardContent task={activeTask} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </motion.div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onStatusChange={(id: string, status: TaskStatus) => { store.changeTaskStatus(id, status); api.tasks.update(id, { status }).catch(() => {}) }}
        onAddComment={(taskId: string, comment: Comment) => { store.addTaskComment(taskId, comment); api.tasks.comment(taskId, { body: comment.text, author_type: 'human', author_id: comment.author.toLowerCase(), author_name: comment.author }).catch(() => {}) }}
      />
    </motion.div>
  )
}
