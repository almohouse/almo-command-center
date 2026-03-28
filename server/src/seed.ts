import { v4 as uuid } from 'uuid';
import db from './db.js';

console.log('Seeding ALMO Mission Control database...\n');

// ─── Products ────────────────────────────────────────────────────
const products = [
  { id: uuid(), name: 'Cocoon Pillow', name_ar: 'مخدة كوكون', sku: 'ALM-PIL-001', unit_cost_usd: 12.50, selling_price_sar: 149, landed_cost_sar: 62 },
  { id: uuid(), name: 'Comfort Blanket', name_ar: 'بطانية الراحة', sku: 'ALM-BLK-001', unit_cost_usd: 22.00, selling_price_sar: 249, landed_cost_sar: 105 },
  { id: uuid(), name: 'Keyboard Tray', name_ar: 'حامل لوحة المفاتيح', sku: 'ALM-KEY-001', unit_cost_usd: 15.00, selling_price_sar: 129, landed_cost_sar: 72 },
  { id: uuid(), name: 'Travel Neck Support', name_ar: 'دعامة الرقبة', sku: 'ALM-NCK-001', unit_cost_usd: 8.00, selling_price_sar: 89, landed_cost_sar: 42 },
  { id: uuid(), name: 'Desk Mat', name_ar: 'قاعدة مكتب', sku: 'ALM-MAT-001', unit_cost_usd: 6.50, selling_price_sar: 79, landed_cost_sar: 35 },
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (id, name, name_ar, sku, unit_cost_usd, selling_price_sar, landed_cost_sar, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
`);

for (const p of products) {
  insertProduct.run(p.id, p.name, p.name_ar, p.sku, p.unit_cost_usd, p.selling_price_sar, p.landed_cost_sar);
}
console.log(`✓ ${products.length} products`);

// ─── Inventory Batches ───────────────────────────────────────────
const batches = [
  { product: products[0], batch: 'B001', units: 200, cost: 12.50, freight: 800, customs: 400, packaging: 200, status: 'received' },
  { product: products[1], batch: 'B002', units: 100, cost: 22.00, freight: 600, customs: 300, packaging: 150, status: 'received' },
  { product: products[2], batch: 'B003', units: 150, cost: 15.00, freight: 500, customs: 250, packaging: 100, status: 'ordered' },
];

const insertBatch = db.prepare(`
  INSERT OR IGNORE INTO inventory_batches (id, product_id, batch_number, units_ordered, units_received, units_remaining, unit_cost_usd, freight_total_sar, customs_total_sar, packaging_total_sar, landed_cost_per_unit_sar, supplier_name, status, ordered_at, received_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Comfort Goods Co.', ?, ?, ?, datetime('now'))
`);

for (const b of batches) {
  const landedCost = (b.cost * 3.75) + (b.freight / b.units) + (b.customs / b.units) + (b.packaging / b.units);
  const received = b.status === 'received' ? b.units : 0;
  const remaining = b.status === 'received' ? Math.floor(b.units * 0.8) : 0; // 80% remaining
  insertBatch.run(uuid(), b.product.id, b.batch, b.units, received, remaining, b.cost, b.freight, b.customs, b.packaging, Math.round(landedCost * 100) / 100, b.status, '2026-01-15', b.status === 'received' ? '2026-02-10' : null);
}
console.log(`✓ ${batches.length} inventory batches`);

// ─── Customers ───────────────────────────────────────────────────
const cities = ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah', 'Tabuk', 'Abha', 'Khobar'];
const firstNames = ['Ahmed', 'Fatima', 'Omar', 'Noura', 'Khalid', 'Sara', 'Youssef', 'Layla', 'Hassan', 'Maha', 'Ali', 'Dana', 'Mohammed', 'Reem', 'Faisal'];
const customers: { id: string; name: string; email: string; phone: string; city: string }[] = [];

for (let i = 0; i < 15; i++) {
  const name = firstNames[i] + ' Al-' + ['Rashid', 'Harbi', 'Otaibi', 'Ghamdi', 'Qahtani', 'Shehri', 'Dosari', 'Mutairi', 'Zahrani', 'Anazi', 'Subaie', 'Malki', 'Shamrani', 'Bishi', 'Tamimi'][i];
  customers.push({
    id: uuid(),
    name,
    email: firstNames[i].toLowerCase() + '@example.com',
    phone: `+9665${String(50000000 + Math.floor(Math.random() * 9999999))}`,
    city: cities[Math.floor(Math.random() * cities.length)],
  });
}

const insertCustomer = db.prepare(`
  INSERT OR IGNORE INTO customers (id, name, email, phone, city, total_orders, total_spent_sar, created_at)
  VALUES (?, ?, ?, ?, ?, 0, 0, datetime('now'))
`);

for (const c of customers) {
  insertCustomer.run(c.id, c.name, c.email, c.phone, c.city);
}
console.log(`✓ ${customers.length} customers`);

// ─── Sales Orders ────────────────────────────────────────────────
const statuses = ['completed', 'completed', 'completed', 'processing', 'shipped'];
const insertOrder = db.prepare(`
  INSERT OR IGNORE INTO sales_orders (id, customer_id, items_json, subtotal_sar, shipping_sar, tax_sar, discount_sar, total_sar, status, channel, payment_method, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'salla', ?, ?, ?)
`);

const updateCustomerStats = db.prepare(`
  UPDATE customers SET total_orders = total_orders + 1, total_spent_sar = total_spent_sar + ?, last_order_at = ?
  WHERE id = ?
`);

const insertCashflow = db.prepare(`
  INSERT OR IGNORE INTO cash_flow_events (id, direction, amount_sar, source, reference_id, category, activity_type, description, occurred_at, created_at)
  VALUES (?, 'in', ?, 'salla_order', ?, 'revenue', 'operating', ?, ?, datetime('now'))
`);

let orderCount = 0;
for (let i = 0; i < 20; i++) {
  const customer = customers[i % customers.length];
  const product = products[Math.floor(Math.random() * products.length)];
  const qty = Math.floor(Math.random() * 3) + 1;
  const subtotal = product.selling_price_sar * qty;
  const shipping = 25;
  const tax = Math.round(subtotal * 0.15);
  const discount = i % 5 === 0 ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + shipping + tax - discount;
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const month = String(Math.floor(Math.random() * 3) + 1).padStart(2, '0');
  const createdAt = `2026-${month}-${day}T${String(Math.floor(Math.random() * 14) + 8).padStart(2, '0')}:00:00.000Z`;
  const orderId = uuid();

  const items = JSON.stringify([{
    product_id: product.id,
    product_name: product.name,
    quantity: qty,
    unit_price: product.selling_price_sar,
    landed_cost: product.landed_cost_sar,
  }]);

  insertOrder.run(orderId, customer.id, items, subtotal, shipping, tax, discount, total, status, 'credit_card', createdAt, createdAt);
  updateCustomerStats.run(total, createdAt, customer.id);
  if (status === 'completed' || status === 'processing') {
    insertCashflow.run(uuid(), total, orderId, `Order for ${product.name}`, createdAt);
  }
  orderCount++;
}
console.log(`✓ ${orderCount} sales orders`);

// ─── Expenses ────────────────────────────────────────────────────
const expenseData = [
  { category: 'marketing', desc: 'Instagram ads — March campaign', amount: 2500 },
  { category: 'marketing', desc: 'Influencer collaboration — Comfort review', amount: 3000 },
  { category: 'shipping', desc: 'SMSA courier — Feb batch', amount: 1200 },
  { category: 'shipping', desc: 'Aramex express deliveries', amount: 800 },
  { category: 'operations', desc: 'Warehouse monthly rent', amount: 4000 },
  { category: 'operations', desc: 'Packaging materials restock', amount: 650 },
  { category: 'subscriptions', desc: 'Wix Premium', amount: 112 },
  { category: 'subscriptions', desc: 'ChatGPT Pro', amount: 75 },
  { category: 'equipment', desc: 'Photography lighting kit', amount: 890 },
  { category: 'legal', desc: 'Commercial registration renewal', amount: 500 },
];

const insertExpense = db.prepare(`
  INSERT OR IGNORE INTO expenses (id, category, description, amount_sar, payment_method, is_recurring, created_by, created_at, updated_at)
  VALUES (?, ?, ?, ?, 'bank_transfer', ?, 'moe', ?, ?)
`);

const insertExpenseCashflow = db.prepare(`
  INSERT OR IGNORE INTO cash_flow_events (id, direction, amount_sar, source, reference_id, category, activity_type, description, occurred_at, created_at)
  VALUES (?, 'out', ?, 'expense', ?, ?, 'operating', ?, ?, datetime('now'))
`);

for (const e of expenseData) {
  const id = uuid();
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const month = String(Math.floor(Math.random() * 3) + 1).padStart(2, '0');
  const createdAt = `2026-${month}-${day}T10:00:00.000Z`;
  const isRecurring = e.category === 'subscriptions' ? 1 : 0;
  insertExpense.run(id, e.category, e.desc, e.amount, isRecurring, createdAt, createdAt);
  insertExpenseCashflow.run(uuid(), e.amount, id, e.category, e.desc, createdAt);
}
console.log(`✓ ${expenseData.length} expenses`);

// ─── Subscriptions ───────────────────────────────────────────────
const subs = [
  { name: 'Wix', cost: 112, cycle: 'monthly' },
  { name: 'Salla', cost: 299, cycle: 'monthly' },
  { name: 'Zapier', cost: 75, cycle: 'monthly' },
  { name: 'ElevenLabs', cost: 82, cycle: 'monthly' },
  { name: 'Airtable', cost: 37, cycle: 'monthly' },
  { name: 'ChatGPT Pro', cost: 75, cycle: 'monthly' },
  { name: 'Gemini Pro', cost: 75, cycle: 'monthly' },
  { name: 'Higgsfield', cost: 56, cycle: 'monthly' },
  { name: 'Freepik', cost: 45, cycle: 'monthly' },
  { name: 'n8n', cost: 82, cycle: 'monthly' },
  { name: 'Suno', cost: 37, cycle: 'monthly' },
  { name: 'HeyGen', cost: 89, cycle: 'monthly' },
  { name: 'GenSpark', cost: 37, cycle: 'monthly' },
];

const insertSub = db.prepare(`
  INSERT OR IGNORE INTO subscriptions (id, service_name, category, cost_sar, billing_cycle, next_billing_date, status, created_at, updated_at)
  VALUES (?, ?, 'subscriptions', ?, ?, ?, 'active', datetime('now'), datetime('now'))
`);

for (const s of subs) {
  insertSub.run(uuid(), s.name, s.cost, s.cycle, '2026-04-01');
}
console.log(`✓ ${subs.length} subscriptions`);

// ─── Agents ──────────────────────────────────────────────────────
const agents = [
  { name: 'DCEO', title: 'Digital Chief Executive Officer', role: 'executive', icon: '🧠', model: 'claude-opus-4-6', personality: 'Strategic, decisive, orchestrates all agents. First-principles thinker.', description: 'The central orchestrator of ALMO OS. Manages all agents, reviews work, and drives company goals.', skills: '["strategic-planning","agent-orchestration","decision-making","goal-tracking"]', reports_to: null },
  { name: 'Scout', title: 'Research & Intelligence Agent', role: 'research', icon: '🔍', model: 'claude-sonnet-4-6', personality: 'Curious, thorough, data-driven. Excels at finding insights others miss.', description: 'Market research, competitor analysis, trend spotting, and supplier discovery.', skills: '["market-research","competitor-analysis","web-scraping","data-synthesis"]', reports_to: null as string | null },
  { name: 'CTO', title: 'Chief Technology Officer', role: 'engineering', icon: '⚙️', model: 'claude-sonnet-4-6', personality: 'Precise, efficient, quality-focused. Writes clean, production-ready code.', description: 'Handles all technical implementation — frontend, backend, infrastructure, and automation.', skills: '["full-stack-dev","system-design","code-review","ci-cd"]', reports_to: null as string | null },
  { name: 'CFO', title: 'Chief Financial Officer', role: 'finance', icon: '💰', model: 'claude-haiku-4-5-20251001', personality: 'Conservative, analytical, risk-aware. Every riyal matters.', description: 'Financial analysis, expense tracking, P&L monitoring, and budget management.', skills: '["financial-analysis","budgeting","forecasting","expense-management"]', reports_to: null as string | null },
  { name: 'CRDO', title: 'Chief R&D Officer', role: 'product', icon: '🔬', model: 'claude-sonnet-4-6', personality: 'Innovative, user-centric, quality-obsessed. Thinks about what customers will want next.', description: 'Product development, new product research, comfort engineering innovation.', skills: '["product-development","user-research","prototyping","quality-assurance"]', reports_to: null as string | null },
];

const insertAgent = db.prepare(`
  INSERT OR IGNORE INTO agents (id, name, title, role, icon, model, personality, description, skills, reports_to, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'idle', datetime('now'), datetime('now'))
`);

const agentIds: string[] = [];
for (const a of agents) {
  const id = uuid();
  agentIds.push(id);
  insertAgent.run(id, a.name, a.title, a.role, a.icon, a.model, a.personality, a.description, a.skills, a.reports_to);
}
// Set reports_to for non-DCEO agents
for (let i = 1; i < agentIds.length; i++) {
  db.prepare('UPDATE agents SET reports_to = ? WHERE id = ?').run(agentIds[0], agentIds[i]);
}
console.log(`✓ ${agents.length} agents`);

// ─── Goals ───────────────────────────────────────────────────────
const goalIds: string[] = [];
const goalsData = [
  { title: 'Reach 50K SAR monthly revenue', level: 'company', target: 50000, current: 18500, unit: 'SAR', date: '2026-06-30' },
  { title: 'Launch Weighted Blanket product line', level: 'project', target: 100, current: 35, unit: '%', date: '2026-05-15' },
  { title: 'Grow customer base to 100 active buyers', level: 'company', target: 100, current: 15, unit: 'customers', date: '2026-12-31' },
];

const insertGoal = db.prepare(`
  INSERT OR IGNORE INTO goals (id, title, level, status, owner_agent_id, target_value, current_value, unit, target_date, created_at, updated_at)
  VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

for (const g of goalsData) {
  const id = uuid();
  goalIds.push(id);
  insertGoal.run(id, g.title, g.level, agentIds[0], g.target, g.current, g.unit, g.date);
}
console.log(`✓ ${goalsData.length} goals`);

// ─── Projects ────────────────────────────────────────────────────
const projectIds: string[] = [];
const projectsData = [
  { identifier: 'WP-1', name: 'Mission Control Backend', desc: 'Build the Hono API server for Mission Control', type: 'engineering', lead: agentIds[2], goal: goalIds[0] },
  { identifier: 'WP-2', name: 'Weighted Blanket Launch', desc: 'Research, source, and launch the premium weighted blanket product', type: 'product', lead: agentIds[4], goal: goalIds[1] },
];

const insertProject = db.prepare(`
  INSERT OR IGNORE INTO projects (id, identifier, name, description, type, status, lead_agent_id, goal_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, 'active', ?, ?, datetime('now'), datetime('now'))
`);

for (const p of projectsData) {
  const id = uuid();
  projectIds.push(id);
  insertProject.run(id, p.identifier, p.name, p.desc, p.type, p.lead, p.goal);
}
console.log(`✓ ${projectsData.length} projects`);

// ─── Tasks ───────────────────────────────────────────────────────
const tasksData = [
  { title: 'Set up Hono server with SQLite', status: 'done', priority: 'high', project: 0, agent: 2 },
  { title: 'Create API routes for sales & expenses', status: 'in_progress', priority: 'high', project: 0, agent: 2 },
  { title: 'Implement SSE broadcasting', status: 'todo', priority: 'medium', project: 0, agent: 2 },
  { title: 'Seed database with sample data', status: 'todo', priority: 'medium', project: 0, agent: 2 },
  { title: 'Connect frontend to backend API', status: 'backlog', priority: 'high', project: 0, agent: 2 },
  { title: 'Research weighted blanket suppliers in China', status: 'in_progress', priority: 'high', project: 1, agent: 1 },
  { title: 'Get 3 supplier quotes for comparison', status: 'todo', priority: 'high', project: 1, agent: 1 },
  { title: 'Design product photography brief', status: 'backlog', priority: 'medium', project: 1, agent: 4 },
  { title: 'Create Salla product listing', status: 'backlog', priority: 'medium', project: 1, agent: 2 },
  { title: 'Set monthly budget allocations', status: 'todo', priority: 'high', project: -1, agent: 3 },
];

const insertTask = db.prepare(`
  INSERT OR IGNORE INTO tasks (id, identifier, title, status, priority, project_id, goal_id, assignee_agent_id, created_at, updated_at, started_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?)
`);

// Get current counter
let taskCounter = 200;
for (const t of tasksData) {
  taskCounter++;
  const identifier = `ALMO-${taskCounter}`;
  const projectId = t.project >= 0 ? projectIds[t.project] : null;
  const goalId = t.project >= 0 ? (t.project === 0 ? goalIds[0] : goalIds[1]) : null;
  const startedAt = ['in_progress', 'done'].includes(t.status) ? '2026-03-25T09:00:00.000Z' : null;
  const completedAt = t.status === 'done' ? '2026-03-27T14:00:00.000Z' : null;
  insertTask.run(uuid(), identifier, t.title, t.status, t.priority, projectId, goalId, agentIds[t.agent], startedAt, completedAt);
}
// Update counter
db.prepare("UPDATE config SET value = ? WHERE key = 'task_counter'").run(String(taskCounter));
console.log(`✓ ${tasksData.length} tasks`);

// ─── Budgets ─────────────────────────────────────────────────────
const budgetsData = [
  { category: 'marketing', amount: 5000 },
  { category: 'shipping', amount: 3000 },
  { category: 'subscriptions', amount: 1200 },
  { category: 'operations', amount: 6000 },
  { category: 'equipment', amount: 2000 },
  { category: 'legal', amount: 1000 },
  { category: 'ai_agents', amount: 500 },
];

const insertBudget = db.prepare(`
  INSERT OR IGNORE INTO budgets (id, category, monthly_amount_sar, period, created_at, updated_at)
  VALUES (?, ?, ?, 'monthly', datetime('now'), datetime('now'))
`);

for (const b of budgetsData) {
  insertBudget.run(uuid(), b.category, b.amount);
}
console.log(`✓ ${budgetsData.length} budget entries`);

console.log('\n✅ Database seeded successfully!');
console.log(`   Database: server/mission-control.db`);
