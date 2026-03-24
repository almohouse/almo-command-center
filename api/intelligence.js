import { pcGet, COMPANY_ID, corsHeaders, isUnavailable } from './_lib/pc.js'

const MOCK_INTELLIGENCE = {
  anomalies: [
    { id: 'mock-1', type: 'info', title: 'Live data unavailable — Paperclip not configured for cloud', time: new Date().toISOString(), severity: 'info', detail: 'Set PAPERCLIP_API_URL in Vercel dashboard to enable live anomaly detection.' },
  ],
  risks: [],
}

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') return res.writeHead(204, h).end()
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v))

  try {
    const issues = await pcGet(`/api/companies/${COMPANY_ID}/issues?status=blocked,in_progress&limit=50`)

    const anomalies = issues
      .filter(i => i.priority === 'critical')
      .slice(0, 5)
      .map(i => ({
        id: i.id,
        type: 'critical_issue',
        title: `Critical: ${i.title.substring(0, 60)}`,
        time: i.updatedAt,
        severity: 'critical',
        detail: i.description?.substring(0, 120),
        issueId: i.identifier,
      }))

    const risks = issues
      .filter(i => i.status === 'blocked')
      .slice(0, 5)
      .map(i => ({
        id: i.id,
        title: `Blocked: ${i.title.substring(0, 60)}`,
        severity: i.priority === 'critical' ? 'critical' : 'high',
        countdown: 'Unblock needed',
        mitigation: 'Assign owner and resolve dependency',
        issueId: i.identifier,
      }))

    res.status(200).json({ anomalies, risks })
  } catch (err) {
    if (isUnavailable(err)) return res.status(200).json(MOCK_INTELLIGENCE)
    res.status(200).json({ anomalies: [], risks: [] })
  }
}
