import { pcGet, COMPANY_ID, corsHeaders } from '../_lib/pc.js'

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') {
    return res.writeHead(204, h).end()
  }
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v))

  try {
    const issues = await pcGet(`/api/companies/${COMPANY_ID}/issues?status=in_progress,in_review&limit=8`).catch(() => [])
    const agents = await pcGet(`/api/companies/${COMPANY_ID}/agents`).catch(() => [])
    const agentMap = Object.fromEntries(agents.map(a => [a.id, { name: a.name, role: a.title || a.role }]))

    const commentResults = await Promise.allSettled(
      issues.slice(0, 6).map(issue =>
        pcGet(`/api/issues/${issue.id}/comments?order=desc&limit=2`)
          .then(comments => comments.map(c => ({ ...c, issueTitle: issue.title })))
      )
    )

    const messages = commentResults
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .filter(c => c.authorAgentId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20)
      .map(c => {
        const agent = agentMap[c.authorAgentId] || { name: 'Agent', role: '' }
        return {
          id: c.id,
          from: agent.name,
          agentId: c.authorAgentId,
          role: agent.role,
          message: c.body?.replace(/[#*`\[\]]/g, '').substring(0, 200) || '',
          time: new Date(c.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          createdAt: c.createdAt,
          isSystem: false,
          source: 'paperclip',
          issueRef: c.issueTitle?.substring(0, 60),
        }
      })

    res.status(200).json({ session: { active: false, startedAt: null }, messages })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
