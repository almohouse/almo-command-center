import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'

const STEPS = [
  { id: 'business', label: 'Business Info', icon: 'store' },
  { id: 'team', label: 'Team', icon: 'group' },
  { id: 'goals', label: 'Goals', icon: 'flag' },
  { id: 'integrations', label: 'Integrations', icon: 'cable' },
  { id: 'review', label: 'Review', icon: 'check_circle' },
]

const BUSINESS_TYPES = [
  'Premium Hardware Brand',
  'E-commerce Retailer',
  'B2B Distributor',
  'Manufacturer',
  'Service Provider',
]

const PRIORITIES = [
  'Increase Revenue',
  'Reduce Costs',
  'Launch New Products',
  'Expand B2B',
  'Improve Customer Experience',
  'Build Systems & Automation',
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

export default function Setup() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState({
    businessName: 'ALMO',
    businessType: 'Premium Hardware Brand',
    market: 'Saudi Arabia',
    description: 'Saudi premium Comfort Engineering Hardware brand.',
    teamSize: '2',
    founderNames: 'Moe, Alaa',
    monthlyTarget: '25000',
    annualGrowth: '40',
    priorities: ['Increase Revenue', 'Launch New Products'] as string[],
    fiscalYearStart: 'January',
    sallaKey: '',
    airtableKey: '',
    elevenLabsKey: '',
    githubToken: '',
  })
  const [launching, setLaunching] = useState(false)

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function togglePriority(p: string) {
    setForm((f) => ({
      ...f,
      priorities: f.priorities.includes(p)
        ? f.priorities.filter((x) => x !== p)
        : f.priorities.length < 3
          ? [...f.priorities, p]
          : f.priorities,
    }))
  }

  async function handleLaunch() {
    setLaunching(true)
    try {
      await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } catch {
      // dev: no backend
    }
    localStorage.setItem('almo_setup_complete', 'true')
    setTimeout(() => navigate('/dashboard'), 800)
  }

  const LabelField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">{label}</div>
      {children}
    </div>
  )

  const inputClass =
    'w-full bg-surface-container-high border border-primary/[0.08] rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/20 transition-all'

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute rounded-full opacity-[0.04] blur-3xl" style={{ width: 600, height: 600, top: -200, left: 100, background: '#e6e6fa' }} />
        <div className="absolute rounded-full opacity-[0.03] blur-3xl" style={{ width: 400, height: 400, bottom: 100, right: 200, background: '#ff9fe3' }} />
      </div>

      {/* Sidebar Stepper */}
      <div className="relative z-10 w-72 border-r border-primary/[0.06] bg-surface-container-low flex flex-col shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-primary/[0.06]">
          <img src="/almo-logo.png" alt="ALMO" className="h-7 object-contain" style={{ filter: 'invert(1)' }} />
          <div>
            <div className="text-sm font-black tracking-[0.15em] text-primary uppercase">ALMO</div>
            <div className="text-[10px] font-bold tracking-[0.15em] text-on-surface-variant/50 uppercase">Setup Wizard</div>
          </div>
        </div>

        {/* Steps */}
        <nav className="flex-1 px-4 py-8 space-y-1">
          {STEPS.map((step, i) => {
            const isDone = i < currentStep
            const isActive = i === currentStep
            return (
              <button
                key={step.id}
                onClick={() => i <= currentStep && setCurrentStep(i)}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : isDone
                      ? 'text-secondary cursor-pointer hover:bg-primary/5'
                      : 'text-on-surface-variant/40 cursor-not-allowed',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : isDone
                        ? 'bg-secondary/20 text-secondary'
                        : 'bg-surface-container-high text-on-surface-variant/30',
                  ].join(' ')}
                >
                  {isDone ? (
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  ) : (
                    i + 1
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold tracking-[0.05em]">{step.label}</div>
                </div>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse shrink-0" />
                )}
              </button>
            )
          })}
        </nav>

        <div className="px-6 pb-6">
          <div className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/30 uppercase">
            Step {currentStep + 1} of {STEPS.length}
          </div>
          <div className="mt-2 h-1 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%`, boxShadow: '0 0 8px #cacafe' }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-xl"
          >
            {/* Step 0: Business Info */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <motion.div variants={itemVariants}>
                  <div className="text-3xl font-black text-primary text-glow">Business Info</div>
                  <div className="text-sm text-on-surface-variant mt-1">Tell us about ALMO</div>
                </motion.div>
                <motion.div variants={itemVariants} className="glass-card p-6 space-y-5">
                  <LabelField label="Business Name">
                    <input className={inputClass} value={form.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder="ALMO" />
                  </LabelField>
                  <LabelField label="Business Type">
                    <select className={inputClass} value={form.businessType} onChange={(e) => update('businessType', e.target.value)}>
                      {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </LabelField>
                  <LabelField label="Primary Market">
                    <input className={inputClass} value={form.market} onChange={(e) => update('market', e.target.value)} placeholder="Saudi Arabia" />
                  </LabelField>
                  <LabelField label="Description">
                    <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Brief description of your business" />
                  </LabelField>
                </motion.div>
              </div>
            )}

            {/* Step 1: Team */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <motion.div variants={itemVariants}>
                  <div className="text-3xl font-black text-primary text-glow">Your Team</div>
                  <div className="text-sm text-on-surface-variant mt-1">Founders and team size</div>
                </motion.div>
                <motion.div variants={itemVariants} className="glass-card p-6 space-y-5">
                  <LabelField label="Founder Names">
                    <input className={inputClass} value={form.founderNames} onChange={(e) => update('founderNames', e.target.value)} placeholder="Moe, Alaa" />
                  </LabelField>
                  <LabelField label="Team Size">
                    <select className={inputClass} value={form.teamSize} onChange={(e) => update('teamSize', e.target.value)}>
                      {['1', '2', '3-5', '6-10', '11-20', '20+'].map((s) => <option key={s} value={s}>{s} people</option>)}
                    </select>
                  </LabelField>
                </motion.div>
                <motion.div variants={itemVariants} className="glass-card p-6">
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">AI Agent Team</div>
                  <div className="space-y-2">
                    {['DCEO', 'CTO', 'CFO', 'CMO', 'CRDO', 'Scout'].map((agent) => (
                      <div key={agent} className="flex items-center gap-3 py-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shrink-0" />
                        <span className="text-sm font-semibold text-primary">{agent}</span>
                        <span className="text-[10px] text-on-surface-variant/50 ml-auto">Auto-configured</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {/* Step 2: Goals */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <motion.div variants={itemVariants}>
                  <div className="text-3xl font-black text-primary text-glow">Business Goals</div>
                  <div className="text-sm text-on-surface-variant mt-1">Define targets and priorities</div>
                </motion.div>
                <motion.div variants={itemVariants} className="glass-card p-6 space-y-5">
                  <LabelField label="Monthly Revenue Target (SAR)">
                    <input className={inputClass} type="number" value={form.monthlyTarget} onChange={(e) => update('monthlyTarget', e.target.value)} placeholder="25000" />
                  </LabelField>
                  <LabelField label="Annual Growth Target (%)">
                    <input className={inputClass} type="number" value={form.annualGrowth} onChange={(e) => update('annualGrowth', e.target.value)} placeholder="40" />
                  </LabelField>
                  <LabelField label="Fiscal Year Start">
                    <select className={inputClass} value={form.fiscalYearStart} onChange={(e) => update('fiscalYearStart', e.target.value)}>
                      {['January', 'April', 'July', 'October'].map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </LabelField>
                </motion.div>
                <motion.div variants={itemVariants} className="glass-card p-6">
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">
                    Top Priorities (select up to 3)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PRIORITIES.map((p) => {
                      const selected = form.priorities.includes(p)
                      return (
                        <button
                          key={p}
                          onClick={() => togglePriority(p)}
                          className={[
                            'px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border',
                            selected
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : 'bg-surface-container-high text-on-surface-variant border-primary/[0.06] hover:border-primary/15',
                          ].join(' ')}
                        >
                          {selected && <span className="material-symbols-outlined text-[12px] mr-1">check</span>}
                          {p}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              </div>
            )}

            {/* Step 3: Integrations */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <motion.div variants={itemVariants}>
                  <div className="text-3xl font-black text-primary text-glow">Integrations</div>
                  <div className="text-sm text-on-surface-variant mt-1">Connect your tools (all optional — skip to configure later)</div>
                </motion.div>
                <motion.div variants={itemVariants} className="glass-card p-6 space-y-5">
                  {[
                    { key: 'sallaKey', label: 'Salla API Key', hint: 'For order + product data' },
                    { key: 'airtableKey', label: 'Airtable PAT', hint: 'For financial data + Memory Bank' },
                    { key: 'elevenLabsKey', label: 'ElevenLabs API Key', hint: 'For audio digest generation' },
                    { key: 'githubToken', label: 'GitHub Token', hint: 'For Software Factory + CTO agent' },
                  ].map(({ key, label, hint }) => (
                    <LabelField key={key} label={label}>
                      <input
                        className={inputClass}
                        type="password"
                        value={form[key as keyof typeof form] as string}
                        onChange={(e) => update(key, e.target.value)}
                        placeholder={`Enter ${label}…`}
                      />
                      <div className="text-[10px] text-on-surface-variant/50 mt-1">{hint}</div>
                    </LabelField>
                  ))}
                </motion.div>
                <motion.div variants={itemVariants}>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="text-xs text-secondary hover:text-primary transition-colors"
                  >
                    Skip for now — configure in Settings later →
                  </button>
                </motion.div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <motion.div variants={itemVariants}>
                  <div className="text-3xl font-black text-primary text-glow">Ready to Launch</div>
                  <div className="text-sm text-on-surface-variant mt-1">Review your configuration</div>
                </motion.div>
                <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
                  {[
                    { label: 'Business', value: `${form.businessName} · ${form.businessType}` },
                    { label: 'Market', value: form.market },
                    { label: 'Monthly Target', value: `${parseInt(form.monthlyTarget).toLocaleString()} SAR` },
                    { label: 'Annual Growth', value: `${form.annualGrowth}%` },
                    { label: 'Priorities', value: form.priorities.join(', ') || 'None selected' },
                    { label: 'Integrations', value: [form.sallaKey && 'Salla', form.airtableKey && 'Airtable', form.elevenLabsKey && 'ElevenLabs', form.githubToken && 'GitHub'].filter(Boolean).join(', ') || 'Configure later' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-4">
                      <span className="text-[11px] font-bold tracking-[0.1em] text-on-surface-variant uppercase shrink-0">{label}</span>
                      <span className="text-sm text-primary font-medium text-right">{value}</span>
                    </div>
                  ))}
                </motion.div>
                <motion.div variants={itemVariants}>
                  <button
                    onClick={handleLaunch}
                    disabled={launching}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary/15 border border-primary/20 text-primary font-black tracking-[0.1em] text-base hover:bg-primary/20 transition-all disabled:opacity-60"
                  >
                    {launching ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                        Launching…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                        Launch Mission Control
                      </>
                    )}
                  </button>
                </motion.div>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep < 4 && (
              <motion.div variants={itemVariants} className="flex gap-3 mt-6">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep((s) => s - 1)}
                    className="flex-1 py-3 rounded-xl border border-primary/[0.08] text-sm font-bold text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => setCurrentStep((s) => s + 1)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 border border-primary/20 text-sm font-bold text-primary hover:bg-primary/15 transition-all"
                >
                  Continue
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
