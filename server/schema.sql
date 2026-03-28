-- ALMO Mission Control — SQLite Schema (34 tables + 1 join table)
-- Generated 2026-03-28 by DCEO
-- Run with: sqlite3 mission-control.db < schema.sql

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- CORE BUSINESS

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  salla_product_id TEXT UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  sku TEXT,
  unit_cost_usd REAL,
  freight_per_unit_sar REAL DEFAULT 0,
  customs_per_unit_sar REAL DEFAULT 0,
  packaging_per_unit_sar REAL DEFAULT 0,
  landed_cost_sar REAL,
  selling_price_sar REAL NOT NULL DEFAULT 0,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  salla_customer_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  city TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent_sar REAL DEFAULT 0,
  first_order_at TEXT,
  last_order_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sales_orders (
  id TEXT PRIMARY KEY,
  salla_order_id TEXT UNIQUE,
  customer_id TEXT REFERENCES customers(id),
  items_json TEXT NOT NULL DEFAULT '[]',
  subtotal_sar REAL NOT NULL DEFAULT 0,
  shipping_sar REAL DEFAULT 0,
  tax_sar REAL DEFAULT 0,
  discount_sar REAL DEFAULT 0,
  total_sar REAL NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'processing',
  channel TEXT DEFAULT 'salla',
  payment_method TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales_orders(customer_id);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_sar REAL NOT NULL,
  amount_original REAL,
  currency_original TEXT DEFAULT 'SAR',
  payment_method TEXT,
  is_recurring INTEGER DEFAULT 0,
  receipt_path TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created ON expenses(created_at);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  category TEXT DEFAULT 'subscriptions',
  cost_sar REAL NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly',
  next_billing_date TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventory_batches (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  batch_number TEXT,
  units_ordered INTEGER NOT NULL,
  units_received INTEGER DEFAULT 0,
  units_remaining INTEGER DEFAULT 0,
  unit_cost_usd REAL NOT NULL,
  freight_total_sar REAL DEFAULT 0,
  customs_total_sar REAL DEFAULT 0,
  packaging_total_sar REAL DEFAULT 0,
  landed_cost_per_unit_sar REAL,
  supplier_name TEXT,
  status TEXT DEFAULT 'ordered',
  ordered_at TEXT,
  received_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_batches_product ON inventory_batches(product_id);

CREATE TABLE IF NOT EXISTS inventory_alerts (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id),
  type TEXT NOT NULL,
  message TEXT,
  severity TEXT DEFAULT 'warning',
  resolved INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  batch_id TEXT REFERENCES inventory_batches(id),
  adjustment_type TEXT NOT NULL,
  units_delta INTEGER NOT NULL,
  reason TEXT,
  adjusted_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- FINANCIAL

CREATE TABLE IF NOT EXISTS cash_flow_events (
  id TEXT PRIMARY KEY,
  direction TEXT NOT NULL,
  amount_sar REAL NOT NULL,
  source TEXT NOT NULL,
  reference_id TEXT,
  category TEXT,
  activity_type TEXT DEFAULT 'operating',
  description TEXT,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cashflow_occurred ON cash_flow_events(occurred_at);

CREATE TABLE IF NOT EXISTS scheduled_payments (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount_sar REAL NOT NULL,
  direction TEXT NOT NULL,
  expected_date TEXT NOT NULL,
  is_recurring INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  monthly_amount_sar REAL NOT NULL,
  period TEXT DEFAULT 'monthly',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS budget_incidents (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  budget_sar REAL NOT NULL,
  actual_sar REAL NOT NULL,
  variance_sar REAL NOT NULL,
  severity TEXT DEFAULT 'warning',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pnl_snapshots (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  period_type TEXT NOT NULL,
  revenue_sar REAL DEFAULT 0,
  cogs_sar REAL DEFAULT 0,
  cogs_breakdown_json TEXT DEFAULT '{}',
  gross_profit_sar REAL DEFAULT 0,
  gross_margin_pct REAL DEFAULT 0,
  opex_breakdown_json TEXT DEFAULT '{}',
  total_opex_sar REAL DEFAULT 0,
  net_profit_sar REAL DEFAULT 0,
  net_margin_pct REAL DEFAULT 0,
  computed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(period, period_type)
);

CREATE TABLE IF NOT EXISTS daily_aggregates (
  date TEXT PRIMARY KEY,
  revenue_sar REAL DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  aov_sar REAL DEFAULT 0,
  expenses_sar REAL DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  computed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS financial_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT DEFAULT 'warning',
  message TEXT NOT NULL,
  period TEXT,
  resolved INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id TEXT PRIMARY KEY,
  currency_pair TEXT NOT NULL DEFAULT 'USD/SAR',
  rate REAL NOT NULL,
  source TEXT DEFAULT 'manual',
  fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expense_edit_log (
  id TEXT PRIMARY KEY,
  expense_id TEXT NOT NULL REFERENCES expenses(id),
  changed_by TEXT NOT NULL,
  changed_fields TEXT NOT NULL,
  previous_values TEXT NOT NULL,
  new_values TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- GOALS & TASKS

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL DEFAULT 'company',
  status TEXT NOT NULL DEFAULT 'active',
  parent_id TEXT REFERENCES goals(id),
  owner_agent_id TEXT,
  target_value REAL,
  current_value REAL DEFAULT 0,
  unit TEXT,
  target_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  identifier TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  status TEXT DEFAULT 'active',
  lead_agent_id TEXT,
  goal_id TEXT REFERENCES goals(id),
  target_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  identifier TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT DEFAULT 'medium',
  project_id TEXT REFERENCES projects(id),
  goal_id TEXT REFERENCES goals(id),
  assignee_agent_id TEXT,
  assignee_user_id TEXT,
  execution_run_id TEXT,
  execution_locked_at TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_agent_id);

CREATE TABLE IF NOT EXISTS task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  author_type TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_task ON task_comments(task_id);

CREATE TABLE IF NOT EXISTS task_status_history (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_by_type TEXT DEFAULT 'system',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS goal_health_snapshots (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goals(id),
  status TEXT NOT NULL,
  current_value REAL,
  target_value REAL,
  snapshot_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AGENTS

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  role TEXT DEFAULT 'general',
  icon TEXT,
  avatar_path TEXT,
  model TEXT,
  personality TEXT,
  description TEXT,
  skills TEXT DEFAULT '[]',
  reports_to TEXT REFERENCES agents(id),
  telegram_bot TEXT,
  heartbeat_interval_min INTEGER DEFAULT 30,
  status TEXT DEFAULT 'idle',
  budget_monthly_cents INTEGER DEFAULT 0,
  spent_monthly_cents INTEGER DEFAULT 0,
  openclaw_agent_id TEXT,
  last_heartbeat_at TEXT,
  config_json TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_config_revisions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  changed_by TEXT NOT NULL,
  changed_fields TEXT NOT NULL,
  previous_values TEXT NOT NULL,
  new_values TEXT NOT NULL,
  source TEXT DEFAULT 'mission_control',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_wakeup_log (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  task_id TEXT REFERENCES tasks(id),
  reason TEXT NOT NULL,
  source TEXT DEFAULT 'system',
  triggered_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cost_events (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  task_id TEXT REFERENCES tasks(id),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_cents INTEGER NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_costs_agent ON cost_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_costs_occurred ON cost_events(occurred_at);

-- APPROVALS

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  requested_by_agent_id TEXT,
  requested_by_user_id TEXT,
  status TEXT DEFAULT 'pending',
  decided_by_user_id TEXT,
  decision_note TEXT,
  gate_file_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  decided_at TEXT
);

-- AUDIO & MEDIA

CREATE TABLE IF NOT EXISTS audio_episodes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT NOT NULL,
  page_source TEXT,
  file_path TEXT NOT NULL,
  duration_seconds INTEGER,
  script TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- COUNCIL MEETINGS

CREATE TABLE IF NOT EXISTS council_meetings (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  type TEXT DEFAULT 'dceo_led',
  status TEXT DEFAULT 'active',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT
);

CREATE TABLE IF NOT EXISTS council_meeting_participants (
  meeting_id TEXT NOT NULL REFERENCES council_meetings(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  PRIMARY KEY (meeting_id, agent_id)
);

CREATE TABLE IF NOT EXISTS meeting_messages (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES council_meetings(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  agent_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meeting_mom (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES council_meetings(id) UNIQUE,
  summary TEXT NOT NULL,
  decisions_json TEXT DEFAULT '[]',
  action_items_json TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- CONFIG & SYSTEM

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  category TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS salla_webhook_log (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  processed INTEGER DEFAULT 0,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- SEED DATA

INSERT OR IGNORE INTO config (key, value, category) VALUES
  ('task_counter', '200', 'system'),
  ('cash_opening_balance', '4783', 'financial'),
  ('cash_minimum_threshold', '2000', 'financial'),
  ('goals.monthly_revenue_target', '50000', 'business'),
  ('goals.annual_growth_target', '40', 'business'),
  ('salla_last_sync_at', '', 'integrations'),
  ('exchange_rate_usd_sar', '3.75', 'financial');

INSERT OR IGNORE INTO exchange_rates (id, currency_pair, rate, source) VALUES
  ('seed-usd-sar', 'USD/SAR', 3.75, 'manual');
