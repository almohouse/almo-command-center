import { Hono } from 'hono';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { broadcast } from '../sse.js';

const app = new Hono();

const CreateGoalSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  level: z.string().default('company'),
  status: z.string().default('active'),
  parent_id: z.string().optional(),
  owner_agent_id: z.string().optional(),
  target_value: z.number().optional(),
  current_value: z.number().default(0),
  unit: z.string().optional(),
  target_date: z.string().optional(),
});

const UpdateGoalSchema = CreateGoalSchema.partial();

app.get('/api/goals', (c) => {
  const level = c.req.query('level');
  const status = c.req.query('status');
  const owner = c.req.query('owner_agent_id');

  let query = 'SELECT * FROM goals WHERE 1=1';
  const params: unknown[] = [];

  if (level) { query += ' AND level = ?'; params.push(level); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (owner) { query += ' AND owner_agent_id = ?'; params.push(owner); }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  return c.json({ data: rows });
});

app.post('/api/goals', async (c) => {
  const body = await c.req.json();
  const parsed = CreateGoalSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO goals (id, title, description, level, status, parent_id, owner_agent_id, target_value, current_value, unit, target_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.title, data.description ?? null, data.level, data.status, data.parent_id ?? null, data.owner_agent_id ?? null, data.target_value ?? null, data.current_value, data.unit ?? null, data.target_date ?? null, now, now);

  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  broadcast('goal.created', { id, title: data.title });
  return c.json(goal, 201);
});

app.patch('/api/goals/:id', async (c) => {
  const id = c.req.param('id');
  const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) return c.json({ error: 'Goal not found' }, 404);

  const body = await c.req.json();
  const parsed = UpdateGoalSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const now = new Date().toISOString();
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return c.json(existing);

  const sets = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  db.prepare(`UPDATE goals SET ${sets}, updated_at = ? WHERE id = ?`).run(...values, now, id);

  // Check completion
  if (data.current_value !== undefined && data.current_value >= (existing.target_value as number || Infinity)) {
    db.prepare("UPDATE goals SET status = 'completed', updated_at = ? WHERE id = ?").run(now, id);
    broadcast('goal.completed', { id, title: existing.title });
  }

  // Snapshot health
  const snapId = uuid();
  const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as Record<string, unknown>;
  db.prepare(`
    INSERT INTO goal_health_snapshots (id, goal_id, status, current_value, target_value, snapshot_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(snapId, id, updated.status, updated.current_value, updated.target_value, now);

  broadcast('goal.updated', { id });
  return c.json(updated);
});

export default app;
