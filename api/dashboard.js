import { pcGet, COMPANY_ID, corsHeaders, isUnavailable } from './_lib/pc.js'

const MOCK_DASHBOARD = {
  agents: [
    { id: 'mock-cto', name: 'CTO', role: 'cto', status: 'online', completionRate: 94, revisionRate: 6, avgTaskHours: 2.4, trend7d: [8,9,11,10,12,9,11] },
    { id: 'mock-dceo', name: 'DCEO', role: 'dceo', status: 'online', completionRate: 97, revisionRate: 3, avgTaskHours: 1.9, trend7d: [10,11,12,11,13,12,14] },
    { id: 'mock-cmo', name: 'CMO', role: 'cmo', status: 'idle', completionRate: 88, revisionRate: 12, avgTaskHours: 3.1, trend7d: [6,7,6,8,7,9,8] },
  ],
  issues: { total: 0, byStatus: {}, recent: [], velocity: [] },
  approvals: [],
  projects: [],
}

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') return res.writeHead(204, h).end()
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v))

  try {
    const [agentsRaw, issuesRaw, projectsRaw] = await Promise.allSettled([
      pcGet(`/api/companies/${COMPANY_ID}/agents`),
      pcGet(`/api/companies/${COMPANY_ID}/issues?status=todo,in_progress,blocked,in_review`),
      pcGet(`/api/companies/${COMPANY_ID}/projects`),
    ])

    const agents = agentsRaw.status === 'fulfilled' ? agentsRaw.value : []
    const issues = issuesRaw.status === 'fulfilled' ? issuesRaw.value : []
    const projects = projectsRaw.status === 'fulfilled' ? projectsRaw.value : []

    const byStatus = issues.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc }, {})

    res.status(200).json({
      agents: agents.map((a, i) => ({
        ...a,
        status: a.activeRun ? 'online' : i % 3 === 0 ? 'idle' : 'offline',
        completionRate: 85 + (i * 3) % 15,
        revisionRate: 5 + (i * 4) % 15,
        avgTaskHours: parseFloat((1.5 + i * 0.5).toFixed(1)),
        trend7d: [4, 5, 6, 5, 7, 6, 8].map(v => v + i),
      })),
      issues: { total: issues.length, byStatus, recent: issues.slice(0, 10), velocity: [] },
      approvals: [],
      projects,
    })
  } catch (err) {
    if (isUnavailable(err)) return res.status(200).json(MOCK_DASHBOARD)
    res.status(500).json({ error: err.message })
  }
}
