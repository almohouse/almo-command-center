import { Hono } from 'hono';
import { v4 as uuid } from 'uuid';
import db from '../db.js';

const app = new Hono();

// GET /api/pnl?period=2026-03&type=monthly
app.get('/api/pnl', (c) => {
  const period = c.req.query('period') || new Date().toISOString().slice(0, 7);
  const type = c.req.query('type') || 'monthly';

  // Check for cached snapshot first
  const cached = db.prepare(
    'SELECT * FROM pnl_snapshots WHERE period = ? AND period_type = ?'
  ).get(period, type) as Record<string, unknown> | undefined;

  // Always compute fresh
  const periodStart = period + '-01';
  const periodEnd = period + '-31T23:59:59';

  // Revenue from sales
  const revenue = db.prepare(`
    SELECT COALESCE(SUM(total_sar), 0) as total,
           COALESCE(SUM(shipping_sar), 0) as shipping,
           COALESCE(SUM(discount_sar), 0) as discounts,
           COUNT(*) as order_count
    FROM sales_orders
    WHERE status IN ('completed', 'processing')
    AND created_at >= ? AND created_at <= ?
  `).get(periodStart, periodEnd) as { total: number; shipping: number; discounts: number; order_count: number };

  // COGS — simplified: use product landed costs × quantities from items_json
  const orders = db.prepare(`
    SELECT items_json FROM sales_orders
    WHERE status IN ('completed', 'processing')
    AND created_at >= ? AND created_at <= ?
  `).all(periodStart, periodEnd) as { items_json: string }[];

  let totalCogs = 0;
  for (const order of orders) {
    try {
      const items = JSON.parse(order.items_json) as { product_id?: string; quantity?: number; landed_cost?: number }[];
      for (const item of items) {
        if (item.landed_cost && item.quantity) {
          totalCogs += item.landed_cost * item.quantity;
        } else if (item.product_id) {
          const product = db.prepare('SELECT landed_cost_sar FROM products WHERE id = ?').get(item.product_id) as { landed_cost_sar: number | null } | undefined;
          if (product?.landed_cost_sar) {
            totalCogs += product.landed_cost_sar * (item.quantity || 1);
          }
        }
      }
    } catch { /* skip malformed */ }
  }

  // Operating expenses by category
  const expenseBreakdown = db.prepare(`
    SELECT category, COALESCE(SUM(amount_sar), 0) as total
    FROM expenses
    WHERE created_at >= ? AND created_at <= ?
    GROUP BY category
  `).all(periodStart, periodEnd) as { category: string; total: number }[];

  const opexMap = Object.fromEntries(expenseBreakdown.map(e => [e.category, e.total]));
  const totalOpex = expenseBreakdown.reduce((sum, e) => sum + e.total, 0);

  // Agent costs
  const agentCosts = db.prepare(`
    SELECT COALESCE(SUM(cost_cents), 0) as total
    FROM cost_events
    WHERE occurred_at >= ? AND occurred_at <= ?
  `).get(periodStart, periodEnd) as { total: number };
  const aiCosts = agentCosts.total / 100;

  const grossProfit = revenue.total - totalCogs;
  const grossMargin = revenue.total > 0 ? (grossProfit / revenue.total) * 100 : 0;
  const totalOpexWithAi = totalOpex + aiCosts;
  const netProfit = grossProfit - totalOpexWithAi;
  const netMargin = revenue.total > 0 ? (netProfit / revenue.total) * 100 : 0;

  const result = {
    period,
    period_type: type,
    revenue_sar: revenue.total,
    order_count: revenue.order_count,
    cogs_sar: totalCogs,
    cogs_breakdown_json: { product_cost: totalCogs },
    gross_profit_sar: grossProfit,
    gross_margin_pct: Math.round(grossMargin * 100) / 100,
    opex_breakdown_json: { ...opexMap, ai_agents: aiCosts },
    total_opex_sar: totalOpexWithAi,
    net_profit_sar: netProfit,
    net_margin_pct: Math.round(netMargin * 100) / 100,
  };

  // Cache the snapshot
  const snapId = cached ? (cached.id as string) : uuid();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO pnl_snapshots (id, period, period_type, revenue_sar, cogs_sar, cogs_breakdown_json, gross_profit_sar, gross_margin_pct, opex_breakdown_json, total_opex_sar, net_profit_sar, net_margin_pct, computed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(period, period_type) DO UPDATE SET
      revenue_sar = excluded.revenue_sar, cogs_sar = excluded.cogs_sar,
      cogs_breakdown_json = excluded.cogs_breakdown_json,
      gross_profit_sar = excluded.gross_profit_sar, gross_margin_pct = excluded.gross_margin_pct,
      opex_breakdown_json = excluded.opex_breakdown_json, total_opex_sar = excluded.total_opex_sar,
      net_profit_sar = excluded.net_profit_sar, net_margin_pct = excluded.net_margin_pct,
      computed_at = excluded.computed_at
  `).run(snapId, period, type, result.revenue_sar, result.cogs_sar, JSON.stringify(result.cogs_breakdown_json), result.gross_profit_sar, result.gross_margin_pct, JSON.stringify(result.opex_breakdown_json), result.total_opex_sar, result.net_profit_sar, result.net_margin_pct, now);

  return c.json(result);
});

export default app;
