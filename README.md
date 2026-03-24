# ALMO Command Center

The CEO cockpit for flying the entire ALMO company. Not a dashboard — a command center.

## Quick Start

```bash
# Install all dependencies
cd client && npm install
cd ../server && npm install
cd ..

# Start both server and client
npm run dev
# Client: http://localhost:5174
# Server: http://localhost:3101
```

## Architecture

```
client/   React 18 + TypeScript + Vite + Tailwind + Recharts
server/   Express.js proxy to Paperclip API
tests/    Playwright E2E (31 tests)
```

## Views

| Tab | Path | Description |
|-----|------|-------------|
| Business | `/` | Salla store health, products, customer pulse, financials, blockers |
| OS | `/os` | Agent performance matrix, pipeline kanban, task velocity |
| Intelligence | `/intelligence` | Anomaly detection, risk radar, competitive pulse |
| Strategy | `/strategy` | OKR tracking, product roadmap, North Star tracker |
| Cockpit | `/cockpit` | Approval queue, direct command, agent conversations |
| Council | `/council` | Chiefs meeting room, MoM generation |
| Founder | `/founder` | Alaa's strategic view |

## Testing

```bash
# E2E tests (requires dev server running)
npm run test:e2e

# UI mode
npm run test:e2e:ui
```

### Deterministic Playwright auth

The navigation E2E tests do not rely on whatever local browser state happened to exist before the run.

- Each test clears cookies plus local/session storage via a Playwright init script.
- The test then seeds `localStorage.almo_cc_auth = "true"` before the app loads.
- This makes auth bypass deterministic for automated runs while keeping the real login flow intact for manual usage.

## Environment

```env
PAPERCLIP_API_URL=http://127.0.0.1:3100
PAPERCLIP_API_KEY=<your-key>
PAPERCLIP_COMPANY_ID=979e46be-09ac-4f35-b575-1cb2074e4d57
```

## Phase Status

- [x] Phase 1: Core layout + Business Layer + OS Layer
- [ ] Phase 2: Intelligence (full) + Strategic Planning + Decision Cockpit (full)
- [ ] Phase 3: Council Meeting (live) + Founder Portal (full) + Moe's Personal Layer
