import { Hono } from 'hono';
import db from '../db.js';

const app = new Hono();

app.get('/api/customers', (c) => {
  const city = c.req.query('city');
  const search = c.req.query('search');

  let query = 'SELECT * FROM customers WHERE 1=1';
  const params: unknown[] = [];

  if (city) {
    query += ' AND city = ?';
    params.push(city);
  }
  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY total_spent_sar DESC';
  const rows = db.prepare(query).all(...params);
  return c.json({ data: rows });
});

app.get('/api/customers/:id', (c) => {
  const id = c.req.param('id');
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  if (!customer) return c.json({ error: 'Customer not found' }, 404);

  const orders = db.prepare(
    'SELECT * FROM sales_orders WHERE customer_id = ? ORDER BY created_at DESC'
  ).all(id);

  return c.json({ ...customer as Record<string, unknown>, orders });
});

export default app;
