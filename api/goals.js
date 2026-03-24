import { pcGet, COMPANY_ID, corsHeaders } from './_lib/pc.js'

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') {
    return res.writeHead(204, h).end()
  }
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v))

  try {
    const [goalsRaw, agentsRaw] = await Promise.allSettled([
      pcGet(`/api/companies/${COMPANY_ID}/goals`),
      pcGet(`/api/companies/${COMPANY_ID}/agents`),
    ])

    const rawGoals = goalsRaw.status === 'fulfilled' ? goalsRaw.value : []
    const agents = agentsRaw.status === 'fulfilled' ? agentsRaw.value : []

    const goals = rawGoals.map(g => ({
      id: g.id,
      title: g.title || g.name,
      description: g.description || '',
      current: g.current ?? 0,
      target: g.target ?? 100,
      unit: g.unit || 'tasks',
      status: g.status || 'in_progress',
      source: 'live',
    }))

    res.status(200).json({ goals, agentCount: agents.length, activeChiefs: agents.filter(a => a.activeRun).length })
  } catch {
    res.status(200).json({ goals: [], agentCount: 0, activeChiefs: 0 })
  }
}
