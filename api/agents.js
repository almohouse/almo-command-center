import { pcGet, COMPANY_ID, corsHeaders } from './_lib/pc.js'

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') {
    return res.writeHead(204, h).end()
  }
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
    res.status(502).json({ error: err.message })
  }
}
