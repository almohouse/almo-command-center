import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import sseRoutes from './sse.js';
import salesRoutes from './routes/sales.js';
import expensesRoutes from './routes/expenses.js';
import productsRoutes from './routes/products.js';
import customersRoutes from './routes/customers.js';
import tasksRoutes from './routes/tasks.js';
import projectsRoutes from './routes/projects.js';
import goalsRoutes from './routes/goals.js';
import agentsRoutes from './routes/agents.js';
import approvalsRoutes from './routes/approvals.js';
import budgetsRoutes from './routes/budgets.js';
import configRoutes from './routes/config.js';
import pnlRoutes from './routes/pnl.js';
import cashflowRoutes from './routes/cashflow.js';
import inventoryRoutes from './routes/inventory.js';
import audioRoutes from './routes/audio.js';
import dashboardRoutes from './routes/dashboard.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3080'],
  credentials: true,
}));

// Global error handler
app.onError((err, c) => {
  console.error('[ERROR]', err.message, err.stack);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Mount routes
app.route('/', sseRoutes);
app.route('/', salesRoutes);
app.route('/', expensesRoutes);
app.route('/', productsRoutes);
app.route('/', customersRoutes);
app.route('/', tasksRoutes);
app.route('/', projectsRoutes);
app.route('/', goalsRoutes);
app.route('/', agentsRoutes);
app.route('/', approvalsRoutes);
app.route('/', budgetsRoutes);
app.route('/', configRoutes);
app.route('/', pnlRoutes);
app.route('/', cashflowRoutes);
app.route('/', inventoryRoutes);
app.route('/', audioRoutes);
app.route('/', dashboardRoutes);

export default app;
