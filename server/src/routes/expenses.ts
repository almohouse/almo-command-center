import { Hono } from 'hono';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { broadcast } from '../sse.js';

const app = new Hono();

const CreateExpenseSchema = z.object({
  category: z.string(),
  description: z.string(),
  amount_sar: z.number(),
  amount_original: z.number().optional(),
  currency_original: z.string().default('SAR'),
  payment_method: z.string().optional(),
  is_recurring: z.number().default(0),
  receipt_path: z.string().optional(),
  created_by: z.string().optional(),
});

const UpdateExpenseSchema = z.object({
  category: z.string().optional(),
  description: z.string().optional(),
  amount_sar: z.number().optional(),
  payment_method: z.string().optional(),
  is_recurring: z.number().optional(),
});

// GET /api/expenses
app.get('/api/expenses', (c) => {
  const category = c.req.query('category');
  const from = c.req.query('from');
  const to = c.req.query('to');

  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params: unknown[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (from) {
    query += ' AND created_at >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND created_at <= ?';
    params.push(to);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  return c.json({ data: rows });
});

// POST /api/expenses
app.post('/api/expenses', async (c) => {
  const body = await c.req.json();
  const parsed = CreateExpenseSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO expenses (id, category, description, amount_sar, amount_original, currency_original, payment_method, is_recurring, receipt_path, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.category, data.description, data.amount_sar, data.amount_original ?? null, data.currency_original, data.payment_method ?? null, data.is_recurring, data.receipt_path ?? null, data.created_by ?? null, now, now);

  // Record cash outflow
  const cfId = uuid();
  db.prepare(`
    INSERT INTO cash_flow_events (id, direction, amount_sar, source, reference_id, category, activity_type, description, occurred_at)
    VALUES (?, 'out', ?, 'expense', ?, ?, 'operating', ?, ?)
  `).run(cfId, data.amount_sar, id, data.category, data.description, now);

  // Check budget threshold
  const budget = db.prepare('SELECT * FROM budgets WHERE category = ?').get(data.category) as { monthly_amount_sar: number } | undefined;
  if (budget) {
    const monthStart = now.slice(0, 7) + '-01';
    const actual = db.prepare(
      'SELECT COALESCE(SUM(amount_sar), 0) as total FROM expenses WHERE category = ? AND created_at >= ?'
    ).get(data.category, monthStart) as { total: number };

    if (actual.total > budget.monthly_amount_sar) {
      const incId = uuid();
      db.prepare(`
        INSERT INTO budget_incidents (id, category, budget_sar, actual_sar, variance_sar, severity)
        VALUES (?, ?, ?, ?, ?, 'critical')
      `).run(incId, data.category, budget.monthly_amount_sar, actual.total, actual.total - budget.monthly_amount_sar);
      broadcast('budget.threshold', { category: data.category, actual: actual.total, budget: budget.monthly_amount_sar });
    }
  }

  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  broadcast('expense.added', { id, category: data.category, amount_sar: data.amount_sar });
  broadcast('dashboard.refresh', {});

  return c.json(expense, 201);
});

// PATCH /api/expenses/:id
app.patch('/api/expenses/:id', async (c) => {
  const id = c.req.param('id');
  const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) return c.json({ error: 'Expense not found' }, 404);

  const body = await c.req.json();
  const parsed = UpdateExpenseSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const now = new Date().toISOString();
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
    // Log edit
    const logId = uuid();
    db.prepare(`
      INSERT INTO expense_edit_log (id, expense_id, changed_by, changed_fields, previous_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(logId, id, 'user', JSON.stringify(changedFields), JSON.stringify(previousValues), JSON.stringify(newValues), now);

    const sets = changedFields.map(f => `${f} = ?`).join(', ');
    const values = changedFields.map(f => data[f as keyof typeof data]);
    db.prepare(`UPDATE expenses SET ${sets}, updated_at = ? WHERE id = ?`).run(...values, now, id);
  }

  const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  broadcast('expense.updated', { id });
  return c.json(updated);
});

// DELETE /api/expenses/:id
app.delete('/api/expenses/:id', (c) => {
  const id = c.req.param('id');
  const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  if (!existing) return c.json({ error: 'Expense not found' }, 404);

  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  broadcast('expense.deleted', { id });
  return c.json({ ok: true });
});

export default app;
