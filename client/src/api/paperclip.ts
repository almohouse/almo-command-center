import { api } from './client'

export interface Agent {
  id: string
  name: string
  role: string
  status: 'online' | 'offline' | 'idle'
  lastSeen?: string
  currentTask?: string
  tasksCompleted: number
  tasksRevised: number
  avgTaskHours: number
  completionRate: number
  revisionRate: number
  trend7d: number[]
}

export interface Issue {
  id: string
  identifier: string
  title: string
  status: string
  priority: string
  assigneeAgentId?: string
  projectId?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface Project {
  id: string
  name: string
  status: string
  issueCount: number
  doneCount: number
}

export interface Approval {
  id: string
  title: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  requestedById?: string
  requestedByName?: string
}

export interface DashboardData {
  agents: Agent[]
  issues: {
    total: number
    byStatus: Record<string, number>
    recent: Issue[]
    velocity: { date: string; count: number }[]
  }
  approvals: Approval[]
  projects: Project[]
}

export interface Anomaly {
  id: string
  type: string
  title: string
  time: string
  severity: 'critical' | 'high' | 'warning' | 'info'
  detail?: string
  issueId?: string
}

export interface Risk {
  id: string
  title: string
  severity: 'critical' | 'high' | 'warning' | 'info'
  countdown: string
  mitigation: string
  issueId?: string
}

export interface Goal {
  id: string
  title: string
  description: string
  current: number
  target: number
  unit: string
  status: 'done' | 'in_progress'
  source: 'live' | 'mock'
}

export interface Conversation {
  id: string
  from: string
  agentId: string
  message: string
  time: string
  issueIdentifier?: string
  issueTitle?: string
  createdAt: string
}

export const paperclipApi = {
  dashboard: () => api.get<DashboardData>('/dashboard'),
  agents: () => api.get<Agent[]>('/agents'),
  issues: (params?: string) => api.get<Issue[]>(`/issues${params ? '?' + params : ''}`),
  approvals: () => api.get<Approval[]>('/approvals'),
  projects: () => api.get<Project[]>('/projects'),
  intelligence: () => api.get<{ anomalies: Anomaly[]; risks: Risk[] }>('/intelligence'),
  goals: () => api.get<{ goals: Goal[]; agentCount: number; activeChiefs: number }>('/goals'),
  conversations: () => api.get<Conversation[]>('/conversations'),
  resolveApproval: (id: string, action: 'approve' | 'reject', comment?: string) =>
    api.post(`/approvals/${id}/resolve`, { action, comment }),
  sendCommand: (agentId: string, agentName: string, message: string) =>
    api.post<{ status: string; channel: string; message: string }>('/command', { agentId, agentName, message }),

  // Council Meeting
  councilMessages: () => api.get<{ session: CouncilSession; messages: CouncilMessage[] }>('/council/messages'),
  councilStart: () => api.post<{ status: string; session: CouncilSession }>('/council/start', {}),
  councilEnd: (messages: CouncilMessage[]) =>
    api.post<{ status: string; mom: string; postedIssueIdentifier: string | null }>('/council/end', { messages }),

  // Morning Brief
  morningBrief: () => api.get<MorningBrief>('/morning-brief'),

  // Vault Search
  vaultSearch: (q: string) => api.get<VaultSearchResult>(`/vault/search?q=${encodeURIComponent(q)}`),
}

export interface CouncilSession {
  active: boolean
  startedAt: string | null
}

export interface CouncilMessage {
  id: string
  from: string
  agentId: string
  role: string
  message: string
  time: string
  isSystem: boolean
  createdAt?: string
  source?: string
  issueRef?: string
}

export interface MorningBrief {
  date: string
  generatedAt: string
  summary: {
    onlineAgents: number
    totalAgents: number
    blockedCount: number
    inProgressCount: number
    criticalCount: number
  }
  topBlockers: { id: string; identifier: string; title: string; priority: string }[]
  activeAgents: { name: string; task: string | null }[]
  revenue: { today: number; mtd: number; target: number; currency: string } | null
}

export interface VaultSearchResult {
  results: VaultResult[]
  query: string
  total: number
}

export interface VaultResult {
  id: string
  identifier: string
  title: string
  status: string
  priority: string
  excerpt: string
  updatedAt: string
  type: 'issue'
}

// Business Inputs
export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  createdAt: string
}

export interface Shipment {
  id: string
  orderId: string
  carrier: string
  status: string
  eta: string | null
  notes: string
  createdAt: string
}

export interface InventoryNote {
  id: string
  sku: string
  productName: string
  change: number
  reason: string
  createdAt: string
}

export interface BusinessInputs {
  expenses: Expense[]
  shipments: Shipment[]
  inventory: InventoryNote[]
}

export const businessInputsApi = {
  getAll: () => api.get<BusinessInputs>('/business-inputs'),
  addExpense: (data: { description: string; amount: number; category?: string; date?: string }) =>
    api.post<Expense>('/business-inputs/expenses', data),
  addShipment: (data: { orderId: string; carrier?: string; status?: string; eta?: string; notes?: string }) =>
    api.post<Shipment>('/business-inputs/shipments', data),
  addInventory: (data: { sku: string; productName?: string; change: number; reason?: string }) =>
    api.post<InventoryNote>('/business-inputs/inventory', data),
}
