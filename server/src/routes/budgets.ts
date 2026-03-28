import { Hono } from 'hono';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { broadcast } from '../sse.js';

const app = new Hono();

const CreateBudgetSchema = z.object({
  category: z.string(),
  monthly_amount_sar: z.number(),
  period: z.string().default('monthly'),
});

const UpdateBudgetSchema = z.object({
  monthly_amount_sar: z.number().optional(),
  period: z.string().optional(),
});

app.get('/api/budgets', (c) => {
  const budgets = db.prepare('SELECT * FROM budgets ORDER BY category ASC').all() as Record<string, unknown>[];

  // Enrich with actuals for current month
  const monthStart = new Date().toISOString().slice(0, 7) + '-01';
  const enriched = budgets.map(b => {
    const actual = db.prepare(
      'SELECT COALESCE(SUM(amount_sar), 0) as total FROM expenses WHERE category = ? AND created_at >= ?'
    ).get(b.category, monthStart) as { total: number };
    return {
      ...b,
      actual_sar: actual.total,
      variance_sar: (b.monthly_amount_sar as number) - actual.total,
      utilization_pct: (b.monthly_amount_sar as number) > 0 ? Math.round((actual.total / (b.monthly_amount_sar as number)) * 100) : 0,
    };
  });

  return c.json({ data: enriched });
});

app.post('/api/budgets', async (c) => {
  const body = await c.req.json();
  const parsed = CreateBudgetSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO budgets (id, category, monthly_amount_sar, period, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.category, data.monthly_amount_sar, data.period, now, now);

  const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
  broadcast('budget.created', { id, category: data.category });
  return c.json(budget, 201);
});

app.patch('/api/budgets/:id', async (c) => {
  const id = c.req.param('id');
  const existing = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
  if (!existing) return c.json({ error: 'Budget not found' }, 404);

  const body = await c.req.json();
  const parsed = UpdateBudgetSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const now = new Date().toISOString();
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return c.json(existing);

  const sets = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  db.prepare(`UPDATE budgets SET ${sets}, updated_at = ? WHERE id = ?`).run(...values, now, id);

  const updated = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
  broadcast('budget.updated', { id });
  return c.json(updated);
});

export default app;
