import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PUBLISHED_ITEMS = [
  {
    id: '1',
    title: 'ALMO Cocoon Pro Launch Post',
    platform: 'Instagram',
    publishedAt: 'Mar 20, 2026',
    stat: '1,240 likes',
    statIcon: 'favorite',
  },
  {
    id: '2',
    title: 'Ergonomic Work Setup Guide',
    platform: 'LinkedIn',
    publishedAt: 'Mar 15, 2026',
    stat: '847 views',
    statIcon: 'visibility',
  },
]

const PLATFORM_ICON: Record<string, string> = {
  Instagram: 'photo_camera',
  LinkedIn:  'business',
  Twitter:   'tag',
}

// ─── Content Page ─────────────────────────────────────────────────────────────

export default function Content() {
  const navigate  = useNavigate()
  const [activeTab, setActiveTab] = useState<'pipeline' | 'drafts' | 'published'>('pipeline')

  const tabs = [
    { key: 'pipeline',  label: 'Content Pipeline' },
    { key: 'drafts',    label: 'Drafts' },
    { key: 'published', label: 'Published' },
  ] as const

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
          Content Engine
        </div>
        <h1 className="text-4xl font-black text-primary">Content</h1>
        <p className="text-sm text-on-surface-variant mt-1">Marketing content creation and publishing</p>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Content Pieces',  value: '2', sub: 'published' },
            { label: 'Engagement',      value: '2,087', sub: 'total interactions' },
            { label: 'CMO Status',      value: '⚠ Not Deployed', sub: 'deploy to unlock', warn: true },
          ].map((card) => (
            <motion.div key={card.label} variants={itemVariants} className="glass-card p-6">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
                {card.label}
              </div>
              <div className={`text-3xl font-black mt-3 ${card.warn ? 'text-yellow-400 text-xl' : 'text-primary'}`}>
                {card.value}
              </div>
              <div className="text-[11px] text-on-surface-variant mt-1">{card.sub}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-1 bg-surface-container-high/60 backdrop-blur-xl border border-primary/[0.08] rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={[
                'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                activeTab === t.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:text-primary',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Pipeline tab */}
      {activeTab === 'pipeline' && (
        <motion.div variants={itemVariants} className="space-y-6">
          {/* CMO not deployed state */}
          <div className="glass-card p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-[32px] text-yellow-400">movie</span>
            </div>
            <h2 className="text-2xl font-black text-primary mb-2">CMO Not Deployed</h2>
            <p className="text-sm text-on-surface-variant max-w-md leading-relaxed mb-6">
              The Content Engine requires the CMO agent to be active. Deploy CMO to unlock content creation,
              scheduling, and publishing workflows.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/org?deploy=cmo')}
                className="px-6 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/15 transition-all"
              >
                Deploy CMO
              </button>
              <button className="px-6 py-2.5 rounded-xl bg-surface-container-high/60 border border-primary/[0.08] text-on-surface-variant text-sm font-semibold hover:text-primary transition-all">
                Learn More
              </button>
            </div>
          </div>

          {/* Locked preview */}
          <div className="glass-card p-6 relative overflow-hidden opacity-50 pointer-events-none select-none">
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-4">
              Content Calendar Preview
            </div>
            {/* Mock calendar grid */}
            <div className="grid grid-cols-7 gap-1.5 mb-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="text-[10px] text-on-surface-variant/50 text-center font-semibold">{d}</div>
              ))}
              {Array.from({ length: 21 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-10 rounded-lg border border-primary/[0.06] ${
                    [2, 5, 9, 13, 16].includes(i) ? 'bg-secondary/10 border-secondary/20' : 'bg-surface-container-high/30'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-on-surface-variant">5 content pieces in pipeline</div>

            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto opacity-100">
              <button
                onClick={() => navigate('/org?deploy=cmo')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/15 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">lock_open</span>
                Unlock with CMO deployment
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Drafts tab */}
      {activeTab === 'drafts' && (
        <motion.div variants={itemVariants} className="glass-card p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-primary/[0.08] flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[28px] text-on-surface-variant/50">edit_note</span>
          </div>
          <h3 className="text-xl font-bold text-primary mb-2">No drafts yet</h3>
          <p className="text-sm text-on-surface-variant">CMO deployment required to create content drafts.</p>
          <button
            onClick={() => navigate('/org?deploy=cmo')}
            className="mt-5 px-5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/15 transition-all"
          >
            Deploy CMO
          </button>
        </motion.div>
      )}

      {/* Published tab */}
      {activeTab === 'published' && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
            Manually Created Content
          </div>
          {PUBLISHED_ITEMS.map((item) => (
            <div key={item.id} className="glass-card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  {PLATFORM_ICON[item.platform] ?? 'article'}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-primary">{item.title}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-on-surface-variant">{item.platform}</span>
                  <span className="text-on-surface-variant/30">·</span>
                  <span className="text-[11px] text-on-surface-variant">{item.publishedAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-[14px]">{item.statIcon}</span>
                <span className="text-sm font-semibold">{item.stat}</span>
              </div>
              <span className="text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border bg-secondary/10 text-secondary border-secondary/20">
                Published
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
