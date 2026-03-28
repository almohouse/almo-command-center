import { Hono } from 'hono';
import db from '../db.js';

const app = new Hono();

// GET /api/dashboard/summary — aggregated KPIs
app.get('/api/dashboard/summary', (c) => {
  const now = new Date();
  const monthStart = now.toISOString().slice(0, 7) + '-01';
  const todayStr = now.toISOString().slice(0, 10);

  // Revenue this month
  const revenue = db.prepare(`
    SELECT COALESCE(SUM(total_sar), 0) as total, COUNT(*) as orders
    FROM sales_orders
    WHERE status IN ('completed', 'processing') AND created_at >= ?
  `).get(monthStart) as { total: number; orders: number };

  // Revenue today
  const todayRevenue = db.prepare(`
    SELECT COALESCE(SUM(total_sar), 0) as total, COUNT(*) as orders
    FROM sales_orders
    WHERE status IN ('completed', 'processing') AND created_at >= ?
  `).get(todayStr) as { total: number; orders: number };

  // Expenses this month
  const expenses = db.prepare(`
    SELECT COALESCE(SUM(amount_sar), 0) as total
    FROM expenses WHERE created_at >= ?
  `).get(monthStart) as { total: number };

  // Cash position
  const openingRow = db.prepare("SELECT value FROM config WHERE key = 'cash_opening_balance'").get() as { value: string } | undefined;
  const openingBalance = parseFloat(openingRow?.value || '0');
  const netFlow = db.prepare(`
    SELECT COALESCE(SUM(CASE WHEN direction = 'in' THEN amount_sar ELSE -amount_sar END), 0) as net
    FROM cash_flow_events
  `).get() as { net: number };

  // Customers
  const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };
  const newCustomers = db.prepare(
    'SELECT COUNT(*) as count FROM customers WHERE created_at >= ?'
  ).get(monthStart) as { count: number };

  // Products & inventory
  const inventory = db.prepare(`
    SELECT COUNT(DISTINCT p.id) as products,
      COALESCE(SUM(ib.units_remaining), 0) as total_units
    FROM products p
    LEFT JOIN inventory_batches ib ON ib.product_id = p.id AND ib.units_remaining > 0
    WHERE p.status = 'active'
  `).get() as { products: number; total_units: number };

  // Active tasks
  const tasks = db.prepare(`
    SELECT status, COUNT(*) as count FROM tasks
    WHERE status NOT IN ('done', 'cancelled')
    GROUP BY status
  `).all() as { status: string; count: number }[];

  // Pending approvals
  const pendingApprovals = db.prepare(
    "SELECT COUNT(*) as count FROM approvals WHERE status = 'pending'"
  ).get() as { count: number };

  // Active agents
  const activeAgents = db.prepare(
    "SELECT COUNT(*) as count FROM agents WHERE status != 'inactive'"
  ).get() as { count: number };

  // Goals progress
  const goals = db.prepare(`
    SELECT COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
    FROM goals
  `).get() as { total: number; completed: number; active: number };

  // AOV
  const aov = revenue.orders > 0 ? Math.round(revenue.total / revenue.orders) : 0;

  return c.json({
    revenue: {
      month_total_sar: revenue.total,
      month_orders: revenue.orders,
      today_total_sar: todayRevenue.total,
      today_orders: todayRevenue.orders,
      aov_sar: aov,
    },
    expenses: {
      month_total_sar: expenses.total,
    },
    cash: {
      position_sar: openingBalance + netFlow.net,
      opening_balance_sar: openingBalance,
    },
    customers: {
      total: customerCount.count,
      new_this_month: newCustomers.count,
    },
    inventory: {
      active_products: inventory.products,
      total_units: inventory.total_units,
    },
    tasks: Object.fromEntries(tasks.map(t => [t.status, t.count])),
    pending_approvals: pendingApprovals.count,
    active_agents: activeAgents.count,
    goals,
    net_profit_estimate_sar: revenue.total - expenses.total,
  });
});

// GET /api/dashboard/action-items
app.get('/api/dashboard/action-items', (c) => {
  const items: { type: string; priority: string; message: string; link: string }[] = [];

  // Pending approvals
  const approvals = db.prepare(
    "SELECT id, title FROM approvals WHERE status = 'pending' ORDER BY created_at DESC LIMIT 5"
  ).all() as { id: string; title: string }[];
  for (const a of approvals) {
    items.push({ type: 'approval', priority: 'high', message: a.title, link: `/approvals` });
  }

  // Tasks in review
  const reviewTasks = db.prepare(
    "SELECT identifier, title FROM tasks WHERE status = 'in_review' ORDER BY updated_at DESC LIMIT 5"
  ).all() as { identifier: string; title: string }[];
  for (const t of reviewTasks) {
    items.push({ type: 'review', priority: 'medium', message: `${t.identifier}: ${t.title}`, link: `/tasks` });
  }

  // Low stock alerts
  const alerts = db.prepare(`
    SELECT ia.message, p.name FROM inventory_alerts ia
    JOIN products p ON p.id = ia.product_id
    WHERE ia.resolved = 0
    ORDER BY ia.created_at DESC LIMIT 5
  `).all() as { message: string; name: string }[];
  for (const a of alerts) {
    items.push({ type: 'inventory', priority: 'medium', message: a.message || `Low stock: ${a.name}`, link: `/inventory` });
  }

  // Budget overages
  const budgetIssues = db.prepare(`
    SELECT category, actual_sar, budget_sar FROM budget_incidents
    WHERE created_at >= date('now', 'start of month')
    ORDER BY created_at DESC LIMIT 3
  `).all() as { category: string; actual_sar: number; budget_sar: number }[];
  for (const b of budgetIssues) {
    items.push({ type: 'budget', priority: 'high', message: `${b.category} over budget: ${b.actual_sar} / ${b.budget_sar} SAR`, link: `/finance` });
  }

  return c.json({ data: items });
});

export default app;
