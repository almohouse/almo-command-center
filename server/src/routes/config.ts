import { Hono } from 'hono';
import { z } from 'zod';
import db from '../db.js';
import { broadcast } from '../sse.js';

const app = new Hono();

const UpdateConfigSchema = z.record(z.string());

app.get('/api/config', (c) => {
  const category = c.req.query('category');
  let query = 'SELECT * FROM config';
  const params: unknown[] = [];

  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }

  query += ' ORDER BY key ASC';
  const rows = db.prepare(query).all(...params) as { key: string; value: string; category: string }[];

  // Return as key-value map
  const config = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return c.json({ data: config, rows });
});

app.patch('/api/config', async (c) => {
  const body = await c.req.json();
  const parsed = UpdateConfigSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const now = new Date().toISOString();

  const upsert = db.prepare(`
    INSERT INTO config (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  for (const [key, value] of Object.entries(data)) {
    upsert.run(key, value, now);
  }

  broadcast('config.updated', { keys: Object.keys(data) });
  return c.json({ ok: true });
});

export default app;
