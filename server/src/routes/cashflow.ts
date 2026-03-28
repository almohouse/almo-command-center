import { Hono } from 'hono';
import db from '../db.js';

const app = new Hono();

// GET /api/cashflow — current position + recent events
app.get('/api/cashflow', (c) => {
  const from = c.req.query('from');
  const to = c.req.query('to');

  // Opening balance
  const openingRow = db.prepare("SELECT value FROM config WHERE key = 'cash_opening_balance'").get() as { value: string } | undefined;
  const openingBalance = parseFloat(openingRow?.value || '0');

  // Net cash flow
  const netFlow = db.prepare(`
    SELECT COALESCE(SUM(CASE WHEN direction = 'in' THEN amount_sar ELSE -amount_sar END), 0) as net
    FROM cash_flow_events
  `).get() as { net: number };

  const currentPosition = openingBalance + netFlow.net;

  // Period breakdown
  let eventsQuery = 'SELECT * FROM cash_flow_events WHERE 1=1';
  const params: unknown[] = [];
  if (from) { eventsQuery += ' AND occurred_at >= ?'; params.push(from); }
  if (to) { eventsQuery += ' AND occurred_at <= ?'; params.push(to); }
  eventsQuery += ' ORDER BY occurred_at DESC LIMIT 100';

  const events = db.prepare(eventsQuery).all(...params);

  // Summary by activity type
  const summary = db.prepare(`
    SELECT activity_type,
      COALESCE(SUM(CASE WHEN direction = 'in' THEN amount_sar ELSE 0 END), 0) as cash_in,
      COALESCE(SUM(CASE WHEN direction = 'out' THEN amount_sar ELSE 0 END), 0) as cash_out
    FROM cash_flow_events
    ${from ? "WHERE occurred_at >= '" + from + "'" : ''}
    GROUP BY activity_type
  `).all() as { activity_type: string; cash_in: number; cash_out: number }[];

  return c.json({
    opening_balance: openingBalance,
    current_position: currentPosition,
    net_flow: netFlow.net,
    summary,
    events,
  });
});

// GET /api/cashflow/forecast — 30/60/90 day projection
app.get('/api/cashflow/forecast', (c) => {
  const openingRow = db.prepare("SELECT value FROM config WHERE key = 'cash_opening_balance'").get() as { value: string } | undefined;
  const openingBalance = parseFloat(openingRow?.value || '0');

  const netFlow = db.prepare(`
    SELECT COALESCE(SUM(CASE WHEN direction = 'in' THEN amount_sar ELSE -amount_sar END), 0) as net
    FROM cash_flow_events
  `).get() as { net: number };

  const currentPosition = openingBalance + netFlow.net;

  // Average daily in/out over last 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
  const dailyAvg = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN direction = 'in' THEN amount_sar ELSE 0 END), 0) / 90.0 as avg_daily_in,
      COALESCE(SUM(CASE WHEN direction = 'out' THEN amount_sar ELSE 0 END), 0) / 90.0 as avg_daily_out
    FROM cash_flow_events WHERE occurred_at >= ?
  `).get(ninetyDaysAgo) as { avg_daily_in: number; avg_daily_out: number };

  // Scheduled payments
  const scheduled = db.prepare(`
    SELECT * FROM scheduled_payments WHERE status = 'pending' ORDER BY expected_date ASC
  `).all() as { expected_date: string; amount_sar: number; direction: string }[];

  // Active subscriptions monthly burn
  const subs = db.prepare(`
    SELECT COALESCE(SUM(cost_sar), 0) as monthly_burn FROM subscriptions WHERE status = 'active'
  `).get() as { monthly_burn: number };

  // Project 90 days
  const forecast: { date: string; projected_position: number }[] = [];
  let position = currentPosition;
  const today = new Date();

  for (let i = 1; i <= 90; i++) {
    const date = new Date(today.getTime() + i * 86400000);
    const dateStr = date.toISOString().slice(0, 10);

    let dayIn = dailyAvg.avg_daily_in;
    let dayOut = dailyAvg.avg_daily_out;

    // Add scheduled payments for this date
    for (const sp of scheduled) {
      if (sp.expected_date.slice(0, 10) === dateStr) {
        if (sp.direction === 'in') dayIn += sp.amount_sar;
        else dayOut += sp.amount_sar;
      }
    }

    // Add subscription costs (spread daily)
    dayOut += subs.monthly_burn / 30;

    position += dayIn - dayOut;
    if (i % 7 === 0 || i === 30 || i === 60 || i === 90) {
      forecast.push({ date: dateStr, projected_position: Math.round(position) });
    }
  }

  // Threshold check
  const threshRow = db.prepare("SELECT value FROM config WHERE key = 'cash_minimum_threshold'").get() as { value: string } | undefined;
  const threshold = parseFloat(threshRow?.value || '2000');
  const breachDate = forecast.find(f => f.projected_position < threshold);

  return c.json({
    current_position: currentPosition,
    avg_daily_in: Math.round(dailyAvg.avg_daily_in),
    avg_daily_out: Math.round(dailyAvg.avg_daily_out),
    monthly_subscription_burn: subs.monthly_burn,
    threshold,
    breach_warning: breachDate ? { date: breachDate.date, projected: breachDate.projected_position } : null,
    forecast,
  });
});

export default app;
