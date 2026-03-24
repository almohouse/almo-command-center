import { pcGet, COMPANY_ID, corsHeaders } from '../_lib/pc.js'

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') {
    return res.writeHead(204, h).end()
  }
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v))

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`)
  const q = searchParams.get('q') || ''
  if (q.trim().length < 2) {
    return res.status(200).json({ results: [], query: q, total: 0 })
  }

  try {
    const issues = await pcGet(`/api/companies/${COMPANY_ID}/issues?q=${encodeURIComponent(q)}&limit=20`)
    const results = issues.map(i => ({
      id: i.id,
      identifier: i.identifier,
      title: i.title,
      status: i.status,
      priority: i.priority,
      excerpt: i.description?.replace(/[#*`]/g, '').substring(0, 120) || '',
      updatedAt: i.updatedAt,
      type: 'issue',
    }))
    res.status(200).json({ results, query: q, total: results.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
