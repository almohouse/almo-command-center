import { Hono } from 'hono';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { broadcast } from '../sse.js';

const app = new Hono();

const CreateSaleSchema = z.object({
  customer_id: z.string().optional(),
  salla_order_id: z.string().optional(),
  items_json: z.string().default('[]'),
  subtotal_sar: z.number(),
  shipping_sar: z.number().default(0),
  tax_sar: z.number().default(0),
  discount_sar: z.number().default(0),
  total_sar: z.number(),
  status: z.string().default('processing'),
  channel: z.string().default('salla'),
  payment_method: z.string().optional(),
});

// GET /api/sales — list with optional filters
app.get('/api/sales', (c) => {
  const status = c.req.query('status');
  const channel = c.req.query('channel');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  let query = 'SELECT * FROM sales_orders WHERE 1=1';
  const params: unknown[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (channel) {
    query += ' AND channel = ?';
    params.push(channel);
  }
  if (from) {
    query += ' AND created_at >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND created_at <= ?';
    params.push(to);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params);
  const total = db.prepare(
    query.replace('SELECT *', 'SELECT COUNT(*) as count').replace(/ ORDER BY.*$/, '')
  ).get(...params.slice(0, -2)) as { count: number };

  return c.json({ data: rows, total: total.count });
});

// GET /api/sales/:id
app.get('/api/sales/:id', (c) => {
  const row = db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(c.req.param('id'));
  if (!row) return c.json({ error: 'Order not found' }, 404);
  return c.json(row);
});

// POST /api/sales
app.post('/api/sales', async (c) => {
  const body = await c.req.json();
  const parsed = CreateSaleSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sales_orders (id, salla_order_id, customer_id, items_json, subtotal_sar, shipping_sar, tax_sar, discount_sar, total_sar, status, channel, payment_method, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.salla_order_id ?? null, data.customer_id ?? null, data.items_json, data.subtotal_sar, data.shipping_sar, data.tax_sar, data.discount_sar, data.total_sar, data.status, data.channel, data.payment_method ?? null, now, now);

  // Record cash inflow if completed
  if (['completed', 'processing'].includes(data.status)) {
    const cfId = uuid();
    db.prepare(`
      INSERT INTO cash_flow_events (id, direction, amount_sar, source, reference_id, category, activity_type, description, occurred_at)
      VALUES (?, 'in', ?, 'salla_order', ?, 'revenue', 'operating', ?, ?)
    `).run(cfId, data.total_sar, id, `Order ${data.salla_order_id || id}`, now);
  }

  // Update customer stats if linked
  if (data.customer_id) {
    db.prepare(`
      UPDATE customers SET total_orders = total_orders + 1, total_spent_sar = total_spent_sar + ?, last_order_at = ?
      WHERE id = ?
    `).run(data.total_sar, now, data.customer_id);
  }

  const order = db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(id);
  broadcast('sale.recorded', { order_id: id, total_sar: data.total_sar });
  broadcast('dashboard.refresh', {});

  return c.json(order, 201);
});

export default app;
