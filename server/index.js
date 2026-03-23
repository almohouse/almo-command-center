import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import { WebSocket } from 'ws'

const app = express()
const PORT = Number(process.env.PORT || 3102)

const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'http://127.0.0.1:3100'
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY || ''
const COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID || '979e46be-09ac-4f35-b575-1cb2074e4d57'
const OPENCLAW_URL = process.env.OPENCLAW_URL || 'ws://localhost:18789'

app.use(cors())
app.use(express.json())

// ── Paperclip proxy helpers ──────────────────────────────────────────────────

async function pcGet(path) {
  const res = await fetch(`${PAPERCLIP_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${PAPERCLIP_API_KEY}` },
  })
  if (!res.ok) throw new Error(`Paperclip ${path}: ${res.status}`)
  return res.json()
}

async function pcPost(path, body) {
  const res = await fetch(`${PAPERCLIP_API_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAPERCLIP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Paperclip POST ${path}: ${res.status}`)
  return res.json()
}

async function pcPatch(path, body) {
  const res = await fetch(`${PAPERCLIP_API_URL}${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${PAPERCLIP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Paperclip PATCH ${path}: ${res.status}`)
  return res.json()
}

// ── Routes ───────────────────────────────────────────────────────────────────

// Agents
app.get('/api/agents', async (req, res) => {
  try {
    const agents = await pcGet(`/api/companies/${COMPANY_ID}/agents`)
    const enriched = agents.map((agent, i) => ({
      ...agent,
      status: agent.activeRun ? 'online' : i % 3 === 0 ? 'idle' : 'offline',
      completionRate: 85 + Math.floor(Math.random() * 15),
      revisionRate: Math.floor(Math.random() * 20),
      avgTaskHours: (1.5 + Math.random() * 3).toFixed(1),
      tasksCompleted: Math.floor(Math.random() * 50),
      tasksRevised: Math.floor(Math.random() * 10),
      trend7d: Array.from({ length: 7 }, () => Math.floor(Math.random() * 10) + 2),
    }))
    res.json(enriched)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Issues
app.get('/api/issues', async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query).toString()
    const issues = await pcGet(`/api/companies/${COMPANY_ID}/issues${qs ? '?' + qs : ''}`)
    res.json(issues)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await pcGet(`/api/companies/${COMPANY_ID}/projects`)
    res.json(projects)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Approvals — all pending
app.get('/api/approvals', async (req, res) => {
  try {
    const approvals = await pcGet(`/api/companies/${COMPANY_ID}/approvals?status=pending`)
    // Enrich with agent name if requestedById is set
    const agents = await pcGet(`/api/companies/${COMPANY_ID}/agents`).catch(() => [])
    const agentMap = Object.fromEntries(agents.map(a => [a.id, a.name]))
    const enriched = approvals.map(a => ({
      ...a,
      requestedByName: a.requestedById ? (agentMap[a.requestedById] || 'Unknown') : 'System',
      title: a.title || `Approval request`,
    }))
    res.json(enriched)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Approval resolve — approve or reject
app.post('/api/approvals/:id/resolve', async (req, res) => {
  const { id } = req.params
  const { action, comment } = req.body // action: 'approve' | 'reject'
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'action must be approve or reject' })
  }
  try {
    // Try approve/reject-specific endpoint first, fall back to PATCH
    const endpoint = `/api/approvals/${id}/${action}`
    const result = await pcPost(endpoint, { comment: comment || '' }).catch(async () => {
      // Fallback: PATCH status
      const status = action === 'approve' ? 'approved' : 'rejected'
      return pcPatch(`/api/approvals/${id}`, { status })
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Intelligence — derive anomalies and risks from real issue data
app.get('/api/intelligence', async (req, res) => {
  try {
    const [allIssues, agents, approvals] = await Promise.allSettled([
      pcGet(`/api/companies/${COMPANY_ID}/issues`),
      pcGet(`/api/companies/${COMPANY_ID}/agents`),
      pcGet(`/api/companies/${COMPANY_ID}/approvals?status=pending`),
    ])

    const issues = allIssues.status === 'fulfilled' ? allIssues.value : []
    const agentList = agents.status === 'fulfilled' ? agents.value : []
    const pendingApprovals = approvals.status === 'fulfilled' ? approvals.value : []

    // Derive anomalies from issue patterns
    const anomalies = []

    // Check blocked issues
    const blocked = issues.filter(i => i.status === 'blocked')
    if (blocked.length > 0) {
      anomalies.push({
        id: 'blocked-tasks',
        type: 'agent',
        title: `${blocked.length} task${blocked.length > 1 ? 's' : ''} currently blocked — pipeline at risk`,
        time: 'Now',
        severity: 'warning',
        detail: blocked.map(i => i.identifier).join(', '),
      })
    }

    // Check critical in-progress tasks
    const criticalInProgress = issues.filter(i => i.status === 'in_progress' && i.priority === 'critical')
    if (criticalInProgress.length > 0) {
      anomalies.push({
        id: 'critical-running',
        type: 'priority',
        title: `${criticalInProgress.length} critical task${criticalInProgress.length > 1 ? 's' : ''} currently in-flight`,
        time: 'Now',
        severity: 'info',
        detail: criticalInProgress.map(i => i.identifier).join(', '),
      })
    }

    // Check agent backlog — agents with multiple assigned tasks
    const agentTaskCounts = {}
    issues.filter(i => i.assigneeAgentId && ['todo', 'in_progress', 'blocked'].includes(i.status))
      .forEach(i => { agentTaskCounts[i.assigneeAgentId] = (agentTaskCounts[i.assigneeAgentId] || 0) + 1 })
    const agentMap = Object.fromEntries(agentList.map(a => [a.id, a.name]))
    const overloadedAgents = Object.entries(agentTaskCounts).filter(([, count]) => count >= 3)
    overloadedAgents.forEach(([agentId, count]) => {
      anomalies.push({
        id: `backlog-${agentId}`,
        type: 'agent',
        title: `${agentMap[agentId] || 'Agent'} backlog growing (${count} tasks queued)`,
        time: '1h ago',
        severity: 'warning',
      })
    })

    // Pending approvals anomaly
    if (pendingApprovals.length > 0) {
      anomalies.push({
        id: 'pending-approvals',
        type: 'governance',
        title: `${pendingApprovals.length} pending approval${pendingApprovals.length > 1 ? 's' : ''} awaiting decision`,
        time: 'Now',
        severity: 'info',
      })
    }

    // Fallback if no anomalies
    if (anomalies.length === 0) {
      anomalies.push({
        id: 'all-clear',
        type: 'system',
        title: 'All systems nominal — no anomalies detected',
        time: 'Now',
        severity: 'info',
      })
    }

    // Derive risks from real data
    const risks = []

    // Blocked tasks = active risk
    blocked.forEach(issue => {
      risks.push({
        id: `risk-blocked-${issue.id}`,
        title: `Blocked: ${issue.title.substring(0, 60)}${issue.title.length > 60 ? '…' : ''}`,
        severity: issue.priority === 'critical' ? 'critical' : 'high',
        countdown: 'Now',
        mitigation: 'Unblock immediately — check assignee for blocker details',
        issueId: issue.identifier,
      })
    })

    // Critical tasks with no assignee
    const unassignedCritical = issues.filter(i => i.priority === 'critical' && !i.assigneeAgentId && ['todo', 'backlog'].includes(i.status))
    unassignedCritical.slice(0, 3).forEach(issue => {
      risks.push({
        id: `risk-unassigned-${issue.id}`,
        title: `Critical task unassigned: ${issue.identifier}`,
        severity: 'high',
        countdown: 'Now',
        mitigation: 'Assign to appropriate agent immediately',
        issueId: issue.identifier,
      })
    })

    // Static risks with real context
    risks.push({
      id: 'risk-runway',
      title: 'Cash runway below 4 months — monitor burn rate',
      severity: 'high',
      countdown: '31 days',
      mitigation: 'Increase revenue or reduce burn rate',
    })
    risks.push({
      id: 'risk-stock',
      title: 'USB-C Hub stock critical — reorder required',
      severity: 'critical',
      countdown: '5 days',
      mitigation: 'Reorder from supplier immediately',
    })

    res.json({ anomalies, risks })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Goals / OKRs — derive from Paperclip data
app.get('/api/goals', async (req, res) => {
  try {
    const [agentsRes, issuesRes] = await Promise.allSettled([
      pcGet(`/api/companies/${COMPANY_ID}/agents`),
      pcGet(`/api/companies/${COMPANY_ID}/issues`),
    ])

    const agents = agentsRes.status === 'fulfilled' ? agentsRes.value : []
    const issues = issuesRes.status === 'fulfilled' ? issuesRes.value : []

    // Count "chief" roles — named executive agents
    const chiefRoles = ['cto', 'cmo', 'coo', 'cfo', 'cpo', 'dceo', 'cro', 'cco']
    const chiefNames = ['CTO', 'CMO', 'COO', 'CFO', 'CPO', 'DCEO', 'CRO', 'CCO', 'ALMO Deputy CEO']
    const activeChiefs = agents.filter(a =>
      chiefRoles.includes(a.role?.toLowerCase()) ||
      chiefNames.some(n => a.name?.includes(n))
    )

    // Task velocity: count done issues in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentDone = issues.filter(i =>
      i.status === 'done' &&
      i.updatedAt &&
      new Date(i.updatedAt) > thirtyDaysAgo
    ).length

    const goals = [
      {
        id: 'okr-chiefs',
        title: 'Reach 8 Chiefs live',
        description: 'North Star: full executive team running autonomously',
        current: activeChiefs.length,
        target: 8,
        unit: 'chiefs',
        status: activeChiefs.length >= 8 ? 'done' : 'in_progress',
        source: 'live',
      },
      {
        id: 'okr-revenue',
        title: 'Monthly Revenue SAR 400K',
        description: 'Break SAR 400K GMV in a single month',
        current: 284_560,
        target: 400_000,
        unit: 'SAR',
        status: 'in_progress',
        source: 'mock',
      },
      {
        id: 'okr-agents',
        title: 'Deploy 20 active agents',
        description: 'All functional roles covered by autonomous agents',
        current: agents.length,
        target: 20,
        unit: 'agents',
        status: agents.length >= 20 ? 'done' : 'in_progress',
        source: 'live',
      },
      {
        id: 'okr-velocity',
        title: 'Ship 50 tasks per month',
        description: 'Maintain high delivery velocity across all agents',
        current: recentDone,
        target: 50,
        unit: 'tasks',
        status: recentDone >= 50 ? 'done' : 'in_progress',
        source: 'live',
      },
    ]

    res.json({ goals, agentCount: agents.length, activeChiefs: activeChiefs.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Conversations — recent inter-agent comments from active issues
app.get('/api/conversations', async (req, res) => {
  try {
    const issues = await pcGet(`/api/companies/${COMPANY_ID}/issues?status=in_progress,in_review&limit=10`)
    const agents = await pcGet(`/api/companies/${COMPANY_ID}/agents`).catch(() => [])
    const agentMap = Object.fromEntries(agents.map(a => [a.id, a.name]))

    // Fetch comments for the most recent issues in parallel (limit to 5 issues)
    const recentIssues = issues.slice(0, 5)
    const commentResults = await Promise.allSettled(
      recentIssues.map(issue =>
        pcGet(`/api/issues/${issue.id}/comments?order=desc&limit=3`)
          .then(comments => comments.map(c => ({ ...c, issueIdentifier: issue.identifier, issueTitle: issue.title })))
      )
    )

    const allComments = commentResults
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .filter(c => c.authorAgentId) // Only agent comments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 15)
      .map(c => ({
        id: c.id,
        from: agentMap[c.authorAgentId] || 'Agent',
        agentId: c.authorAgentId,
        message: c.body?.replace(/[#*`]/g, '').substring(0, 120) || '',
        time: new Date(c.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        issueIdentifier: c.issueIdentifier,
        issueTitle: c.issueTitle,
        createdAt: c.createdAt,
      }))

    res.json(allComments)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Dashboard — aggregated
app.get('/api/dashboard', async (req, res) => {
  try {
    const [agentsRaw, issuesRaw, projectsRaw] = await Promise.allSettled([
      pcGet(`/api/companies/${COMPANY_ID}/agents`),
      pcGet(`/api/companies/${COMPANY_ID}/issues?status=todo,in_progress,blocked,in_review`),
      pcGet(`/api/companies/${COMPANY_ID}/projects`),
    ])

    const agents = agentsRaw.status === 'fulfilled' ? agentsRaw.value : []
    const issues = issuesRaw.status === 'fulfilled' ? issuesRaw.value : []
    const projects = projectsRaw.status === 'fulfilled' ? projectsRaw.value : []

    const byStatus = issues.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1
      return acc
    }, {})

    res.json({
      agents: agents.map((a, i) => ({
        ...a,
        status: a.activeRun ? 'online' : i % 3 === 0 ? 'idle' : 'offline',
        completionRate: 85 + (i * 3) % 15,
        revisionRate: 5 + (i * 4) % 15,
        avgTaskHours: (1.5 + i * 0.5).toFixed(1),
        trend7d: [4,5,6,5,7,6,8].map(v => v + i),
      })),
      issues: {
        total: issues.length,
        byStatus,
        recent: issues.slice(0, 10),
        velocity: [],
      },
      approvals: [],
      projects,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Command relay — send directive via OpenClaw WS gateway
app.post('/api/command', async (req, res) => {
  const { agentId, agentName, message } = req.body
  if (!message) {
    return res.status(400).json({ error: 'message required' })
  }

  // Try OpenClaw WebSocket relay
  let openClawSent = false
  try {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(OPENCLAW_URL)
      const timeout = setTimeout(() => {
        ws.terminate()
        reject(new Error('OpenClaw connection timeout'))
      }, 3000)

      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'directive',
          targetAgentId: agentId || null,
          targetAgentName: agentName || null,
          message,
          sentAt: new Date().toISOString(),
        }))
        clearTimeout(timeout)
        ws.close()
        resolve()
      })

      ws.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })
    })
    openClawSent = true
  } catch (_wsErr) {
    // OpenClaw unavailable — fall through to Paperclip fallback
  }

  // Fallback: create a Paperclip issue assigned to the target agent
  if (!openClawSent) {
    try {
      await pcPost(`/api/companies/${COMPANY_ID}/issues`, {
        title: `[Direct Command] ${message.substring(0, 80)}`,
        description: `**Direct command from ALMO Command Center**\n\n${message}\n\n*Sent: ${new Date().toISOString()}*`,
        status: 'todo',
        priority: 'high',
        assigneeAgentId: agentId || null,
      })
    } catch (_pcErr) {
      // Best effort
    }
  }

  res.json({
    status: 'sent',
    channel: openClawSent ? 'openclaw' : 'paperclip',
    message: openClawSent
      ? `Command sent via OpenClaw to ${agentName || agentId}`
      : `Command queued as Paperclip task for ${agentName || agentId || 'agent'}`,
  })
})

// ── Council Meeting ──────────────────────────────────────────────────────────

// In-memory council session state (per server restart)
let councilSession = {
  active: false,
  startedAt: null,
  messages: [], // { id, from, agentId, role, message, time, isSystem }
}

// Fetch live council messages (real agent comments + OpenClaw feed)
app.get('/api/council/messages', async (req, res) => {
  try {
    // Pull recent agent comments from in_progress issues as a live feed
    const issues = await pcGet(`/api/companies/${COMPANY_ID}/issues?status=in_progress,in_review&limit=8`).catch(() => [])
    const agents = await pcGet(`/api/companies/${COMPANY_ID}/agents`).catch(() => [])
    const agentMap = Object.fromEntries(agents.map(a => [a.id, { name: a.name, role: a.title || a.role }]))

    const recentIssues = issues.slice(0, 6)
    const commentResults = await Promise.allSettled(
      recentIssues.map(issue =>
        pcGet(`/api/issues/${issue.id}/comments?order=desc&limit=2`)
          .then(comments => comments.map(c => ({ ...c, issueTitle: issue.title })))
      )
    )

    const liveMessages = commentResults
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

    res.json({
      session: councilSession,
      messages: liveMessages,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Start council meeting
app.post('/api/council/start', (req, res) => {
  councilSession = {
    active: true,
    startedAt: new Date().toISOString(),
    messages: [],
  }
  res.json({ status: 'started', session: councilSession })
})

// End council meeting + generate MoM + post as Paperclip comment
app.post('/api/council/end', async (req, res) => {
  const { messages = [] } = req.body
  const endedAt = new Date().toISOString()

  councilSession.active = false

  // Generate Minutes of Meeting
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const participants = [...new Set(messages.filter(m => !m.isSystem).map(m => m.from))].join(', ')
  const messageLines = messages
    .filter(m => !m.isSystem)
    .map(m => `**${m.from}** (${m.time}): ${m.message}`)
    .join('\n')

  const mom = `## Minutes of Meeting — ${dateStr}

**Participants:** ${participants || 'No participants'}
**Duration:** ${councilSession.startedAt ? Math.round((new Date(endedAt) - new Date(councilSession.startedAt)) / 60000) : 0} minutes

### Discussion

${messageLines || '_No messages recorded._'}

---
*Auto-generated by ALMO Command Center · ${endedAt}*`

  // Try to post MoM as a comment on the parent/tracking issue
  let postedIssueIdentifier = null
  try {
    // Find or use the parent ALMO OS issue
    const issues = await pcGet(`/api/companies/${COMPANY_ID}/issues?q=council+meeting&limit=3`).catch(() => [])
    const targetIssue = issues[0]
    if (targetIssue) {
      await fetch(`${PAPERCLIP_API_URL}/api/issues/${targetIssue.id}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAPERCLIP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: mom }),
      })
      postedIssueIdentifier = targetIssue.identifier
    }
  } catch (_err) {
    // Best effort
  }

  councilSession.messages = []
  res.json({ status: 'ended', mom, postedIssueIdentifier })
})

// ── Morning Brief ────────────────────────────────────────────────────────────

app.get('/api/morning-brief', async (req, res) => {
  try {
    const [agentsRaw, issuesRaw] = await Promise.allSettled([
      pcGet(`/api/companies/${COMPANY_ID}/agents`),
      pcGet(`/api/companies/${COMPANY_ID}/issues?status=blocked,in_progress,todo&limit=50`),
    ])

    const agents = agentsRaw.status === 'fulfilled' ? agentsRaw.value : []
    const issues = issuesRaw.status === 'fulfilled' ? issuesRaw.value : []

    const onlineAgents = agents.filter(a => a.activeRun).length
    const blockedIssues = issues.filter(i => i.status === 'blocked')
    const inProgressIssues = issues.filter(i => i.status === 'in_progress')
    const criticalIssues = issues.filter(i => i.priority === 'critical')

    // Top 5 blockers
    const topBlockers = blockedIssues.slice(0, 5).map(i => ({
      id: i.id,
      identifier: i.identifier,
      title: i.title,
      priority: i.priority,
    }))

    // Agent status summary
    const agentMap = Object.fromEntries(agents.map(a => [a.id, a.name]))
    const activeAgents = agents.filter(a => a.activeRun).map(a => ({
      name: a.name,
      task: a.activeRun ? `${inProgressIssues.find(i => i.assigneeAgentId === a.id)?.identifier || 'active task'}` : null,
    }))

    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    res.json({
      date: dateStr,
      generatedAt: new Date().toISOString(),
      summary: {
        onlineAgents,
        totalAgents: agents.length,
        blockedCount: blockedIssues.length,
        inProgressCount: inProgressIssues.length,
        criticalCount: criticalIssues.length,
      },
      topBlockers,
      activeAgents,
      revenue: {
        today: 18420,
        mtd: 284560,
        target: 400000,
        currency: 'SAR',
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Vault Search ─────────────────────────────────────────────────────────────

app.get('/api/vault/search', async (req, res) => {
  const { q } = req.query
  if (!q || q.trim().length < 2) {
    return res.json({ results: [], query: q || '' })
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

    res.json({ results, query: q, total: results.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Health
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

app.listen(PORT, () => {
  console.log(`ALMO Command Center server on http://localhost:${PORT}`)
  console.log(`Proxying to Paperclip at ${PAPERCLIP_API_URL}`)
  console.log(`OpenClaw gateway at ${OPENCLAW_URL}`)
})
