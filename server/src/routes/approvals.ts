import { Hono } from 'hono';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { broadcast } from '../sse.js';

const app = new Hono();

const CreateApprovalSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  requested_by_agent_id: z.string().optional(),
  requested_by_user_id: z.string().optional(),
  gate_file_path: z.string().optional(),
});

const DecideApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected', 'amended']),
  decided_by_user_id: z.string(),
  decision_note: z.string().optional(),
});

app.get('/api/approvals', (c) => {
  const status = c.req.query('status');
  let query = 'SELECT * FROM approvals WHERE 1=1';
  const params: unknown[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  return c.json({ data: rows });
});

app.post('/api/approvals', async (c) => {
  const body = await c.req.json();
  const parsed = CreateApprovalSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO approvals (id, title, description, requested_by_agent_id, requested_by_user_id, status, gate_file_path, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(id, data.title, data.description ?? null, data.requested_by_agent_id ?? null, data.requested_by_user_id ?? null, data.gate_file_path ?? null, now);

  const approval = db.prepare('SELECT * FROM approvals WHERE id = ?').get(id);
  broadcast('approval.created', { id, title: data.title });
  return c.json(approval, 201);
});

app.patch('/api/approvals/:id', async (c) => {
  const id = c.req.param('id');
  const existing = db.prepare('SELECT * FROM approvals WHERE id = ?').get(id);
  if (!existing) return c.json({ error: 'Approval not found' }, 404);

  const body = await c.req.json();
  const parsed = DecideApprovalSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE approvals SET status = ?, decided_by_user_id = ?, decision_note = ?, decided_at = ?
    WHERE id = ?
  `).run(data.status, data.decided_by_user_id, data.decision_note ?? null, now, id);

  const updated = db.prepare('SELECT * FROM approvals WHERE id = ?').get(id);
  broadcast('approval.decided', { id, status: data.status });
  return c.json(updated);
});

export default app;
