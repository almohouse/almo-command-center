import { Hono } from 'hono';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { broadcast } from '../sse.js';

const app = new Hono();

const CreateEpisodeSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  category: z.string(),
  page_source: z.string().optional(),
  file_path: z.string(),
  duration_seconds: z.number().optional(),
  script: z.string().optional(),
});

app.get('/api/audio/episodes', (c) => {
  const category = c.req.query('category');
  const page = c.req.query('page_source');

  let query = 'SELECT * FROM audio_episodes WHERE 1=1';
  const params: unknown[] = [];

  if (category) { query += ' AND category = ?'; params.push(category); }
  if (page) { query += ' AND page_source = ?'; params.push(page); }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  return c.json({ data: rows });
});

app.post('/api/audio/episodes', async (c) => {
  const body = await c.req.json();
  const parsed = CreateEpisodeSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO audio_episodes (id, title, subtitle, category, page_source, file_path, duration_seconds, script, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.title, data.subtitle ?? null, data.category, data.page_source ?? null, data.file_path, data.duration_seconds ?? null, data.script ?? null, now);

  const episode = db.prepare('SELECT * FROM audio_episodes WHERE id = ?').get(id);
  broadcast('audio.generated', { episode_id: id, title: data.title });
  return c.json(episode, 201);
});

app.delete('/api/audio/episodes/:id', (c) => {
  const id = c.req.param('id');
  const existing = db.prepare('SELECT * FROM audio_episodes WHERE id = ?').get(id);
  if (!existing) return c.json({ error: 'Episode not found' }, 404);

  db.prepare('DELETE FROM audio_episodes WHERE id = ?').run(id);
  broadcast('audio.deleted', { episode_id: id });
  return c.json({ ok: true });
});

export default app;
