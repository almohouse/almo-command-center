# CTO Build Instructions — Mission Control Rebuild

**MANDATORY READING BEFORE ANY CODE CHANGE:**
1. `DESIGN-DNA.md` — visual rules, component patterns, anti-patterns
2. `~/ALMOVault/projects/almo-os-v2/mission-control-page-specs.md` — functional spec for every page

---

## Rules

1. **DESIGN-DNA.md is LAW.** Every component must use the exact patterns defined there. No design decisions — only feature implementation.
2. **One page at a time.** Build → verify build passes → commit → move to next.
3. **No dead buttons.** Every interactive element either does something real or shows a setup prompt / "coming soon" with context.
4. **Every KPI gets an InfoIcon.** No exceptions. Tooltip text explains what the metric is AND why it matters.
5. **Use the page template** from DESIGN-DNA.md Section 12 as skeleton for every new page.
6. **Import order matters.** Follow Section 10 of DESIGN-DNA.md exactly.
7. **Never use `framer-motion`.** Always `motion/react`.
8. **Never use relative imports.** Always `@/...`.
9. **Store shared data in store.tsx.** Page-specific data stays local.
10. **Glass-card everything.** No plain divs for data containers.
11. **Test the build after every page:** `cd ~/ALMOVault/projects/almo-os-v2/mission-control && npm run build`

## Current Sidebar Groups (from Sidebar.tsx)

```
Business:    Dashboard, Goals, Business Intel, Discovery, CRDO, B2B Pipeline, Inbox
Operations:  Task Board, Projects, Approvals, Software Factory, Content Engine, Social Hub
Agents & OS: Org Chart, Agent Chat, Council Room, Agent Costs, Calendar
Intelligence: Vault, Memory, System Logs, Settings
```

## Changes Needed

### Add "Financials" nav group (between Business and Operations):
```
Financials:  Sales, Expenses, P&L, Cash Flow, Unit Economics, Budget vs Actual, Inventory Valuation
```

Icons: `point_of_sale` (Sales), `receipt_long` (Expenses), `balance` (P&L), `water_drop` (Cash Flow), `calculate` (Unit Economics), `monitoring` (Budget vs Actual), `inventory` (Inventory Valuation)

### New routes in App.tsx:
```
/sales → Sales
/expenses → Expenses
/pnl → PnL
/cashflow → CashFlow
/unit-economics → UnitEconomics
/budget → BudgetVsActual
/inventory-valuation → InventoryValuation
```

### Stub pages to delete (remove from App.tsx routes too):
- Finance.tsx (replaced by Financials group)
- Revenue.tsx (replaced by Sales)
- Analytics.tsx (covered by BI)
- Inventory.tsx (replaced by Inventory Valuation)
- Insights.tsx (covered by BI)
- Agents.tsx (covered by Org Chart)

### Stub pages to keep but NOT in nav yet:
- Products.tsx, Customers.tsx, Logistics.tsx, Suppliers.tsx, Support.tsx, Reports.tsx, ActivityLog.tsx, Forecasting.tsx, Orders.tsx
