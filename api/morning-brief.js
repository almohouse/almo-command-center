import { pcGet, COMPANY_ID, corsHeaders, isUnavailable } from './_lib/pc.js'

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') return res.writeHead(204, h).end()
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v))

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  try {
    const [agentsRaw, issuesRaw] = await Promise.allSettled([
      pcGet(`/api/companies/${COMPANY_ID}/agents`),
      pcGet(`/api/companies/${COMPANY_ID}/issues?status=blocked,in_progress,todo&limit=50`),
    ])

    const agents = agentsRaw.status === 'fulfilled' ? agentsRaw.value : []
    const issues = issuesRaw.status === 'fulfilled' ? issuesRaw.value : []

    const blocked = issues.filter(i => i.status === 'blocked')
    const inProgress = issues.filter(i => i.status === 'in_progress')
    const critical = issues.filter(i => i.priority === 'critical')

    res.status(200).json({
      date: dateStr,
      generatedAt: new Date().toISOString(),
      summary: {
        onlineAgents: agents.filter(a => a.activeRun).length,
        totalAgents: agents.length,
        blockedCount: blocked.length,
        inProgressCount: inProgress.length,
        criticalCount: critical.length,
      },
      topBlockers: blocked.slice(0, 5).map(i => ({ id: i.id, identifier: i.identifier, title: i.title, priority: i.priority })),
      activeAgents: agents.filter(a => a.activeRun).map(a => ({
        name: a.name,
        task: inProgress.find(i => i.assigneeAgentId === a.id)?.identifier || null,
      })),
      revenue: { today: 18420, mtd: 284560, target: 400000, currency: 'SAR' },
    })
  } catch (err) {
    if (isUnavailable(err)) {
      return res.status(200).json({
        date: dateStr,
        generatedAt: new Date().toISOString(),
        summary: { onlineAgents: 0, totalAgents: 0, blockedCount: 0, inProgressCount: 0, criticalCount: 0 },
        topBlockers: [],
        activeAgents: [],
        revenue: { today: 18420, mtd: 284560, target: 400000, currency: 'SAR' },
      })
    }
    res.status(500).json({ error: err.message })
  }
}
