import { Hono } from 'hono';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { broadcast } from '../sse.js';

const app = new Hono();

const CreateBatchSchema = z.object({
  product_id: z.string(),
  batch_number: z.string().optional(),
  units_ordered: z.number(),
  units_received: z.number().default(0),
  unit_cost_usd: z.number(),
  freight_total_sar: z.number().default(0),
  customs_total_sar: z.number().default(0),
  packaging_total_sar: z.number().default(0),
  supplier_name: z.string().optional(),
  status: z.string().default('ordered'),
  ordered_at: z.string().optional(),
});

// GET /api/inventory — valuation summary by product
app.get('/api/inventory', (c) => {
  const rows = db.prepare(`
    SELECT p.id, p.name, p.sku, p.selling_price_sar,
      COALESCE(SUM(ib.units_remaining), 0) as total_units,
      COALESCE(SUM(ib.units_remaining * ib.landed_cost_per_unit_sar), 0) as stock_value_sar,
      CASE WHEN SUM(ib.units_remaining) > 0
        THEN SUM(ib.units_remaining * ib.landed_cost_per_unit_sar) / SUM(ib.units_remaining)
        ELSE 0 END as avg_landed_cost_sar
    FROM products p
    LEFT JOIN inventory_batches ib ON ib.product_id = p.id AND ib.units_remaining > 0
    WHERE p.status = 'active'
    GROUP BY p.id
    ORDER BY p.name
  `).all();

  const totalValue = (rows as { stock_value_sar: number }[]).reduce((s, r) => s + r.stock_value_sar, 0);

  return c.json({ data: rows, total_stock_value_sar: totalValue });
});

// GET /api/inventory/batches
app.get('/api/inventory/batches', (c) => {
  const product_id = c.req.query('product_id');
  let query = `
    SELECT ib.*, p.name as product_name
    FROM inventory_batches ib
    JOIN products p ON p.id = ib.product_id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (product_id) {
    query += ' AND ib.product_id = ?';
    params.push(product_id);
  }

  query += ' ORDER BY ib.created_at DESC';
  const rows = db.prepare(query).all(...params);
  return c.json({ data: rows });
});

// POST /api/inventory/batches
app.post('/api/inventory/batches', async (c) => {
  const body = await c.req.json();
  const parsed = CreateBatchSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const id = uuid();
  const now = new Date().toISOString();

  // Calculate landed cost per unit
  const rateRow = db.prepare("SELECT value FROM config WHERE key = 'exchange_rate_usd_sar'").get() as { value: string } | undefined;
  const exchangeRate = parseFloat(rateRow?.value || '3.75');
  const unitsForCalc = data.units_ordered || 1;
  const landedCost = (data.unit_cost_usd * exchangeRate) +
    (data.freight_total_sar / unitsForCalc) +
    (data.customs_total_sar / unitsForCalc) +
    (data.packaging_total_sar / unitsForCalc);

  db.prepare(`
    INSERT INTO inventory_batches (id, product_id, batch_number, units_ordered, units_received, units_remaining, unit_cost_usd, freight_total_sar, customs_total_sar, packaging_total_sar, landed_cost_per_unit_sar, supplier_name, status, ordered_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.product_id, data.batch_number ?? null, data.units_ordered, data.units_received, data.units_received, data.unit_cost_usd, data.freight_total_sar, data.customs_total_sar, data.packaging_total_sar, Math.round(landedCost * 100) / 100, data.supplier_name ?? null, data.status, data.ordered_at ?? now, now);

  const batch = db.prepare('SELECT * FROM inventory_batches WHERE id = ?').get(id);
  broadcast('inventory.batch_added', { id, product_id: data.product_id });
  return c.json(batch, 201);
});

export default app;
