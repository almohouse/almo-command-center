import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { MENTIONABLES } from './agents'

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type TaskStatus = 'Blocked' | 'Backlog' | 'In Progress' | 'Review' | 'Done'
export type ProjectStatus = 'active' | 'paused' | 'cancelled' | 'completed' | 'planned'

export interface StatusChange {
  from: TaskStatus | null
  to: TaskStatus
  at: string
  by: string
}

export interface Attachment {
  id: string
  name: string
  size: string
  addedAt: string
  addedBy: string
}

export interface Comment {
  id: string
  author: string
  text: string
  createdAt: string
}

export interface Risk {
  id: string
  text: string
  severity: 'high' | 'medium' | 'low'
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  project: string
  assignee: string
  assignedBy: string
  dueDate: string | null
  createdAt: string
  updatedAt: string
  statusHistory: StatusChange[]
  attachments: Attachment[]
  comments: Comment[]
}

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  lead: string
  assignedBy: string
  targetEndDate: string | null
  goal: string
  risks: Risk[]
  dependencies: string[]
  comments: Comment[]
  createdAt: string
  updatedAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const TASK_COLUMNS: { status: TaskStatus; color: string; borderColor: string; dotColor: string }[] = [
  { status: 'Blocked', color: 'text-error', borderColor: 'border-error/20', dotColor: 'bg-error' },
  { status: 'Backlog', color: 'text-amber-400', borderColor: 'border-amber-500/20', dotColor: 'bg-amber-400' },
  { status: 'In Progress', color: 'text-secondary', borderColor: 'border-secondary/20', dotColor: 'bg-secondary' },
  { status: 'Review', color: 'text-purple-400', borderColor: 'border-purple-400/20', dotColor: 'bg-purple-400' },
  { status: 'Done', color: 'text-green-400', borderColor: 'border-green-400/20', dotColor: 'bg-green-400' },
]

export const STATUS_ACCENT: Record<TaskStatus, string> = {
  Blocked: '#ff6e84',
  Backlog: '#fbbf24',
  'In Progress': '#cacafe',
  Review: '#c084fc',
  Done: '#4ade80',
}

export const PRIORITY_BORDER: Record<Priority, string> = {
  critical: '#ff6e84',
  high: '#f59e0b',
  medium: '#cacafe',
  low: '#acaaae',
}

export const PROJECTS_LIST = ['MC-V2', 'Product Launch', 'Discovery', 'Operations', '2026-BD-ARAMCO', '2026-MK-RMDN', '2026-OP-SUPPLY']

export const PROJECT_STATUS_BADGE: Record<ProjectStatus, { label: string; classes: string }> = {
  active: { label: 'Active', classes: 'bg-secondary/10 text-secondary border-secondary/20' },
  planned: { label: 'Planned', classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  completed: { label: 'Completed', classes: 'bg-green-500/10 text-green-400 border-green-500/20' },
  paused: { label: 'Paused', classes: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  cancelled: { label: 'Cancelled', classes: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export const GOAL_COLORS: Record<string, string> = {
  Infrastructure: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Revenue: 'bg-green-500/10 text-green-400 border-green-500/20',
  Marketing: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Product: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  B2B: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Operations: 'bg-secondary/10 text-secondary border-secondary/20',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getCurrentUser() {
  return localStorage.getItem('almo_user') === 'alaa' ? 'Alaa' : 'Moe'
}

export function relTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date('2026-03-28')
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff <= 0) return 'today'
  if (diff === 1) return '1d ago'
  if (diff < 7) return `${diff}d ago`
  return `${Math.floor(diff / 7)}w ago`
}

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function fmtTimestamp(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function renderMentionText(text: string) {
  const parts = text.split(/(@\w[\w-]*)/)
  return parts.map((part, i) => {
    if (part.startsWith('@') && MENTIONABLES.some(m => '@' + m.name === part)) {
      return <span key={i} className="text-secondary font-semibold">{part}</span>
    }
    return <span key={i}>{part}</span>
  })
}

export function generateProjectSummary(project: Project, tasks: Task[]): string {
  const ptasks = tasks.filter(t => t.project === project.id)
  if (ptasks.length === 0) return 'No tasks assigned to this project yet.'
  const done = ptasks.filter(t => t.status === 'Done').length
  const blocked = ptasks.filter(t => t.status === 'Blocked').length
  const inProgress = ptasks.filter(t => t.status === 'In Progress').length
  const overdue = ptasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date('2026-03-28') && t.status !== 'Done').length
  const pct = Math.round((done / ptasks.length) * 100)

  let summary = `${pct}% complete — ${done}/${ptasks.length} tasks done.`
  if (inProgress > 0) summary += ` ${inProgress} in progress.`
  if (blocked > 0) summary += ` ${blocked} blocked — needs attention.`
  if (overdue > 0) summary += ` ${overdue} task${overdue > 1 ? 's' : ''} overdue.`
  if (pct === 100) summary = `All ${ptasks.length} tasks complete. Project ready for final review.`
  if (pct === 0 && project.status === 'planned') summary = `Project is planned with ${ptasks.length} tasks queued. No work started yet.`
  return summary
}

// ─── Mock Data: Tasks ─────────────────────────────────────────────────────────

const INITIAL_TASKS: Task[] = [
  {
    id: 'ALMO-089', title: 'Fix checkout flow bug — payment gateway timeout on Mada',
    description: 'Customers are experiencing timeout errors when paying via Mada on mobile. The payment gateway response time exceeds 30s.',
    status: 'Blocked', priority: 'critical', project: 'MC-V2', assignee: 'CTO', assignedBy: 'Moe', dueDate: '2026-03-30',
    createdAt: '2026-03-20', updatedAt: '2026-03-26',
    statusHistory: [
      { from: null, to: 'Backlog', at: '2026-03-20', by: 'Moe' },
      { from: 'Backlog', to: 'In Progress', at: '2026-03-22', by: 'CTO' },
      { from: 'In Progress', to: 'Blocked', at: '2026-03-26', by: 'CTO' },
    ],
    attachments: [{ id: 'a1', name: 'mada-error-log.txt', size: '12 KB', addedAt: '2026-03-26', addedBy: 'CTO' }],
    comments: [
      { id: 'c1', author: 'CTO', text: 'Blocked on Mada sandbox credentials. @Moe can you reach out to the payment provider?', createdAt: '2026-03-26T14:30:00Z' },
      { id: 'c2', author: 'Moe', text: 'On it. I\'ll email them today and CC @CFO for invoicing context.', createdAt: '2026-03-26T15:10:00Z' },
    ],
  },
  {
    id: 'ALMO-090', title: 'Design keyboard tray packaging',
    description: 'Create packaging design for the keyboard tray product. Must align with ALMO brand guidelines.',
    status: 'Backlog', priority: 'high', project: 'Product Launch', assignee: 'Scout', assignedBy: 'DCEO', dueDate: '2026-04-10',
    createdAt: '2026-03-18', updatedAt: '2026-03-24',
    statusHistory: [{ from: null, to: 'Backlog', at: '2026-03-18', by: 'DCEO' }],
    attachments: [],
    comments: [{ id: 'c3', author: 'Scout', text: 'Competitive packaging analysis done. Ready for mockups once @CRDO finalizes dimensions.', createdAt: '2026-03-24T10:00:00Z' }],
  },
  {
    id: 'ALMO-091', title: 'Set up Airtable sync for Mission Control',
    description: 'Implement bidirectional sync between Airtable bases and the Mission Control backend.',
    status: 'In Progress', priority: 'high', project: 'MC-V2', assignee: 'CTO', assignedBy: 'Moe', dueDate: '2026-03-29',
    createdAt: '2026-03-22', updatedAt: '2026-03-27',
    statusHistory: [
      { from: null, to: 'Backlog', at: '2026-03-22', by: 'Moe' },
      { from: 'Backlog', to: 'In Progress', at: '2026-03-25', by: 'CTO' },
    ],
    attachments: [{ id: 'a2', name: 'airtable-schema.json', size: '4 KB', addedAt: '2026-03-25', addedBy: 'CTO' }],
    comments: [{ id: 'c4', author: 'CTO', text: 'Webhook listener working. @CTO-Builder implementing field mapping.', createdAt: '2026-03-27T09:00:00Z' }],
  },
  {
    id: 'ALMO-092', title: 'Product Discovery report — Ramadan comfort products',
    description: 'Research and compile discovery report for Ramadan-specific comfort products.',
    status: 'Review', priority: 'medium', project: 'Discovery', assignee: 'Scout', assignedBy: 'DCEO', dueDate: '2026-03-28',
    createdAt: '2026-03-15', updatedAt: '2026-03-25',
    statusHistory: [
      { from: null, to: 'Backlog', at: '2026-03-15', by: 'DCEO' },
      { from: 'Backlog', to: 'In Progress', at: '2026-03-18', by: 'Scout' },
      { from: 'In Progress', to: 'Review', at: '2026-03-25', by: 'Scout' },
    ],
    attachments: [{ id: 'a3', name: 'ramadan-discovery-v2.pdf', size: '2.3 MB', addedAt: '2026-03-25', addedBy: 'Scout' }],
    comments: [
      { id: 'c5', author: 'Scout', text: 'Report complete. 3 viable opportunities. @DCEO please review.', createdAt: '2026-03-25T16:00:00Z' },
      { id: 'c6', author: 'DCEO', text: 'Reviewing. Will need @Moe to sign off on budget.', createdAt: '2026-03-26T08:00:00Z' },
    ],
  },
  {
    id: 'ALMO-093', title: 'Supplier negotiation — Cocoon Pro fabric',
    description: 'Negotiate new pricing terms with Quanzhou fabric supplier for Q2 2026.',
    status: 'Done', priority: 'low', project: 'Operations', assignee: 'CFO', assignedBy: 'Moe', dueDate: '2026-03-18',
    createdAt: '2026-03-10', updatedAt: '2026-03-18',
    statusHistory: [
      { from: null, to: 'Backlog', at: '2026-03-10', by: 'Moe' },
      { from: 'Backlog', to: 'In Progress', at: '2026-03-12', by: 'CFO' },
      { from: 'In Progress', to: 'Done', at: '2026-03-18', by: 'CFO' },
    ],
    attachments: [],
    comments: [{ id: 'c7', author: 'CFO', text: 'Secured 12% reduction. Strong outcome given shipping rates.', createdAt: '2026-03-18T12:00:00Z' }],
  },
  {
    id: 'ALMO-094', title: 'Deploy Mission Control v0.1 to staging',
    description: 'Deploy current build to staging on Fly.io. Configure env vars, smoke tests.',
    status: 'In Progress', priority: 'high', project: 'MC-V2', assignee: 'CTO', assignedBy: 'Moe', dueDate: '2026-03-28',
    createdAt: '2026-03-25', updatedAt: '2026-03-27',
    statusHistory: [
      { from: null, to: 'Backlog', at: '2026-03-25', by: 'Moe' },
      { from: 'Backlog', to: 'In Progress', at: '2026-03-26', by: 'CTO' },
    ],
    attachments: [], comments: [],
  },
  {
    id: 'ALMO-095', title: 'Aramco B2B proposal deck',
    description: 'Executive presentation for Aramco B2B bulk order. Arabic/English.',
    status: 'Backlog', priority: 'high', project: '2026-BD-ARAMCO', assignee: 'DCEO', assignedBy: 'Moe', dueDate: '2026-04-05',
    createdAt: '2026-03-21', updatedAt: '2026-03-21',
    statusHistory: [{ from: null, to: 'Backlog', at: '2026-03-21', by: 'Moe' }],
    attachments: [], comments: [],
  },
  {
    id: 'ALMO-096', title: 'Set up automated ZATCA-compliant invoice generation',
    description: 'Implement e-invoice generation. Integrate with Fatoora portal API.',
    status: 'Blocked', priority: 'high', project: 'Operations', assignee: 'CFO', assignedBy: 'DCEO', dueDate: '2026-04-01',
    createdAt: '2026-03-19', updatedAt: '2026-03-26',
    statusHistory: [
      { from: null, to: 'Backlog', at: '2026-03-19', by: 'DCEO' },
      { from: 'Backlog', to: 'Blocked', at: '2026-03-26', by: 'CFO' },
    ],
    attachments: [],
    comments: [{ id: 'c8', author: 'CFO', text: 'Blocked on Fatoora sandbox access. @Moe ZATCA support said 3-5 days.', createdAt: '2026-03-26T11:00:00Z' }],
  },
  {
    id: 'ALMO-097', title: 'Ramadan campaign content calendar',
    description: '30-day content calendar across Instagram, TikTok, and Snapchat.',
    status: 'Review', priority: 'medium', project: '2026-MK-RMDN', assignee: 'CMO', assignedBy: 'DCEO', dueDate: '2026-03-29',
    createdAt: '2026-03-17', updatedAt: '2026-03-26',
    statusHistory: [
      { from: null, to: 'Backlog', at: '2026-03-17', by: 'DCEO' },
      { from: 'Backlog', to: 'In Progress', at: '2026-03-20', by: 'CMO' },
      { from: 'In Progress', to: 'Review', at: '2026-03-26', by: 'CMO' },
    ],
    attachments: [{ id: 'a4', name: 'ramadan-content-plan.xlsx', size: '156 KB', addedAt: '2026-03-26', addedBy: 'CMO' }],
    comments: [{ id: 'c9', author: 'CMO', text: 'Calendar ready. 30 posts mapped. @Alaa please review influencer slots.', createdAt: '2026-03-26T17:00:00Z' }],
  },
  {
    id: 'ALMO-098', title: 'Update product photography — Cocoon Pro lifestyle shots',
    description: 'Arrange new lifestyle photography for Cocoon Pro. Saudi home setting.',
    status: 'Backlog', priority: 'medium', project: 'Product Launch', assignee: 'DCEO', assignedBy: 'Moe', dueDate: '2026-04-15',
    createdAt: '2026-03-14', updatedAt: '2026-03-20',
    statusHistory: [{ from: null, to: 'Backlog', at: '2026-03-14', by: 'Moe' }],
    attachments: [], comments: [],
  },
  {
    id: 'ALMO-099', title: 'Supply chain risk assessment Q2',
    description: 'Assess supply chain risks for Q2 2026.',
    status: 'Done', priority: 'low', project: '2026-OP-SUPPLY', assignee: 'CFO', assignedBy: 'DCEO', dueDate: '2026-03-15',
    createdAt: '2026-03-05', updatedAt: '2026-03-15',
    statusHistory: [
      { from: null, to: 'Backlog', at: '2026-03-05', by: 'DCEO' },
      { from: 'Backlog', to: 'In Progress', at: '2026-03-08', by: 'CFO' },
      { from: 'In Progress', to: 'Done', at: '2026-03-15', by: 'CFO' },
    ],
    attachments: [{ id: 'a5', name: 'q2-risk-assessment.pdf', size: '890 KB', addedAt: '2026-03-15', addedBy: 'CFO' }],
    comments: [],
  },
  {
    id: 'ALMO-100', title: 'MC-V2 backend API v1 complete',
    description: 'All core API endpoints implemented, tested, and documented.',
    status: 'Done', priority: 'high', project: 'MC-V2', assignee: 'CTO', assignedBy: 'Moe', dueDate: '2026-03-20',
    createdAt: '2026-03-01', updatedAt: '2026-03-20',
    statusHistory: [
      { from: null, to: 'Backlog', at: '2026-03-01', by: 'Moe' },
      { from: 'Backlog', to: 'In Progress', at: '2026-03-05', by: 'CTO' },
      { from: 'In Progress', to: 'Review', at: '2026-03-18', by: 'CTO' },
      { from: 'Review', to: 'Done', at: '2026-03-20', by: 'Moe' },
    ],
    attachments: [],
    comments: [{ id: 'c10', author: 'Moe', text: 'Great work. API docs are clean. Approved and merged.', createdAt: '2026-03-20T10:00:00Z' }],
  },
]

// ─── Mock Data: Projects ──────────────────────────────────────────────────────

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'MC-V2', name: 'Mission Control V2', description: 'Business command center for ALMO — real-time metrics, agent management, and operations hub.',
    status: 'active', lead: 'CTO', assignedBy: 'Moe', targetEndDate: '2026-04-15', goal: 'Infrastructure',
    risks: [{ id: 'r1', text: 'Mada payment integration blocked on sandbox creds', severity: 'high' }],
    dependencies: [], comments: [
      { id: 'pc1', author: 'Moe', text: 'Top priority. Need staging URL by end of week.', createdAt: '2026-03-25T08:00:00Z' },
    ],
    createdAt: '2026-03-01', updatedAt: '2026-03-27',
  },
  {
    id: 'Product Launch', name: 'Weighted Blanket Launch', description: 'Launch ALMO weighted blanket. Sourcing, branding, packaging, and go-to-market strategy.',
    status: 'active', lead: 'CRDO', assignedBy: 'Moe', targetEndDate: '2026-05-01', goal: 'Revenue',
    risks: [{ id: 'r2', text: 'Supplier lead time may push launch to June', severity: 'medium' }],
    dependencies: ['2026-OP-SUPPLY'], comments: [],
    createdAt: '2026-03-05', updatedAt: '2026-03-24',
  },
  {
    id: '2026-MK-RMDN', name: 'Ramadan Campaign', description: 'Integrated Ramadan marketing campaign across social, paid, and influencer channels.',
    status: 'planned', lead: 'CMO', assignedBy: 'DCEO', targetEndDate: '2026-04-25', goal: 'Marketing',
    risks: [{ id: 'r3', text: 'Content production timeline is tight — 2 days to launch', severity: 'high' }],
    dependencies: [], comments: [],
    createdAt: '2026-03-10', updatedAt: '2026-03-21',
  },
  {
    id: 'Discovery', name: 'Keyboard Tray Research', description: 'Product discovery and supplier research for ergonomic keyboard tray.',
    status: 'active', lead: 'Scout', assignedBy: 'DCEO', targetEndDate: '2026-04-20', goal: 'Product',
    risks: [], dependencies: [], comments: [],
    createdAt: '2026-03-08', updatedAt: '2026-03-25',
  },
  {
    id: '2026-BD-ARAMCO', name: 'Aramco B2B Deal', description: 'Strategic B2B partnership with Saudi Aramco for bulk ergonomic product orders.',
    status: 'active', lead: 'DCEO', assignedBy: 'Moe', targetEndDate: '2026-05-15', goal: 'B2B',
    risks: [{ id: 'r4', text: 'Aramco procurement cycle may be 6-8 weeks', severity: 'medium' }],
    dependencies: ['Product Launch'], comments: [],
    createdAt: '2026-03-12', updatedAt: '2026-03-22',
  },
  {
    id: '2026-OP-SUPPLY', name: 'Supply Chain Optimization', description: 'Reduce supply chain costs by 20% through diversification and better terms.',
    status: 'active', lead: 'CFO', assignedBy: 'DCEO', targetEndDate: '2026-06-01', goal: 'Operations',
    risks: [{ id: 'r5', text: 'Currency fluctuation risk on CNY/SAR', severity: 'low' }],
    dependencies: [], comments: [],
    createdAt: '2026-03-01', updatedAt: '2026-03-19',
  },
  {
    id: 'Operations', name: 'Core Operations', description: 'Internal operational infrastructure — invoicing, compliance, and process automation.',
    status: 'active', lead: 'CFO', assignedBy: 'DCEO', targetEndDate: null, goal: 'Operations',
    risks: [{ id: 'r6', text: 'ZATCA sandbox access delayed', severity: 'high' }],
    dependencies: [], comments: [],
    createdAt: '2026-02-15', updatedAt: '2026-03-26',
  },
]

// ─── Store Context ────────────────────────────────────────────────────────────

interface StoreState {
  tasks: Task[]
  projects: Project[]
  addTask: (task: Task) => void
  updateTask: (id: string, update: Partial<Task>) => void
  changeTaskStatus: (id: string, newStatus: TaskStatus) => void
  addTaskComment: (taskId: string, comment: Comment) => void
  addProject: (project: Project) => void
  updateProject: (id: string, update: Partial<Project>) => void
  addProjectComment: (projectId: string, comment: Comment) => void
  getProjectTasks: (projectId: string) => Task[]
  nextTaskId: () => string
}

const StoreContext = createContext<StoreState | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS)

  const addTask = useCallback((task: Task) => {
    setTasks(prev => [task, ...prev])
  }, [])

  const updateTask = useCallback((id: string, update: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...update, updatedAt: '2026-03-28' } : t))
  }, [])

  const changeTaskStatus = useCallback((id: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const change: StatusChange = { from: t.status, to: newStatus, at: '2026-03-28', by: getCurrentUser() }
      return { ...t, status: newStatus, updatedAt: '2026-03-28', statusHistory: [...t.statusHistory, change] }
    }))
  }, [])

  const addTaskComment = useCallback((taskId: string, comment: Comment) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, comments: [...t.comments, comment] } : t
    ))
  }, [])

  const addProject = useCallback((project: Project) => {
    setProjects(prev => [project, ...prev])
  }, [])

  const updateProject = useCallback((id: string, update: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...update, updatedAt: '2026-03-28' } : p))
  }, [])

  const addProjectComment = useCallback((projectId: string, comment: Comment) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, comments: [...p.comments, comment] } : p
    ))
  }, [])

  const getProjectTasks = useCallback((projectId: string) => {
    return tasks.filter(t => t.project === projectId)
  }, [tasks])

  const nextTaskId = useCallback(() => {
    const nums = tasks.map(t => parseInt(t.id.replace('ALMO-', ''))).filter(Boolean)
    return `ALMO-${String(Math.max(...nums) + 1).padStart(3, '0')}`
  }, [tasks])

  return (
    <StoreContext.Provider value={{
      tasks, projects, addTask, updateTask, changeTaskStatus, addTaskComment,
      addProject, updateProject, addProjectComment, getProjectTasks, nextTaskId,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
