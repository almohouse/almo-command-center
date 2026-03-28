import { Hono } from 'hono';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { broadcast } from '../sse.js';

const app = new Hono();

const CreateProductSchema = z.object({
  name: z.string(),
  name_ar: z.string().optional(),
  sku: z.string().optional(),
  salla_product_id: z.string().optional(),
  unit_cost_usd: z.number().optional(),
  freight_per_unit_sar: z.number().default(0),
  customs_per_unit_sar: z.number().default(0),
  packaging_per_unit_sar: z.number().default(0),
  landed_cost_sar: z.number().optional(),
  selling_price_sar: z.number(),
  image_url: z.string().optional(),
  status: z.string().default('active'),
});

const UpdateProductSchema = CreateProductSchema.partial();

app.get('/api/products', (c) => {
  const status = c.req.query('status');
  let query = 'SELECT * FROM products';
  const params: unknown[] = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params);
  return c.json({ data: rows });
});

app.post('/api/products', async (c) => {
  const body = await c.req.json();
  const parsed = CreateProductSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO products (id, salla_product_id, name, name_ar, sku, unit_cost_usd, freight_per_unit_sar, customs_per_unit_sar, packaging_per_unit_sar, landed_cost_sar, selling_price_sar, image_url, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.salla_product_id ?? null, data.name, data.name_ar ?? null, data.sku ?? null, data.unit_cost_usd ?? null, data.freight_per_unit_sar, data.customs_per_unit_sar, data.packaging_per_unit_sar, data.landed_cost_sar ?? null, data.selling_price_sar, data.image_url ?? null, data.status, now, now);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  broadcast('product.created', { id, name: data.name });
  return c.json(product, 201);
});

app.patch('/api/products/:id', async (c) => {
  const id = c.req.param('id');
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return c.json({ error: 'Product not found' }, 404);

  const body = await c.req.json();
  const parsed = UpdateProductSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const data = parsed.data;
  const now = new Date().toISOString();
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return c.json(existing);

  const sets = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  db.prepare(`UPDATE products SET ${sets}, updated_at = ? WHERE id = ?`).run(...values, now, id);

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  broadcast('product.updated', { id });
  return c.json(updated);
});

export default app;
