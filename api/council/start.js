import { corsHeaders } from '../_lib/pc.js'

export default function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') {
    return res.writeHead(204, h).end()
  }
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v))
  res.status(200).json({ status: 'started', session: { active: true, startedAt: new Date().toISOString() } })
}
