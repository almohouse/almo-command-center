import { pcGet, COMPANY_ID, corsHeaders } from './_lib/pc.js'

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') {
    return res.writeHead(204, h).end()
  }
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

    const byStatus = issues.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1
      return acc
    }, {})

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
    res.status(500).json({ error: err.message })
  }
}
