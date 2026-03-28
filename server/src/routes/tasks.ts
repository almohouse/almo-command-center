import { Hono } from 'hono';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { broadcast } from '../sse.js';

const app = new Hono();

const CreateTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: z.string().default('backlog'),
  priority: z.string().default('medium'),
  project_id: z.string().optional(),
  goal_id: z.string().optional(),
  assignee_agent_id: z.string().optional(),
  assignee_user_id: z.string().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  project_id: z.string().optional(),
  goal_id: z.string().optional(),
  assignee_agent_id: z.string().optional(),
  assignee_user_id: z.string().optional(),
  execution_run_id: z.string().nullable().optional(),
  execution_locked_at: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
});

const CommentSchema = z.object({
  author_type: z.string(),
  author_id: z.string(),
  author_name: z.string(),
  body: z.string(),
});

app.get('/api/tasks', (c) => {
  const status = c.req.query('status');
  const project_id = c.req.query('project_id');
  const assignee = c.req.query('assignee_agent_id');

  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params: unknown[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (project_id) {
    query += ' AND project_id = ?';
    params.push(project_id);
  }
  if (assignee) {
    query += ' AND assignee_agent_id = ?';
    params.push(assignee);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  return c.json({ data: rows });
});

app.post('/api/tasks', async (c) => {
  const body = await c.req.json();
  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const id = uuid();
  const now = new Date().toISOString();

  // Auto-increment identifier
  const counter = db.prepare("SELECT value FROM config WHERE key = 'task_counter'").get() as { value: string };
  const nextNum = parseInt(counter.value) + 1;
  db.prepare("UPDATE config SET value = ? WHERE key = 'task_counter'").run(String(nextNum));
  const identifier = `ALMO-${nextNum}`;

  // Goal inheritance: task → project → company default
  let goalId = data.goal_id ?? null;
  if (!goalId && data.project_id) {
    const project = db.prepare('SELECT goal_id FROM projects WHERE id = ?').get(data.project_id) as { goal_id: string | null } | undefined;
    if (project?.goal_id) goalId = project.goal_id;
  }

  db.prepare(`
    INSERT INTO tasks (id, identifier, title, description, status, priority, project_id, goal_id, assignee_agent_id, assignee_user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, identifier, data.title, data.description ?? null, data.status, data.priority, data.project_id ?? null, goalId, data.assignee_agent_id ?? null, data.assignee_user_id ?? null, now, now);

  // Log status history
  const histId = uuid();
  db.prepare(`
    INSERT INTO task_status_history (id, task_id, from_status, to_status, changed_by, changed_by_type, created_at)
    VALUES (?, ?, NULL, ?, 'system', 'system', ?)
  `).run(histId, id, data.status, now);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  broadcast('task.created', { identifier, title: data.title, status: data.status });
  return c.json(task, 201);
});

app.patch('/api/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) return c.json({ error: 'Task not found' }, 404);

  const body = await c.req.json();
  const parsed = UpdateTaskSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const now = new Date().toISOString();

  // Track status change
  if (data.status && data.status !== existing.status) {
    const histId = uuid();
    db.prepare(`
      INSERT INTO task_status_history (id, task_id, from_status, to_status, changed_by, changed_by_type, created_at)
      VALUES (?, ?, ?, ?, 'user', 'user', ?)
    `).run(histId, id, existing.status, data.status, now);

    // Auto-set timestamps
    if (data.status === 'in_progress' && !existing.started_at) {
      data.started_at = now;
    }
    if (data.status === 'done' && !existing.completed_at) {
      data.completed_at = now;
    }
  }

  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return c.json(existing);

  const sets = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  db.prepare(`UPDATE tasks SET ${sets}, updated_at = ? WHERE id = ?`).run(...values, now, id);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  broadcast('task.updated', { identifier: existing.identifier, status: data.status || existing.status });
  return c.json(updated);
});

app.post('/api/tasks/:id/comments', async (c) => {
  const taskId = c.req.param('id');
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!existing) return c.json({ error: 'Task not found' }, 404);

  const body = await c.req.json();
  const parsed = CommentSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO task_comments (id, task_id, author_type, author_id, author_name, body, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, taskId, data.author_type, data.author_id, data.author_name, data.body, now);

  const comment = db.prepare('SELECT * FROM task_comments WHERE id = ?').get(id);
  broadcast('task.comment', { task_id: taskId, author: data.author_name });
  return c.json(comment, 201);
});

export default app;
