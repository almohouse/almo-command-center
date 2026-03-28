import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useToast } from '@/data/toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'business' | 'agents' | 'integrations' | 'goals' | 'system'

interface AgentRow {
  id: string
  name: string
  model: string
  status: string
  heartbeat: number
  personality: string
}

interface Integration {
  id: string
  name: string
  icon: string
  value: string
  testResult?: 'connected' | 'failed' | null
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MODELS = ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5', 'qwen2.5:7b']

const INITIAL_AGENTS: AgentRow[] = [
  { id: 'dceo', name: 'DCEO', model: 'claude-opus-4-6', status: 'Running', heartbeat: 30, personality: 'You are DCEO, orchestrating all chief agents at ALMO with authority and strategic clarity.' },
  { id: 'cto', name: 'CTO', model: 'claude-opus-4-6', status: 'Running', heartbeat: 30, personality: 'You are CTO, leading all technical builds and architecture decisions at ALMO.' },
  { id: 'scout', name: 'Scout', model: 'claude-sonnet-4-6', status: 'Idle', heartbeat: 60, personality: 'You are Scout, monitoring TikTok trends and market signals for ALMO.' },
  { id: 'cfo', name: 'CFO', model: 'claude-sonnet-4-6', status: 'Not Deployed', heartbeat: 60, personality: 'You are CFO, managing financial modeling and cash flow analysis at ALMO.' },
  { id: 'cmo', name: 'CMO', model: 'claude-sonnet-4-6', status: 'Not Deployed', heartbeat: 60, personality: 'You are CMO, leading TikTok marketing strategy and influencer management.' },
  { id: 'crdo', name: 'CRDO', model: 'claude-sonnet-4-6', status: 'Idle', heartbeat: 120, personality: 'You are CRDO, driving product research and sourcing pipeline validation.' },
]

const INITIAL_INTEGRATIONS: Integration[] = [
  { id: 'salla', name: 'Salla API', icon: 'storefront', value: '••••••••••••••••', testResult: null },
  { id: 'airtable', name: 'Airtable PAT', icon: 'table_chart', value: '••••••••••••••••', testResult: null },
  { id: 'elevenlabs', name: 'ElevenLabs', icon: 'record_voice_over', value: '••••••••••••••••', testResult: null },
  { id: 'github', name: 'GitHub Token', icon: 'code', value: '••••••••••••••••', testResult: null },
]

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
}

const tabContentVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-2">
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-surface-container-high border border-primary/[0.08] rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/30"
    />
  )
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-surface-container-high border border-primary/[0.08] rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/30"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function SaveButton({ onClick, label = 'Save Changes' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-all font-semibold text-sm"
    >
      <span className="material-symbols-outlined text-[16px]">save</span>
      {label}
    </button>
  )
}

// ─── Business Tab ─────────────────────────────────────────────────────────────

function BusinessTab({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    businessName: 'ALMO',
    businessType: 'premium-hardware',
    primaryMarket: 'Saudi Arabia',
    description:
      'ALMO is a Saudi premium Comfort Engineering Hardware brand. We design and source ergonomic desk accessories for the discerning professional market.',
  })

  async function handleSave() {
    try {
      await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } catch {
      // dev: no backend yet
    }
    onSave()
  }

  return (
    <motion.div variants={tabContentVariants} initial="hidden" animate="show" exit="exit" className="space-y-5">
      <div className="glass-card p-6 space-y-5">
        <div>
          <FieldLabel>Business Name</FieldLabel>
          <TextInput value={form.businessName} onChange={(v) => setForm({ ...form, businessName: v })} />
        </div>
        <div>
          <FieldLabel>Business Type</FieldLabel>
          <SelectInput
            value={form.businessType}
            onChange={(v) => setForm({ ...form, businessType: v })}
            options={[
              { value: 'premium-hardware', label: 'Premium Hardware Brand' },
              { value: 'ecommerce', label: 'E-Commerce Brand' },
              { value: 'saas', label: 'SaaS Business' },
              { value: 'retail', label: 'Retail Business' },
              { value: 'services', label: 'Services Business' },
            ]}
          />
        </div>
        <div>
          <FieldLabel>Primary Market</FieldLabel>
          <TextInput value={form.primaryMarket} onChange={(v) => setForm({ ...form, primaryMarket: v })} />
        </div>
        <div>
          <FieldLabel>Description</FieldLabel>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full bg-surface-container-high border border-primary/[0.08] rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/30 resize-none"
          />
        </div>
      </div>
      <SaveButton onClick={handleSave} />
    </motion.div>
  )
}

// ─── Agents Tab ───────────────────────────────────────────────────────────────

function AgentsTab() {
  const [agents, setAgents] = useState<AgentRow[]>(INITIAL_AGENTS)
  const [editingId, setEditingId] = useState<string | null>(null)

  function updateAgent(id: string, patch: Partial<AgentRow>) {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  return (
    <motion.div variants={tabContentVariants} initial="hidden" animate="show" exit="exit" className="space-y-4">
      {/* Warning */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/[0.05]">
        <span className="material-symbols-outlined text-[16px] text-yellow-400">warning</span>
        <span className="text-sm text-yellow-400/90">Changes take effect on next agent run</span>
      </div>

      <div className="glass-card divide-y divide-primary/[0.06]">
        {agents.map((agent) => (
          <div key={agent.id}>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-24 shrink-0">
                <div className="text-sm font-bold text-primary">{agent.name}</div>
                <div
                  className={`text-[10px] font-bold mt-0.5 ${
                    agent.status === 'Running'
                      ? 'text-secondary'
                      : agent.status === 'Idle'
                      ? 'text-on-surface-variant'
                      : 'text-on-surface-variant/50'
                  }`}
                >
                  {agent.status}
                </div>
              </div>
              <div className="flex-1">
                <select
                  value={agent.model}
                  onChange={(e) => updateAgent(agent.id, { model: e.target.value })}
                  className="w-full bg-surface-container-high border border-primary/[0.08] rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/30"
                >
                  {MODELS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="w-28 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={agent.heartbeat}
                    onChange={(e) => updateAgent(agent.id, { heartbeat: Number(e.target.value) })}
                    className="w-16 bg-surface-container-high border border-primary/[0.08] rounded-lg px-2 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/30 text-center"
                  />
                  <span className="text-[10px] text-on-surface-variant">sec</span>
                </div>
              </div>
              <button
                onClick={() => setEditingId(editingId === agent.id ? null : agent.id)}
                className="text-on-surface-variant hover:text-primary transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {editingId === agent.id ? 'expand_less' : 'edit'}
                </span>
              </button>
            </div>

            {/* Inline personality editor */}
            {editingId === agent.id && (
              <div className="px-5 pb-4 bg-primary/[0.02]">
                <FieldLabel>Personality</FieldLabel>
                <textarea
                  value={agent.personality}
                  onChange={(e) => updateAgent(agent.id, { personality: e.target.value })}
                  rows={3}
                  className="w-full bg-surface-container-high border border-primary/[0.08] rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/30 resize-none"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Integrations Tab ─────────────────────────────────────────────────────────

function IntegrationsTab() {
  const globalToast = useToast()
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  function startEdit(integration: Integration) {
    setEditingId(integration.id)
    setEditValue('')
  }

  function saveEdit(id: string) {
    if (editValue.trim()) {
      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, value: '••••••••••••••••' } : i))
      )
    }
    setEditingId(null)
    setEditValue('')
  }

  async function handleTest(id: string) {
    const integration = integrations.find(i => i.id === id)
    const name = integration?.name ?? id
    try {
      await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, testResult: 'connected' } : i))
      )
      globalToast.show(`${name}: Connection successful`, 'success')
    } catch {
      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, testResult: 'failed' } : i))
      )
      globalToast.show(`${name}: Connection failed — check API key`, 'error')
    }
    // Reset after 4s
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, testResult: null } : i))
      )
    }, 4000)
  }

  return (
    <motion.div variants={tabContentVariants} initial="hidden" animate="show" exit="exit" className="space-y-3">
      <div className="glass-card divide-y divide-primary/[0.06]">
        {integrations.map((integration) => (
          <div key={integration.id} className="px-5 py-4">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant/60 shrink-0">
                {integration.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-primary">{integration.name}</div>
                {editingId === integration.id ? (
                  <input
                    autoFocus
                    type="password"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(integration.id)}
                    placeholder="Paste new key..."
                    className="mt-1 w-full bg-surface-container-high border border-primary/20 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary/40"
                  />
                ) : (
                  <div className="text-xs text-on-surface-variant font-mono mt-0.5">{integration.value}</div>
                )}
              </div>

              {/* Test result */}
              {integration.testResult && (
                <span
                  className={`text-xs font-semibold shrink-0 ${
                    integration.testResult === 'connected' ? 'text-secondary' : 'text-error'
                  }`}
                >
                  {integration.testResult === 'connected' ? '✅ Connected' : '❌ Failed'}
                </span>
              )}

              {/* Buttons */}
              <div className="flex gap-2 shrink-0">
                {editingId === integration.id ? (
                  <button
                    onClick={() => saveEdit(integration.id)}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary/20 transition-all"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => startEdit(integration)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-high border border-primary/[0.08] text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all text-xs font-semibold"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleTest(integration.id)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-high border border-primary/[0.08] text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all text-xs font-semibold"
                >
                  Test
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Goals Tab ────────────────────────────────────────────────────────────────

function GoalsTab({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    monthlyRevenue: '25000',
    annualGrowth: '120',
    fiscalYearStart: 'january',
    priority1: 'Achieve 25K SAR/month recurring revenue',
    priority2: 'Launch 3 new SKUs in Q2',
    priority3: 'Deploy full agent roster by April',
  })

  async function handleSave() {
    try {
      await fetch('/api/config/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } catch {
      // dev: no backend yet
    }
    onSave()
  }

  return (
    <motion.div variants={tabContentVariants} initial="hidden" animate="show" exit="exit" className="space-y-5">
      <div className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <FieldLabel>Monthly Revenue Target (SAR)</FieldLabel>
            <TextInput
              type="number"
              value={form.monthlyRevenue}
              onChange={(v) => setForm({ ...form, monthlyRevenue: v })}
              placeholder="25000"
            />
          </div>
          <div>
            <FieldLabel>Annual Growth Target (%)</FieldLabel>
            <TextInput
              type="number"
              value={form.annualGrowth}
              onChange={(v) => setForm({ ...form, annualGrowth: v })}
              placeholder="120"
            />
          </div>
        </div>
        <div>
          <FieldLabel>Fiscal Year Start</FieldLabel>
          <SelectInput
            value={form.fiscalYearStart}
            onChange={(v) => setForm({ ...form, fiscalYearStart: v })}
            options={[
              { value: 'january', label: 'January' },
              { value: 'april', label: 'April' },
              { value: 'july', label: 'July' },
              { value: 'october', label: 'October' },
            ]}
          />
        </div>
        <div>
          <FieldLabel>Top Priorities</FieldLabel>
          <div className="space-y-3">
            {(['priority1', 'priority2', 'priority3'] as const).map((key, i) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm font-black text-primary shrink-0 w-5 text-center">{i + 1}</span>
                <input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="flex-1 bg-surface-container-high border border-primary/[0.08] rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/30"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <SaveButton onClick={handleSave} label="Save Goals" />
    </motion.div>
  )
}

// ─── System Tab ───────────────────────────────────────────────────────────────

function SystemTab() {
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)

  function handleReset() {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }
    navigate('/setup')
  }

  const systemCards = [
    {
      icon: 'lan',
      label: 'OpenClaw',
      value: '● Connected',
      sub: 'ws://127.0.0.1:18789',
      valueClass: 'text-secondary',
    },
    {
      icon: 'computer',
      label: 'Mac Mini',
      value: 'macOS 15.3.1',
      sub: 'Node v22 · ARM64',
      valueClass: 'text-on-surface',
    },
    {
      icon: 'folder',
      label: 'ALMOVault',
      value: '/Users/mohannad/ALMOVault',
      sub: '1,247 files · 2.4 GB',
      valueClass: 'font-mono text-xs text-on-surface',
    },
    {
      icon: 'database',
      label: 'SQLite',
      value: 'mission-control.db',
      sub: '3.2 MB',
      valueClass: 'font-mono text-xs text-on-surface',
    },
  ]

  return (
    <motion.div variants={tabContentVariants} initial="hidden" animate="show" exit="exit" className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {systemCards.map((card) => (
          <div key={card.label} className="glass-card p-5">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant/60 mt-0.5">
                {card.icon}
              </span>
              <div>
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
                  {card.label}
                </div>
                <div className={`text-sm font-semibold ${card.valueClass}`}>{card.value}</div>
                <div className="text-xs text-on-surface-variant mt-0.5">{card.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 border border-error/[0.12]">
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">
          Danger Zone
        </div>
        {showConfirm ? (
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant">
              This will reset all configuration and navigate to the setup wizard. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-all font-semibold text-sm"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Yes, Reset Everything
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2.5 rounded-xl bg-surface-container-high border border-primary/[0.08] text-on-surface-variant hover:text-primary transition-all font-semibold text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-all font-semibold text-sm"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            Reset Wizard
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('business')
  const [toast, setToast] = useState<string | null>(null)

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'business', label: 'Business', icon: 'storefront' },
    { id: 'agents', label: 'Agents', icon: 'smart_toy' },
    { id: 'integrations', label: 'Integrations', icon: 'cable' },
    { id: 'goals', label: 'Goals', icon: 'flag' },
    { id: 'system', label: 'System', icon: 'settings' },
  ]

  function showToast(msg = 'Saved ✓') {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-16 max-w-3xl"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary mb-1">Settings</div>
        <div className="text-sm text-on-surface-variant">Configure ALMO OS and its agents</div>
      </motion.div>

      {/* Tab Bar */}
      <motion.div variants={itemVariants} className="glass-card p-1.5">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold tracking-[0.08em] uppercase transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'business' && (
          <BusinessTab key="business" onSave={() => showToast('Saved ✓')} />
        )}
        {activeTab === 'agents' && <AgentsTab key="agents" />}
        {activeTab === 'integrations' && <IntegrationsTab key="integrations" />}
        {activeTab === 'goals' && (
          <GoalsTab key="goals" onSave={() => showToast('Goals saved ✓')} />
        )}
        {activeTab === 'system' && <SystemTab key="system" />}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8 px-5 py-3 glass-card border border-secondary/20 text-sm font-semibold text-secondary z-50"
        >
          {toast}
        </motion.div>
      )}
    </motion.div>
  )
}
