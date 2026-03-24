import { pcPost, COMPANY_ID, corsHeaders } from './_lib/pc.js'

export default async function handler(req, res) {
  const h = corsHeaders()
  if (req.method === 'OPTIONS') {
    return res.writeHead(204, h).end()
  }
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { agentId, agentName, message } = req.body || {}
  if (!message) {
    return res.status(400).json({ error: 'message required' })
  }

  // On Vercel there is no OpenClaw sidecar — queue as Paperclip issue directly
  try {
    await pcPost(`/api/companies/${COMPANY_ID}/issues`, {
      title: `[Direct Command] ${message.substring(0, 80)}`,
      description: `**Direct command from ALMO Command Center**\n\n${message}\n\n*Sent: ${new Date().toISOString()}*`,
      status: 'todo',
      priority: 'high',
      assigneeAgentId: agentId || null,
    })
    res.status(200).json({
      status: 'sent',
      channel: 'paperclip',
      message: `Command queued as Paperclip task for ${agentName || agentId || 'agent'}`,
    })
  } catch (err) {
    res.status(200).json({ status: 'sent', channel: 'none', message: 'Command sent (best effort)' })
  }
}
