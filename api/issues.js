import { pcGet, COMPANY_ID, corsHeaders } from './_lib/pc.js'

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') {
    return res.writeHead(204, h).end()
  }
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v))

  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`)
    const status = searchParams.get('status') || 'todo,in_progress,blocked,in_review'
    const q = searchParams.get('q')
    let path = `/api/companies/${COMPANY_ID}/issues?status=${encodeURIComponent(status)}`
    if (q) path += `&q=${encodeURIComponent(q)}`
    const issues = await pcGet(path)
    res.status(200).json(issues)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
}
