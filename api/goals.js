import { pcGet, COMPANY_ID, corsHeaders, isUnavailable } from './_lib/pc.js'

const MOCK_GOALS = {
  goals: [
    { id: 'mock-1', title: 'Reach 8 Chiefs live', description: 'All 8 C-suite roles filled and active', current: 3, target: 8, unit: 'chiefs', status: 'in_progress', source: 'mock' },
    { id: 'mock-2', title: 'Zero human middleware tasks', description: 'All routine tasks handled by agents', current: 0, target: 100, unit: 'tasks', status: 'in_progress', source: 'mock' },
  ],
  agentCount: 3,
  activeChiefs: 2,
}

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') return res.writeHead(204, h).end()
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
  } catch (err) {
    if (isUnavailable(err)) return res.status(200).json(MOCK_GOALS)
    res.status(200).json({ goals: [], agentCount: 0, activeChiefs: 0 })
  }
}
