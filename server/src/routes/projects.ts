import { Hono } from 'hono';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { broadcast } from '../sse.js';

const app = new Hono();

const CreateProjectSchema = z.object({
  identifier: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  status: z.string().default('active'),
  lead_agent_id: z.string().optional(),
  goal_id: z.string().optional(),
  target_date: z.string().optional(),
});

const UpdateProjectSchema = CreateProjectSchema.partial();

app.get('/api/projects', (c) => {
  const status = c.req.query('status');
  let query = 'SELECT * FROM projects WHERE 1=1';
  const params: unknown[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);

  // Attach task counts
  const enriched = (rows as Record<string, unknown>[]).map(p => {
    const counts = db.prepare(`
      SELECT status, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status
    `).all(p.id) as { status: string; count: number }[];
    return { ...p, task_counts: Object.fromEntries(counts.map(r => [r.status, r.count])) };
  });

  return c.json({ data: enriched });
});

app.post('/api/projects', async (c) => {
  const body = await c.req.json();
  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO projects (id, identifier, name, description, type, status, lead_agent_id, goal_id, target_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.identifier, data.name, data.description ?? null, data.type ?? null, data.status, data.lead_agent_id ?? null, data.goal_id ?? null, data.target_date ?? null, now, now);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  broadcast('project.created', { id, name: data.name });
  return c.json(project, 201);
});

app.patch('/api/projects/:id', async (c) => {
  const id = c.req.param('id');
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!existing) return c.json({ error: 'Project not found' }, 404);

  const body = await c.req.json();
  const parsed = UpdateProjectSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const now = new Date().toISOString();
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return c.json(existing);

  const sets = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  db.prepare(`UPDATE projects SET ${sets}, updated_at = ? WHERE id = ?`).run(...values, now, id);

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  broadcast('project.updated', { id });
  return c.json(updated);
});

export default app;
