import { pcGet, COMPANY_ID, corsHeaders } from './_lib/pc.js'

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') {
    return res.writeHead(204, h).end()
  }
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v))

  try {
    const projects = await pcGet(`/api/companies/${COMPANY_ID}/projects`)
    const mapped = await Promise.all(projects.map(async p => {
      let issueCount = 0, doneCount = 0
      try {
        const issues = await pcGet(`/api/companies/${COMPANY_ID}/issues?projectId=${p.id}&limit=200`)
        issueCount = issues.length
        doneCount = issues.filter(i => i.status === 'done').length
      } catch { }
      return { id: p.id, name: p.name, status: p.status, issueCount, doneCount }
    }))
    res.status(200).json(mapped)
  } catch {
    res.status(200).json([])
  }
}
