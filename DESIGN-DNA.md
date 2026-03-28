# ALMO Mission Control — Design DNA

> This document is the authoritative reference for AI agents building pages in this project.
> Every rule here was enforced across all existing pages. Deviate from nothing.
> Your output must be visually indistinguishable from the existing pages.

---

## 1. Design Philosophy

ALMO Mission Control is a **luxury dark-glass command center**. Think spacecraft cockpit made of obsidian. The aesthetic is:

- Deep space black (`#0e0e11`) with luminous lavender (`#e6e6fa`) accents
- Real glassmorphism with `backdrop-blur-xl` (24px minimum) depth
- Manrope font-black (900 weight) headlines create visual gravity
- Pink pulse dots (`#ff9fe3`) signal living system indicators
- Business-first data density with generous section spacing
- Letter-spacing is the primary typographic differentiator — it makes the UI feel engineered, not designed

---

## 2. Color System

### Primary Palette (from `tailwind.config.js`)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-background` | `#0e0e11` | Page background, never anything else |
| `bg-surface-container-low` | `#131316` | Sidebar, topbar backgrounds |
| `bg-surface-container` | `#19191d` | Input backgrounds |
| `bg-surface-container-high` | `#1f1f23` | Card interiors (with `/60` opacity) |
| `bg-surface-container-highest` | `#2a2a2d` | Progress bar tracks |
| `text-primary` | `#e6e6fa` | Headlines, active nav, KPI numbers, links |
| `text-secondary` | `#cacafe` | Chart strokes, badges, agent status labels |
| `text-tertiary` | `#ff9fe3` | Pulse dots, urgent indicators, pink accents |
| `text-on-surface` | `#fcf8fc` | Default body text |
| `text-on-surface-variant` | `#acaaae` | Labels, captions, muted text |
| `text-error` | `#ff6e84` | Blocked status, critical alerts |

### Color Psychology — When to Use What

| Color | Signal | Examples |
|-------|--------|----------|
| **Lavender** (`text-primary`) | Authority, active, important | Page titles, KPI numbers, active nav items, clickable text |
| **Periwinkle** (`text-secondary`) | Supportive, data, neutral-positive | Chart lines, agent status badges, "Save" buttons |
| **Pink** (`text-tertiary`) | Alive, urgent, attention-needed | Pulse dots, notification badges, progress bars below threshold |
| **Muted** (`text-on-surface-variant`) | Background, secondary info | Labels, timestamps, metadata, inactive nav items |
| **Error Red** (`text-error`) | Blocked, critical, danger | Blocked status, critical severity, cash runway alerts |
| **Amber** (`text-amber-400`) | Warning, at-risk, needs attention | At-risk KPIs, backlog status, warning alerts |
| **Green** (`text-green-400`) | Healthy, complete, on-track | Done status, on-track KPIs, OK indicators |
| **Purple** (`text-purple-400`) | Review, in-between, pending decision | Review status column |

### Opacity Layering Rules

Opacity is how we create depth. Never use solid colors for interactive surfaces.

| Opacity | Purpose | Example |
|---------|---------|---------|
| `/[0.02]` | Barely-there hover (table rows) | `hover:bg-primary/[0.02]` |
| `/[0.03]` | Ambient background blobs | `opacity-[0.03]` on blob divs |
| `/[0.05]` | Subtle hover state | `hover:bg-primary/[0.05]` |
| `/[0.06]` | Faintest border | `border-primary/[0.06]` — sidebar dividers |
| `/[0.08]` | Standard border | `border-primary/[0.08]` — glass-card default |
| `/10` | Active/selected background | `bg-primary/10` — active nav, selected tab |
| `/[0.12]` | Emphasized border | `border-primary/[0.12]` — dropdown borders |
| `/15` | Badge background | `bg-error/15` — priority pill fill |
| `/20` | Strong border / hover border | `border-primary/20` — card hover, button borders |
| `/30` | Prominent border | `border-secondary/30` — playing audio button |
| `/40` | Muted text overlay | `text-on-surface-variant/40` — info icon default |
| `/50` | Half-visible | Badge border suffix `+ '50'` |
| `/60` | Glass card fill | `bg-surface-container-high/60` |

---

## 3. Typography Scale

All text uses **Manrope** (`font-sans`). Monospace data uses **JetBrains Mono** (`font-mono`).

| Level | Classes | When to Use |
|-------|---------|-------------|
| **Page Title** | `text-4xl font-black text-primary text-glow` | One per page, at the very top |
| **Section Header** | `text-lg font-bold uppercase tracking-[0.2em] text-primary` | Before each major section. Use the `SectionHeader` component |
| **Card Title** | `text-2xl font-black text-primary leading-tight` | Modal headers, detail panel titles |
| **Card Subtitle** | `text-base font-bold text-primary` | OKR objectives, sub-section titles |
| **KPI Number** | `text-3xl font-black text-primary` | Large metric values |
| **KPI Number (small)** | `text-xl font-black text-primary` | Secondary metric values |
| **Body Text** | `text-sm text-on-surface` | Descriptions, paragraphs, comment text |
| **Body Text (muted)** | `text-sm text-on-surface-variant` | Supporting context, summaries |
| **Label** | `text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase` | Field labels above inputs, section sub-labels |
| **Small Label** | `text-[10px] text-on-surface-variant` | Metadata, timestamps, "auto-calculated" |
| **Tiny Label** | `text-[9px] font-bold tracking-[0.08em] uppercase` | Badge text, tag text, sub-labels |
| **Caption** | `text-[11px] text-on-surface-variant` | Form hints, chart annotations |
| **Mono Data** | `font-mono text-[10px] text-on-surface-variant` | Task IDs (`ALMO-089`), model names, dates |
| **Mono Data (large)** | `font-mono text-[11px] text-on-surface-variant tracking-[0.05em]` | Project IDs in headers |
| **Breadcrumb** | `text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2` | "OPERATIONS", "BUSINESS" above page title |

### Letter Spacing Reference

| Value | Where |
|-------|-------|
| `tracking-[0.25em]` | Sidebar group labels only |
| `tracking-[0.2em]` | Section headers, field labels, most uppercase text |
| `tracking-[0.15em]` | Logo text, sub-headers, AI analysis labels |
| `tracking-[0.1em]` | Column headers, compact labels |
| `tracking-[0.08em]` | Badge text, pill text |
| `tracking-[0.05em]` | Project chip text, button text |
| `tracking-wide` | TopBar page title only |

---

## 4. Component Patterns

### 4.1 Glass Card

The foundational container. Every data group lives in one.

```jsx
<div className="glass-card p-6">
  {/* content */}
</div>
```

The `glass-card` class resolves to:
```css
bg-surface-container-high/60 backdrop-blur-xl border border-primary/[0.08] rounded-2xl
```

**Padding conventions:**
- `p-8` — hero cards (greeting, vision/mission)
- `p-6` — standard cards (metrics, tables, forms)
- `p-5` — compact cards (agent cards, list items)
- `p-4` — tight cards (kanban task cards, inline forms)

**Hover state** (when clickable):
```jsx
className="glass-card p-6 cursor-pointer hover:border-primary/20 transition-all"
```

### 4.2 Metric Card (KPI)

```jsx
<div className="glass-card p-6">
  <div className="flex items-center gap-2">
    <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
      Monthly Token Spend
    </div>
    <InfoIcon text="Explanation of this metric..." />
  </div>
  <div className="text-3xl font-black text-primary mt-3">$1.24</div>
  <div className="text-[11px] text-on-surface-variant mt-1">March 2026</div>
</div>
```

### 4.3 Section Header

Always use the component, never inline:

```jsx
function SectionHeader({ children, info }: { children: React.ReactNode; info?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary">{children}</div>
      {info && <InfoIcon text={info} />}
    </div>
  )
}
```

The InfoIcon always goes **right after the title text**, inside the same flex row.

### 4.4 Button Variants

**Primary Action:**
```jsx
<button className="px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold hover:bg-primary/20 transition-all">
  Create Task
</button>
```

**Secondary Action (lavender-blue):**
```jsx
<button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary font-semibold hover:bg-secondary/20 transition-all">
  <span className="material-symbols-outlined text-[16px]">add</span>
  New Project
</button>
```

**Ghost/Subtle:**
```jsx
<button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all">
  Audio Summary
</button>
```

**Icon Button (square):**
```jsx
<button className="w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/[0.05] hover:text-primary transition-all">
  <span className="material-symbols-outlined text-[20px]">notifications</span>
</button>
```

**Icon Button (small, for edit pencils):**
```jsx
<button className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all">
  <span className="material-symbols-outlined text-[16px]">edit</span>
</button>
```

**Filter Chip (toggle):**
```jsx
<button className={[
  'px-3 py-1 rounded-lg text-[10px] font-bold tracking-[0.08em] uppercase border transition-all',
  isActive ? 'bg-primary/10 text-primary border-primary/20' : 'text-on-surface-variant border-primary/[0.06] hover:text-primary',
].join(' ')}>
  Revenue
</button>
```

### 4.5 Status Badge

```jsx
<span className={`text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border ${badgeClasses}`}>
  {label}
</span>
```

Standard badge class maps:
```typescript
// Project status
active:    'bg-secondary/10 text-secondary border-secondary/20'
planned:   'bg-amber-500/10 text-amber-400 border-amber-500/20'
completed: 'bg-green-500/10 text-green-400 border-green-500/20'
paused:    'bg-orange-500/10 text-orange-400 border-orange-500/20'
cancelled: 'bg-red-500/10 text-red-400 border-red-500/20'

// KPI status
'on-track': 'bg-green-500/10 text-green-400 border-green-500/20'
'at-risk':  'bg-amber-500/10 text-amber-400 border-amber-500/20'
'behind':   'bg-red-500/10 text-red-400 border-red-500/20'
```

### 4.6 Status Dot

```jsx
// Running agent
<span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />

// Error/blocked
<span className="w-2 h-2 rounded-full bg-error animate-pulse" />

// Idle
<span className="w-2 h-2 rounded-full bg-on-surface-variant/30" />

// Live indicator (topbar/sidebar)
<span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse-glow" />
```

### 4.7 Progress Bar

```jsx
<div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
  <div
    className="h-full rounded-full transition-all"
    style={{
      width: `${percentage}%`,
      background: percentage >= 80 ? '#cacafe' : '#ff9fe3',
      boxShadow: `0 0 8px ${percentage >= 80 ? '#cacafe50' : '#ff9fe350'}`,
    }}
  />
</div>
```

Heights: `h-1` (thin, inside cards), `h-1.5` (standard), `h-2` (prominent, financial targets).

### 4.8 Form Input

```jsx
<div>
  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">
    Field Label
  </div>
  <input
    type="text"
    placeholder="Placeholder..."
    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all"
  />
</div>
```

**Compact variant** (inside inline forms):
```jsx
className="w-full px-3 py-2 rounded-lg bg-surface-container border border-primary/[0.06] text-xs text-on-surface focus:border-primary/30 focus:outline-none transition-all"
```

### 4.9 Table

```jsx
<div className="glass-card overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="border-b border-primary/[0.06]">
        <th className="text-left text-[11px] font-bold tracking-[0.15em] text-on-surface-variant uppercase px-5 py-3">
          Column
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-primary/[0.04] hover:bg-primary/[0.02] transition-all">
        <td className="px-5 py-3.5 text-sm text-on-surface">Value</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 4.10 Modal

```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
  onClick={onClose}
>
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 20 }}
    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    onClick={e => e.stopPropagation()}
    className="w-[640px] max-h-[90vh] overflow-y-auto rounded-2xl"
    style={{
      background: 'rgba(18, 18, 22, 0.97)',
      backdropFilter: 'blur(32px)',
      border: '1px solid rgba(230, 230, 250, 0.08)',
    }}
  >
    <div className="p-8 space-y-6">
      {/* content */}
    </div>
  </motion.div>
</div>
```

Modal widths: `w-[480px]` (side panel), `w-[640px]` (standard), `w-[720px]` (project detail).

### 4.11 Empty State

```jsx
<div className="glass-card p-12 flex flex-col items-center justify-center gap-4 text-center">
  <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">icon_name</span>
  <div>
    <div className="text-sm font-semibold text-primary/60">Section Title</div>
    <div className="text-xs text-on-surface-variant mt-1">This page is ready for implementation</div>
  </div>
</div>
```

### 4.12 Chart Container

```jsx
<div className="glass-card p-6">
  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
    Chart Title
  </div>
  <div className="text-3xl font-black text-primary mb-6">$1.24 MTD</div>
  <div className="h-40">
    <ResponsiveContainer width="100%" height="100%">
      {/* chart */}
    </ResponsiveContainer>
  </div>
</div>
```

Recharts tooltip styling:
```jsx
<RechartsTooltip
  contentStyle={{
    background: 'rgba(31,31,35,0.92)',
    border: '1px solid rgba(230,230,250,0.08)',
    borderRadius: 8,
    fontSize: 11,
    color: '#e6e6fa',
    padding: '6px 10px',
  }}
  labelStyle={{ color: '#acaaae', marginBottom: 2 }}
  cursor={{ stroke: 'rgba(230,230,250,0.1)', strokeWidth: 1 }}
/>
```

Chart gradient pattern:
```jsx
<defs>
  <linearGradient id="uniqueId" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#cacafe" stopOpacity={0.3} />
    <stop offset="95%" stopColor="#cacafe" stopOpacity={0} />
  </linearGradient>
</defs>
```

---

## 5. Animation Conventions

### Page Entry (EVERY page uses this)

```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  },
}
```

Root element: `<motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-16">`

Each section: `<motion.div variants={itemVariants}>`

### Modal Enter/Exit

```typescript
initial={{ opacity: 0, scale: 0.95, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95, y: 20 }}
transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
```

### Slide Panel (from right)

```typescript
initial={{ x: '100%' }}
animate={{ x: 0 }}
exit={{ x: '100%' }}
transition={{ type: 'spring', damping: 25, stiffness: 200 }}
```

### Audio Player (slide up)

```typescript
initial={{ y: 80, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
exit={{ y: 80, opacity: 0 }}
transition={{ type: 'spring', damping: 25, stiffness: 200 }}
```

### Toast Notifications

```typescript
initial={{ opacity: 0, y: 16, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 8, scale: 0.95 }}
transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
```

### Collapsible Sections

```typescript
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: 'auto' }}
exit={{ opacity: 0, height: 0 }}
```

### When NOT to Animate

- Table row hover states (CSS `transition-all` only)
- Progress bar fill changes (CSS `transition-all`)
- Button hover/focus states (CSS transitions)
- Tooltip show/hide (uses AnimatePresence but very fast: 0.15s)

### Tailwind Keyframe Animations

```javascript
// Pink pulse (status indicators, notification dots)
'pulse-glow': {
  '0%, 100%': { opacity: '1', boxShadow: '0 0 8px #ff9fe3' },
  '50%': { opacity: '0.5', boxShadow: '0 0 4px #ff9fe3' },
}

// Page entrance (rarely used directly — motion handles this)
'fade-in-up': {
  '0%': { opacity: '0', transform: 'translateY(20px)' },
  '100%': { opacity: '1', transform: 'translateY(0)' },
}
```

---

## 6. Layout Patterns

### Page Structure (every page follows this)

```
<motion.div className="space-y-8 pb-16">     ← root container, 32px section gaps, 64px bottom pad
  <motion.div>                                ← header: breadcrumb + title + subtitle + buttons
  <motion.div>                                ← section 1
  <motion.div>                                ← section 2
  ...
</motion.div>
```

### Grid Conventions

| Columns | Gap | Use Case |
|---------|-----|----------|
| `grid-cols-2 gap-8` | Major 2-panel split (vision/mission, monthly/annual) |
| `grid-cols-2 gap-6` | Strategic objective cards |
| `grid-cols-3 gap-6` | OKR cards, business trend charts |
| `grid-cols-3 gap-4` | Form fields, table-like layouts |
| `grid-cols-4 gap-4` | KPI metric cards, metadata grids |
| `grid-cols-4 gap-6` | Auto-calculated financial fields |
| `grid-cols-5 gap-4` | Kanban board columns |
| `grid-cols-6 gap-3` | Compact inline form (new task) |

### Sidebar-Aware Layout

All fixed elements (topbar, audio player, toasts) use **inline `style` with the sidebar width variable** — never Tailwind arbitrary values:

```jsx
style={{ left: sidebarWidth }}              // TopBar, AudioPlayer
style={{ marginLeft: sidebarWidth }}         // Main content
```

Sidebar widths: `256` (expanded), `64` (collapsed). The transition is `duration-300 ease-in-out`.

### Z-Index Stack

```
99999  — InfoIcon tooltip (portal to document.body)
9998   — ToastContainer
60     — TaskDetailModal overlay + content
50     — AudioPlayer, MentionTextarea dropdown
40     — Sidebar
30     — TopBar
10     — Main content
0      — Ambient background blobs
```

---

## 7. State Management

### Global State (`src/data/store.tsx`)

React Context with `useState` inside a `StoreProvider`. Wraps the entire app in `main.tsx`.

**What lives in global state:**
- `tasks: Task[]` — all tasks (shared between Tasks page and Projects page)
- `projects: Project[]` — all projects (shared between Projects page and Goals page)
- Mutation functions: `addTask`, `updateTask`, `changeTaskStatus`, `addTaskComment`, `addProject`, `updateProject`, `addProjectComment`
- Computed: `getProjectTasks(projectId)`, `nextTaskId()`

**What lives in local state (per page):**
- UI toggles: `showAddForm`, `editingMode`, `selectedId`, `filterProject`
- Form drafts: `newTask`, `newProject`, `comment`
- Temporary UI: `audioGenerating`, `analysisReady`
- Editable content: `vision`, `mission`, `objectives` (Goals page)

### Audio Player (`src/data/audio-player.tsx`)

Separate context. State: `track`, `playing`, `show`. Methods: `play(track)`, `pause()`, `resume()`, `close()`.

### Toast (`src/data/toast.tsx`)

Separate context. State: `toasts[]`. Methods: `show(message, type?)`, `dismiss(id)`.

### Provider Nesting Order (in `main.tsx`)

```
QueryClientProvider
  StoreProvider
    AudioPlayerProvider
      ToastProvider
        App
```

---

## 8. InfoIcon & Tooltip Rules

### Implementation

InfoIcon uses `createPortal` to render into `document.body`. This guarantees the tooltip is **always the top layer** regardless of parent `overflow: hidden`, `z-index` stacking, or glass-card containers.

```jsx
import InfoIcon from '@/components/shared/InfoIcon'

<InfoIcon text="Explanation of what this card shows and why it matters." />
```

### Placement Rules

1. **Always inside the card**, in the header row
2. **Always right after the title text**, in the same `flex items-center gap-2` row
3. **Never floating outside a card** — if a section has a `SectionHeader`, the info icon goes inside it via the `info` prop:

```jsx
<SectionHeader info="Explanation text">Section Title</SectionHeader>
```

4. For cards with an edit button, the order is: **title + info icon ... (flex spacer) ... edit button**

### Content Guidelines for Tooltip Text

- One to two sentences max
- Start with what the metric/section IS
- End with WHY it matters or WHAT to do with it
- Use concrete language, not abstract ("Track this to catch runaway agents" not "Important for monitoring")
- Never use marketing speak

---

## 9. Audio Player Integration

### Triggering

Any page can trigger the global audio player:

```typescript
const audioPlayer = useAudioPlayer()
const [audioGenerating, setAudioGenerating] = useState(false)

async function handleAudioSummary() {
  setAudioGenerating(true)
  try {
    await fetch('/api/audio/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 'page-name' }),
    })
  } catch { /* dev: no backend */ }
  setAudioGenerating(false)
  audioPlayer.play({
    title: 'Page Name Summary',
    subtitle: 'Context · AI Generated',
    duration: '2:30',
  })
}
```

### Button Pattern

Always use the ghost button style:

```jsx
<button onClick={handleAudioSummary} disabled={audioGenerating}
  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all disabled:opacity-50"
>
  <span className="material-symbols-outlined text-[16px]">
    {audioGenerating ? 'hourglass_empty' : 'play_arrow'}
  </span>
  {audioGenerating ? 'Generating...' : 'Audio Summary'}
</button>
```

### Player Persistence

The player lives in `AppShell` and persists across page navigation. It adapts to sidebar width. It does NOT belong in any individual page component.

---

## 10. Import Conventions

### Standard Import Order

```typescript
// 1. React
import { useState, useEffect, useCallback } from 'react'

// 2. React Router
import { useNavigate, useLocation } from 'react-router-dom'

// 3. Motion (always from 'motion/react', NEVER 'framer-motion')
import { motion, AnimatePresence } from 'motion/react'

// 4. Third-party libraries
import { AreaChart, Area, ResponsiveContainer, ... } from 'recharts'
import { DndContext, ... } from '@dnd-kit/core'

// 5. Global contexts (from @/data/)
import { useAudioPlayer } from '@/data/audio-player'
import { useToast } from '@/data/toast'
import { useStore, type Task, TASK_COLUMNS, ... } from '@/data/store'
import { MENTIONABLES } from '@/data/agents'

// 6. Shared components (from @/components/shared/)
import InfoIcon from '@/components/shared/InfoIcon'
import MentionTextarea from '@/components/shared/MentionTextarea'
import TaskDetailModal from '@/components/shared/TaskDetailModal'
```

### Path Aliases

Always use `@/` prefix. Never relative paths (`../`).

```typescript
'@/*' → './src/*'
```

### Library Usage

| Need | Library | Import From |
|------|---------|-------------|
| Animations | Motion | `'motion/react'` (NOT `'framer-motion'`) |
| Charts | Recharts | `'recharts'` |
| Drag-and-drop | dnd-kit | `'@dnd-kit/core'`, `'@dnd-kit/sortable'`, `'@dnd-kit/utilities'` |
| Icons | Material Symbols | CDN font in `index.html`, use `<span className="material-symbols-outlined">` |
| UI components | shadcn/ui | `'@/components/ui/button'` (sparingly — most UI is custom) |
| Server state | TanStack Query | `'@tanstack/react-query'` (configured, not heavily used yet) |
| Routing | React Router | `'react-router-dom'` |

---

## 11. Anti-Patterns — Things to NEVER Do

### Visual

- **Never use Inter, Roboto, Arial, or system fonts** — only Manrope + JetBrains Mono
- **Never use solid-color card backgrounds** — always `glass-card` (bg with `/60` + `backdrop-blur-xl`)
- **Never use generic Tailwind grays** (`gray-800`, `gray-900`, `slate-700`) — use the surface tokens
- **Never skip glass borders** — every card needs `border-primary/[0.08]`
- **Never use `blur(12px)`** — minimum is `backdrop-blur-xl` (24px)
- **Never use `rounded-md` or `rounded-sm`** — use `rounded-xl` (buttons), `rounded-2xl` (cards), `rounded-full` (dots/avatars), or `rounded-lg` (compact items)
- **Never construct Tailwind classes dynamically** with template literals — Tailwind purges them. Always use static lookup objects
- **Never use Tailwind arbitrary width/margin for sidebar offsets** — use inline `style={{ marginLeft: 256 }}`

### Structural

- **Never create dead buttons** — every button must trigger a real action or show a setup prompt
- **Never skip the loading/empty state** — every data component needs both
- **Never put mock data in the global store if it's page-specific** — only shared data (tasks, projects) goes in the store
- **Never use `framer-motion`** — the package is called `motion` and imports from `'motion/react'`
- **Never use relative imports** (`'../../components/...'`) — always `'@/components/...'`
- **Never nest providers inside page components** — all providers go in `main.tsx`
- **Never create inline toast/notification components** — use the global `useToast()` system
- **Never position tooltips/popovers with CSS z-index alone** — use `createPortal` to `document.body`

### Data

- **Never hardcode user identity** — always use `getCurrentUser()` from the store (reads `localStorage`)
- **Never duplicate the agent list** — always import `MENTIONABLES` from `'@/data/agents'`
- **Never put project IDs that don't match the store** — project IDs must exactly match `Project.id` values

---

## 12. Page Template

When building a new page, start with this skeleton:

```tsx
import { useState } from 'react'
import { motion } from 'motion/react'
import { useAudioPlayer } from '@/data/audio-player'
import InfoIcon from '@/components/shared/InfoIcon'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

function SectionHeader({ children, info }: { children: React.ReactNode; info?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary">{children}</div>
      {info && <InfoIcon text={info} />}
    </div>
  )
}

export default function PageName() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-16">

      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
          Nav Group Name
        </div>
        <h1 className="text-4xl font-black text-primary text-glow">Page Title</h1>
        <p className="text-sm text-on-surface-variant mt-2">Subtitle or context</p>
      </motion.div>

      {/* Section */}
      <motion.div variants={itemVariants}>
        <SectionHeader info="What this section shows">Section Title</SectionHeader>
        <div className="glass-card p-6">
          {/* content */}
        </div>
      </motion.div>

    </motion.div>
  )
}
```

---

## 13. File Organization

```
src/
  components/
    layout/          ← AppShell, Sidebar, TopBar, AudioPlayer, ToastContainer
    shared/          ← InfoIcon, MentionTextarea, TaskDetailModal
    ui/              ← shadcn components (button.tsx, etc.)
  data/
    agents.ts        ← Agent hierarchy, MENTIONABLES list
    store.tsx         ← Global state (tasks, projects, types, constants, helpers)
    audio-player.tsx  ← Audio player context
    toast.tsx         ← Toast notification context
  pages/
    Dashboard.tsx     ← Each page is self-contained with its own mock data
    Goals.tsx
    Tasks.tsx
    Projects.tsx
    Costs.tsx
    ...
  lib/
    utils.ts          ← shadcn utility (cn function)
```

---

*This document was generated from the actual codebase state as of March 28, 2026. When in doubt, read the source files — they are the ultimate truth.*
