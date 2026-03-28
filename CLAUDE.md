# ALMO Mission Control — Project Context

## What This Is
Business command center for ALMO, a Saudi premium Comfort Engineering Hardware brand. Two users: Moe and Alaa (both Co-Founders). Business metrics first, AI agent activity second.

## Tech Stack
- React 19 + TypeScript + Vite
- Tailwind CSS v3 (NOT v4) with custom design tokens in tailwind.config.js
- shadcn/ui for interactive components
- Motion (framer-motion) for animations
- Recharts for data visualization
- TanStack Query v5 for server state
- React Router for navigation
- Hono backend (separate server, port 3080)

## Design Philosophy
ALMO Mission Control is a luxury dark-glass command center. Think spacecraft cockpit made of obsidian. The aesthetic is:
- Deep space black (#0e0e11) with luminous lavender (#e6e6fa) accents
- Real glassmorphism with backdrop-blur-xl depth
- Manrope font-black (900 weight) headlines create visual gravity
- Pink pulse dots (#ff9fe3) signal living system indicators
- Business-first data density with generous section spacing

## Design Anti-Patterns (NEVER do these)
- Never use Inter, Roboto, Arial, or system fonts
- Never use solid-color card backgrounds — always glass
- Never use generic Tailwind grays (gray-800, gray-900)
- Never skip glass borders (border-primary/[0.08])
- Never use blur(12px) — always blur-xl (24px+)
- Never create dead buttons — every button triggers a real action or shows a setup prompt

## Key Design Tokens
- Background: bg-background (#0e0e11)
- Surface cards: glass-card class (bg-surface-container-high/60 + backdrop-blur-xl)
- Primary accent: text-primary (#e6e6fa) — used for headlines, active states, links
- Secondary: text-secondary (#cacafe) — chart strokes, badges, agent status
- Tertiary pink: text-tertiary (#ff9fe3) — pulse dots, urgent indicators
- Muted text: text-on-surface-variant (#acaaae)
- Error: text-error (#ff6e84)
- Section headers: text-lg font-bold uppercase tracking-[0.2em] text-primary
- KPI numbers: text-3xl font-black text-primary
- Labels: text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase

## Component Patterns
- Use shadcn/ui as the base for all interactive components (buttons, inputs, dialogs, tabs)
- Style shadcn components with ALMO design tokens
- Use Motion for page transitions and staggered reveals
- Use Recharts for all charts (area, bar, donut) with secondary (#cacafe) as the primary chart color
- Use Material Symbols Outlined for icons

## Layout Rules
- Sidebar: 256px fixed left, use `style={{ marginLeft: 256 }}` for content offset (NOT Tailwind arbitrary values)
- TopBar: h-16, use `style={{ left: 256 }}` for left offset
- Audio player: bottom bar, use `style={{ left: 256 }}` for left offset

## Backend API
Base URL: http://localhost:3080/api
Auth: JWT in httpOnly cookie (but login is Mac-style user picker, no passwords)
SSE: /api/events for real-time updates (agent.status, task.updated, approval.created, notification.new)

## Navigation (21 pages)
Sidebar 256px fixed, grouped: Business (6) → Operations (6) → Agents & OS (5) → Intelligence (4)

### Business Group
1. Dashboard (overview/home)
2. Revenue
3. Orders
4. Products
5. Customers
6. Finance

### Operations Group
7. Inventory
8. Suppliers
9. Logistics
10. Support
11. Tasks
12. Calendar

### Agents & OS Group
13. Agents (agent roster)
14. Chat (AI assistant)
15. Approvals
16. Activity Log
17. Settings

### Intelligence Group
18. Analytics
19. Reports
20. Forecasting
21. Insights

## Core Rules
1. Every button triggers a real API call or shows a setup wizard prompt
2. Every data component has an empty state with a CTA to populate data
3. Moe and Alaa have separate chat histories, notifications, and approval records
4. Business metrics are ALWAYS above agent activity in visual hierarchy
5. Use mock data for initial implementation, structured to match the SQLite schema
