import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import InfoIcon from '@/components/shared/InfoIcon'

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface VaultFile {
  name: string
  path: string
  size: string
  modified: string
  content: string
}

interface VaultFolder {
  name: string
  path: string
  children: (VaultFolder | VaultFile)[]
}

function isFile(node: VaultFolder | VaultFile): node is VaultFile {
  return 'content' in node
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const FILE_TREE: VaultFolder = {
  name: 'ALMOVault',
  path: '/ALMOVault',
  children: [
    {
      name: 'agents', path: '/ALMOVault/agents',
      children: [
        { name: 'DCEO.md',  path: '/ALMOVault/agents/DCEO.md',  size: '2.4 KB', modified: 'Mar 26, 2026', content: '# DCEO — Deputy Chief Executive Officer\n\n## Role\nStrategic governance and cross-Chief coordination for ALMO operations.\n\n## Current Tasks\n- Mission Control V2 build oversight\n- Weekly council coordination\n- B2B pipeline review\n\n## Personality\nSystems thinker. Direct. Evidence-driven. Synthesizes information rapidly.\n\n## Capabilities\n- Council meeting facilitation\n- Cross-agent task delegation\n- Risk identification and escalation\n- Strategic document drafting' },
        { name: 'CTO.md',   path: '/ALMOVault/agents/CTO.md',   size: '3.1 KB', modified: 'Mar 26, 2026', content: '# CTO — Chief Technology Officer\n\n## Role\nSoftware architecture, build pipeline management, and technical execution for ALMO OS.\n\n## Current Sprint\nMission Control V2 — Phase 2 (21 pages)\n\n## Tech Stack\nReact 19 + TypeScript + Vite + Tailwind CSS v3 + Recharts + Motion\n\n## Personality\nPrecise. Build-first. Zero tolerance for technical debt. Favors simplicity over complexity.\n\n## Active Files\n- /projects/almo-os-v2/mission-control/' },
        { name: 'Scout.md', path: '/ALMOVault/agents/Scout.md', size: '1.8 KB', modified: 'Mar 25, 2026', content: '# Scout — Market Research Agent\n\n## Role\nProduct opportunity discovery, market validation, and competitor intelligence for ALMO.\n\n## Current Research\n- Keyboard Tray: Stage 5 — Supplier Identification\n- Weighted Blanket: Stage 3 — Demand Analysis\n\n## Data Sources\nTikTok trends, Noon.com pricing, Tamara checkout data, Chinese supplier databases\n\n## Personality\nCurious. Data-driven. Flags risks early. Never makes assumptions without data.' },
      ],
    },
    {
      name: 'sessions', path: '/ALMOVault/sessions',
      children: [
        { name: '2026-03-26-dceo-session.md', path: '/ALMOVault/sessions/2026-03-26-dceo-session.md', size: '4.2 KB', modified: 'Mar 26, 2026', content: '# DCEO Session — March 26, 2026\n\n## Summary\nDaily briefing. Reviewed 3 pending approvals. Coordinated with CTO on MC build Phase 2. Flagged Aramco deal for Moe review.\n\n## Actions Taken\n- Sent weekly summary to Moe inbox\n- Assigned Aramco RFQ review ticket to Moe\n- Confirmed CTO Phase 2 scope\n\n## Tokens Used\n2,847 input + 1,243 output = 4,090 total\n## Cost\n$0.031' },
        { name: '2026-03-25-cto-session.md',  path: '/ALMOVault/sessions/2026-03-25-cto-session.md',  size: '6.8 KB', modified: 'Mar 25, 2026', content: '# CTO Session — March 25, 2026\n\n## Summary\nPhase 1 complete: Dashboard, layout, design system tokens. Build passes. Committed to main.\n\n## Files Created\n- src/App.tsx (routing)\n- src/pages/Dashboard.tsx\n- src/components/Sidebar.tsx\n- tailwind.config.js (design tokens)\n\n## Build Status\n✅ Vite build: 0 errors, 0 warnings\n\n## Tokens Used\n18,421 total\n## Cost\n$0.142' },
      ],
    },
    {
      name: 'projects', path: '/ALMOVault/projects',
      children: [
        { name: 'mission-control-v2.md',     path: '/ALMOVault/projects/mission-control-v2.md',     size: '5.6 KB', modified: 'Mar 26, 2026', content: '# Mission Control V2\n\n## Status\nPhase 2 in progress\n\n## Tech Stack\nReact 19 + TypeScript + Vite + Tailwind CSS v3\nRecharts · Motion · React Router · TanStack Query v5\nHono backend (port 3080)\n\n## Pages\n21 total pages across 4 navigation groups.\n\n## Design System\nglass-card · #e6e6fa primary · #cacafe secondary · #ff9fe3 tertiary\nManrope font · bg-[#0e0e11] background · backdrop-blur-xl' },
        { name: 'keyboard-tray-research.md', path: '/ALMOVault/projects/keyboard-tray-research.md', size: '3.2 KB', modified: 'Mar 25, 2026', content: '# Keyboard Tray Product Research\n\n## Current Stage\nStage 5 — Supplier Identification\n\n## Market Signal\n847 TikTok videos with #ErgoDesk in KSA (30d)\nStrong demand signal, growing YoY\n\n## Price Opportunity\n149-199 SAR (vs competitors 89-340 SAR)\nPremium positioning viable\n\n## Margin Analysis\nProjected: 38% at 149 SAR\nLanded cost: $8.50 + $1.20 freight\n\n## Risk\nMedium — fragile item, shipping damage risk' },
      ],
    },
    {
      name: 'cache', path: '/ALMOVault/cache',
      children: [
        { name: 'airtable-financials.json', path: '/ALMOVault/cache/airtable-financials.json', size: '12.4 KB', modified: 'Mar 25, 2026', content: '{\n  "lastSync": "2026-03-25T06:00:00Z",\n  "status": "stale",\n  "mtdRevenue": 18400,\n  "monthlyTarget": 25000,\n  "expenses": 9800,\n  "cashPosition": 4783,\n  "orders": [\n    { "id": "4521", "product": "Cocoon Pro", "amount": 399, "status": "shipped" },\n    { "id": "4520", "product": "Cocoon Pro", "amount": 399, "status": "delivered" }\n  ]\n}' },
        { name: 'salla-orders.json',        path: '/ALMOVault/cache/salla-orders.json',        size: '8.1 KB',  modified: 'Mar 26, 2026', content: '{\n  "lastSync": "2026-03-26T07:15:00Z",\n  "status": "fresh",\n  "totalOrders": 47,\n  "recentOrders": [\n    { "id": "4521", "customer": "Mohammed Al-Omari", "product": "Cocoon Pro", "amount": 399, "status": "shipped" },\n    { "id": "4520", "customer": "Sara Al-Zahrani",   "product": "Cocoon Pro", "amount": 399, "status": "delivered" },\n    { "id": "4519", "customer": "Ahmad Al-Ghamdi",   "product": "Cocoon Pro", "amount": 399, "status": "processing" }\n  ]\n}' },
      ],
    },
    {
      name: 'media', path: '/ALMOVault/media',
      children: [
        { name: 'almo-logo.png', path: '/ALMOVault/media/almo-logo.png', size: '48.2 KB', modified: 'Mar 10, 2026', content: '[Binary file — PNG image]\nDimensions: 800 × 800 px\nFormat: PNG with transparency\nUsage: Brand identity, Mission Control UI, social media' },
      ],
    },
    { name: 'CLAUDE.md', path: '/ALMOVault/CLAUDE.md', size: '6.2 KB', modified: 'Mar 26, 2026', content: '# ALMO OS — CLAUDE.md\n\nThis is the master context file for all ALMO AI agents.\n\n## Business\nALMO is a Saudi premium Comfort Engineering Hardware brand.\nFounded by Moe (Mohannad) and Alaa.\nPrimary product: Cocoon Pro (ergonomic workspace solution).\nMarket: Saudi Arabia (KSA), shipping nationwide.\n\n## Agent Hierarchy\n- DCEO: Strategic governance\n- CTO: Technical build\n- CFO: Financial reporting\n- Scout: Market research\n- CRDO: R&D coordination\n\n## Current Priorities\n1. Mission Control V2 launch\n2. Keyboard Tray product launch\n3. B2B pipeline (Aramco, SABIC, NEOM)\n4. CMO deployment' },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flatFiles(node: VaultFolder | VaultFile, results: VaultFile[] = []): VaultFile[] {
  if (isFile(node)) {
    results.push(node)
  } else {
    node.children.forEach((c) => flatFiles(c, results))
  }
  return results
}

const ALL_FILES = flatFiles(FILE_TREE)

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()
  if (ext === 'md')   return <span className="material-symbols-outlined text-[14px] text-[#cacafe]">description</span>
  if (ext === 'json') return <span className="material-symbols-outlined text-[14px] text-yellow-400">data_object</span>
  if (ext === 'png' || ext === 'jpg') return <span className="material-symbols-outlined text-[14px] text-[#ff9fe3]">image</span>
  return <span className="material-symbols-outlined text-[14px] text-on-surface-variant">insert_drive_file</span>
}

function FolderTree({
  node,
  depth,
  expanded,
  onToggle,
  selectedPath,
  onSelect,
  searchQuery,
}: {
  node: VaultFolder | VaultFile
  depth: number
  expanded: Set<string>
  onToggle: (path: string) => void
  selectedPath: string | null
  onSelect: (file: VaultFile) => void
  searchQuery: string
}) {
  const indent = depth * 12

  if (isFile(node)) {
    return (
      <button
        onClick={() => onSelect(node)}
        style={{ paddingLeft: indent + 8 }}
        className={[
          'w-full flex items-center gap-2 py-1.5 pr-3 rounded-lg text-[12px] transition-all text-left',
          selectedPath === node.path
            ? 'bg-primary/10 text-primary'
            : 'text-on-surface-variant hover:text-primary hover:bg-primary/[0.04]',
        ].join(' ')}
      >
        <FileIcon name={node.name} />
        <span className="truncate">{node.name}</span>
      </button>
    )
  }

  const isOpen = expanded.has(node.path)
  return (
    <div>
      <button
        onClick={() => onToggle(node.path)}
        style={{ paddingLeft: indent + 8 }}
        className="w-full flex items-center gap-2 py-1.5 pr-3 rounded-lg text-[12px] text-on-surface-variant hover:text-primary hover:bg-primary/[0.04] transition-all text-left"
      >
        <span className="material-symbols-outlined text-[14px]">
          {isOpen ? 'folder_open' : 'folder'}
        </span>
        <span className="flex-1 truncate font-semibold">{node.name}</span>
        <span className="material-symbols-outlined text-[12px] opacity-50">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {isOpen && (
        <div>
          {node.children.map((child) => (
            <FolderTree
              key={isFile(child) ? child.path : child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              selectedPath={selectedPath}
              onSelect={onSelect}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Vault Page ───────────────────────────────────────────────────────────────

export default function Vault() {
  const [expanded, setExpanded]         = useState<Set<string>>(new Set(['/ALMOVault', '/ALMOVault/agents']))
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null)
  const [searchQuery, setSearchQuery]   = useState('')

  function toggleFolder(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return ALL_FILES.filter(
      (f) => f.name.toLowerCase().includes(q) || f.content.toLowerCase().includes(q)
    )
  }, [searchQuery])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-16"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
          File System
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-black text-primary">Vault</h1>
          <InfoIcon text="Browse ALMOVault files. All business data, research, and agent memory stored here." />
        </div>
        <p className="text-sm text-on-surface-variant mt-1">ALMOVault file browser and viewer</p>
      </motion.div>

      <motion.div variants={itemVariants} className="flex gap-5" style={{ minHeight: 540 }}>
        {/* Left — File tree */}
        <div className="w-64 shrink-0">
          <div className="glass-card p-3 h-full flex flex-col">
            {/* Search */}
            <div className="relative mb-3">
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant/60 absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full bg-surface-container-high/60 border border-primary/[0.08] rounded-xl pl-8 pr-3 py-2 text-[12px] text-primary placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/30"
              />
            </div>

            {/* Search results */}
            {searchQuery.trim() ? (
              <div className="flex-1 overflow-y-auto">
                <div className="text-[10px] text-on-surface-variant/60 mb-2 px-1">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </div>
                {searchResults.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={[
                      'w-full flex items-start gap-2 py-2 px-2 rounded-lg text-[11px] transition-all text-left mb-1',
                      selectedFile?.path === file.path
                        ? 'bg-primary/10 text-primary'
                        : 'text-on-surface-variant hover:text-primary hover:bg-primary/[0.04]',
                    ].join(' ')}
                  >
                    <FileIcon name={file.name} />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{file.name}</div>
                      <div className="text-[10px] opacity-50 truncate">{file.path}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <FolderTree
                  node={FILE_TREE}
                  depth={0}
                  expanded={expanded}
                  onToggle={toggleFolder}
                  selectedPath={selectedFile?.path ?? null}
                  onSelect={setSelectedFile}
                  searchQuery={searchQuery}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right — Viewer */}
        <div className="flex-1 min-w-0">
          <div className="glass-card p-6 h-full">
            {selectedFile ? (
              <>
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/60 mb-4 flex-wrap">
                  {selectedFile.path.split('/').filter(Boolean).map((part, i, arr) => (
                    <span key={i} className="flex items-center gap-1.5">
                      {i > 0 && <span className="material-symbols-outlined text-[10px] opacity-40">chevron_right</span>}
                      <span className={i === arr.length - 1 ? 'text-primary font-semibold' : ''}>{part}</span>
                    </span>
                  ))}
                </div>

                {/* File meta */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-primary/[0.08]">
                  <FileIcon name={selectedFile.name} />
                  <span className="text-sm font-semibold text-primary">{selectedFile.name}</span>
                  <span className="text-[11px] text-on-surface-variant/60 ml-auto">{selectedFile.size}</span>
                  <span className="text-[11px] text-on-surface-variant/60">Modified {selectedFile.modified}</span>
                </div>

                {/* Content */}
                <pre className="text-[12px] text-on-surface-variant font-mono leading-relaxed whitespace-pre-wrap break-words overflow-y-auto max-h-[400px]">
                  {selectedFile.content}
                </pre>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-[56px] text-on-surface-variant/20 mb-4">folder_open</span>
                <p className="text-sm text-on-surface-variant/60">Select a file to view its contents</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
