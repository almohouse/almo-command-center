import { Hono } from 'hono';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { broadcast } from '../sse.js';

const app = new Hono();

const UpdateAgentSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  role: z.string().optional(),
  icon: z.string().optional(),
  avatar_path: z.string().optional(),
  model: z.string().optional(),
  personality: z.string().optional(),
  description: z.string().optional(),
  skills: z.string().optional(),
  reports_to: z.string().nullable().optional(),
  telegram_bot: z.string().optional(),
  heartbeat_interval_min: z.number().optional(),
  status: z.string().optional(),
  budget_monthly_cents: z.number().optional(),
  config_json: z.string().optional(),
});

app.get('/api/agents', (c) => {
  const rows = db.prepare('SELECT * FROM agents ORDER BY created_at ASC').all();
  return c.json({ data: rows });
});

app.get('/api/agents/:id', (c) => {
  const id = c.req.param('id');
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  const revisions = db.prepare(
    'SELECT * FROM agent_config_revisions WHERE agent_id = ? ORDER BY created_at DESC LIMIT 20'
  ).all(id);

  const costs = db.prepare(`
    SELECT SUM(cost_cents) as total_cost, COUNT(*) as total_runs
    FROM cost_events WHERE agent_id = ?
  `).get(id);

  return c.json({ ...(agent as Record<string, unknown>), revisions, cost_summary: costs });
});

app.patch('/api/agents/:id', async (c) => {
  const id = c.req.param('id');
  const existing = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) return c.json({ error: 'Agent not found' }, 404);

  const body = await c.req.json();
  const parsed = UpdateAgentSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const now = new Date().toISOString();

  // Detect changed fields for config revision
  const changedFields: string[] = [];
  const previousValues: Record<string, unknown> = {};
  const newValues: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && existing[key] !== value) {
      changedFields.push(key);
      previousValues[key] = existing[key];
      newValues[key] = value;
    }
  }

  if (changedFields.length > 0) {
    // Log config revision
    const revId = uuid();
    db.prepare(`
      INSERT INTO agent_config_revisions (id, agent_id, changed_by, changed_fields, previous_values, new_values, source, created_at)
      VALUES (?, ?, 'user', ?, ?, ?, 'mission_control', ?)
    `).run(revId, id, JSON.stringify(changedFields), JSON.stringify(previousValues), JSON.stringify(newValues), now);

    const sets = changedFields.map(f => `${f} = ?`).join(', ');
    const values = changedFields.map(f => data[f as keyof typeof data]);
    db.prepare(`UPDATE agents SET ${sets}, updated_at = ? WHERE id = ?`).run(...values, now, id);
  }

  const updated = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
  broadcast('agent.updated', { agent_id: id, changed_fields: changedFields });
  return c.json(updated);
});

export default app;
