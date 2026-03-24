import { pcGet, pcPost, COMPANY_ID, corsHeaders } from './_lib/pc.js'

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') {
    return res.writeHead(204, h).end()
  }
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v))

  try {
    const approvals = await pcGet(`/api/companies/${COMPANY_ID}/approvals`)
    const mapped = approvals.map(a => ({
      id: a.id,
      title: a.title || a.description?.substring(0, 80) || 'Approval request',
      status: a.status,
      createdAt: a.createdAt,
      requestedById: a.requestedByAgentId || a.createdByAgentId,
      requestedByName: a.requestedByName || null,
    }))
    res.status(200).json(mapped)
  } catch {
    res.status(200).json([])
  }
}
