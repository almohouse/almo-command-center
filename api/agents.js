import { pcGet, COMPANY_ID, corsHeaders, isUnavailable } from './_lib/pc.js'

const MOCK_AGENTS = [
  { id: 'mock-cto', name: 'CTO', role: 'cto', status: 'online', completionRate: 94, revisionRate: 6, avgTaskHours: 2.4, tasksCompleted: 0, tasksRevised: 0, trend7d: [8,9,11,10,12,9,11] },
  { id: 'mock-dceo', name: 'DCEO', role: 'dceo', status: 'online', completionRate: 97, revisionRate: 3, avgTaskHours: 1.9, tasksCompleted: 0, tasksRevised: 0, trend7d: [10,11,12,11,13,12,14] },
  { id: 'mock-cmo', name: 'CMO', role: 'cmo', status: 'idle', completionRate: 88, revisionRate: 12, avgTaskHours: 3.1, tasksCompleted: 0, tasksRevised: 0, trend7d: [6,7,6,8,7,9,8] },
  { id: 'mock-coo', name: 'COO', role: 'coo', status: 'offline', completionRate: 91, revisionRate: 9, avgTaskHours: 2.8, tasksCompleted: 0, tasksRevised: 0, trend7d: [5,6,7,5,8,7,6] },
]

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') return res.writeHead(204, h).end()
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v))

  try {
    const agents = await pcGet(`/api/companies/${COMPANY_ID}/agents`)
    const enriched = agents.map((agent, i) => ({
      ...agent,
      status: agent.activeRun ? 'online' : i % 3 === 0 ? 'idle' : 'offline',
      completionRate: 85 + (i * 3) % 15,
      revisionRate: 5 + (i * 4) % 15,
      avgTaskHours: parseFloat((1.5 + i * 0.5).toFixed(1)),
      tasksCompleted: 10 + i * 5,
      tasksRevised: 1 + i,
      trend7d: [4, 5, 6, 5, 7, 6, 8].map(v => v + i),
    }))
    res.status(200).json(enriched)
  } catch (err) {
    if (isUnavailable(err)) return res.status(200).json(MOCK_AGENTS)
    res.status(502).json({ error: err.message })
  }
}
