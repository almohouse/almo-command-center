export const API_BASE = 'http://localhost:3081/api'

export async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(API_BASE + path)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function patchJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(API_BASE + path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const api = {
  dashboard: {
    summary: () => fetchJSON('/dashboard/summary'),
    actionItems: () => fetchJSON('/dashboard/action-items'),
  },
  sales: {
    list: (params?: string) => fetchJSON('/sales' + (params ? '?' + params : '')),
    get: (id: string) => fetchJSON('/sales/' + id),
    create: (data: unknown) => postJSON('/sales', data),
  },
  expenses: {
    list: (params?: string) => fetchJSON('/expenses' + (params ? '?' + params : '')),
    create: (data: unknown) => postJSON('/expenses', data),
    update: (id: string, data: unknown) => patchJSON('/expenses/' + id, data),
  },
  products: { list: () => fetchJSON('/products') },
  customers: {
    list: () => fetchJSON('/customers'),
    get: (id: string) => fetchJSON('/customers/' + id),
  },
  tasks: {
    list: (params?: string) => fetchJSON('/tasks' + (params ? '?' + params : '')),
    create: (data: unknown) => postJSON('/tasks', data),
    update: (id: string, data: unknown) => patchJSON('/tasks/' + id, data),
    comment: (id: string, data: unknown) => postJSON('/tasks/' + id + '/comments', data),
  },
  projects: {
    list: () => fetchJSON('/projects'),
    create: (data: unknown) => postJSON('/projects', data),
    update: (id: string, data: unknown) => patchJSON('/projects/' + id, data),
  },
  goals: {
    list: () => fetchJSON('/goals'),
    update: (id: string, data: unknown) => patchJSON('/goals/' + id, data),
  },
  agents: {
    list: () => fetchJSON('/agents'),
    get: (id: string) => fetchJSON('/agents/' + id),
    update: (id: string, data: unknown) => patchJSON('/agents/' + id, data),
  },
  approvals: {
    list: () => fetchJSON('/approvals'),
    decide: (id: string, data: unknown) => patchJSON('/approvals/' + id, data),
  },
  budgets: { list: () => fetchJSON('/budgets') },
  pnl: {
    get: (period: string, type: string) => fetchJSON('/pnl?period=' + period + '&type=' + type),
  },
  cashflow: {
    get: () => fetchJSON('/cashflow'),
    forecast: () => fetchJSON('/cashflow/forecast'),
  },
  inventory: {
    valuation: () => fetchJSON('/inventory'),
    batches: () => fetchJSON('/inventory/batches'),
  },
  audio: { episodes: () => fetchJSON('/audio/episodes') },
  config: { get: () => fetchJSON('/config') },
}
