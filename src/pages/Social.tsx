import { useState } from 'react'
import { motion } from 'motion/react'
import { useToast } from '@/data/toast'

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

type Platform = 'Instagram' | 'LinkedIn' | 'Twitter/X' | 'TikTok'

const CHAR_LIMITS: Record<Platform, number> = {
  Instagram: 2200,
  LinkedIn:  3000,
  'Twitter/X': 280,
  TikTok:    2200,
}

const INSTAGRAM_DRAFT = `✨ Introducing the ALMO Cocoon Pro — Saudi Arabia's premium comfort engineering solution for the modern workspace.

Engineered for those who demand excellence.

🇸🇦 Crafted for the Saudi market
⚡ Premium materials, precision engineering
📦 Now shipping nationwide

#ALMO #CocoonPro #SaudiDesign #WorkspaceGoals #KSA`

const PAST_POSTS = [
  {
    platform: 'Instagram',
    caption: 'The workspace revolution starts here. ALMO Cocoon Pro — engineered for Saudi excellence. 🇸🇦',
    likes: 892, comments: 47, shares: 23, daysAgo: '3d ago',
  },
  {
    platform: 'LinkedIn',
    caption: 'We\'re redefining ergonomic comfort for the Saudi market. ALMO brings premium quality to the modern professional workspace.',
    likes: 421, comments: 38, shares: 67, daysAgo: '5d ago',
  },
  {
    platform: 'Instagram',
    caption: 'Behind the design: how we engineered the Cocoon Pro for Saudi workspaces. Swipe to see the story.',
    likes: 1247, comments: 89, shares: 112, daysAgo: '1w ago',
  },
]

const PLATFORM_COLOR: Record<Platform, string> = {
  Instagram:   'text-[#ff9fe3]',
  LinkedIn:    'text-[#cacafe]',
  'Twitter/X': 'text-secondary',
  TikTok:      'text-[#ff6e84]',
}

// ─── Social Page ──────────────────────────────────────────────────────────────

export default function Social() {
  const [platform, setPlatform]       = useState<Platform>('Instagram')
  const [draftText, setDraftText]     = useState(INSTAGRAM_DRAFT)
  const [showPreview, setShowPreview] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const globalToast = useToast()

  const charLimit = CHAR_LIMITS[platform]

  function showToast(msg: string) {
    globalToast.show(msg)
  }

  async function handlePublish() {
    try {
      await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, text: draftText }),
      })
    } catch { /* dev: no backend */ }
    showToast(`Post queued for ${platform}`)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-16 relative"
    >

      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
          Social Hub
        </div>
        <h1 className="text-4xl font-black text-primary">Social</h1>
        <p className="text-sm text-on-surface-variant mt-1">Draft, preview, and publish content across platforms</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
        {/* Left — Composer */}
        <div className="space-y-4">
          {/* Platform selector */}
          <div className="glass-card p-1 flex gap-1">
            {(['Instagram', 'LinkedIn', 'Twitter/X', 'TikTok'] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={[
                  'flex-1 py-2 rounded-xl text-[12px] font-bold tracking-[0.05em] transition-all',
                  platform === p
                    ? `bg-primary/10 ${PLATFORM_COLOR[p]}`
                    : 'text-on-surface-variant hover:text-primary',
                ].join(' ')}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div className="glass-card p-4">
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={12}
              placeholder="Write your post..."
              className="w-full bg-transparent text-sm text-primary placeholder-on-surface-variant/40 focus:outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between pt-3 border-t border-primary/[0.08] mt-1">
              <span className={`text-[11px] font-mono ${draftText.length > charLimit ? 'text-[#ff6e84]' : 'text-on-surface-variant/60'}`}>
                {draftText.length}/{charLimit}
              </span>
              {/* Attach image button (mock) */}
              <button
                onClick={() => showToast('Image upload coming soon')}
                className="flex items-center gap-1.5 text-[11px] text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                Add Image
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => showToast('CMO not deployed — AI generation unavailable')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff9fe3]/[0.06] border border-[#ff9fe3]/20 text-[#ff9fe3] text-sm font-semibold hover:bg-[#ff9fe3]/10 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">smart_toy</span>
              Generate with CMO
            </button>

            <button
              onClick={() => setShowPreview((v) => !v)}
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
                showPreview
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-surface-container-high/60 border-primary/[0.08] text-on-surface-variant hover:text-primary',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[15px]">preview</span>
              {showPreview ? 'Hide Preview' : 'Preview'}
            </button>

            <button
              onClick={() => setShowSchedule((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high/60 border border-primary/[0.08] text-on-surface-variant text-sm font-semibold hover:text-primary transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">schedule</span>
              Schedule Post
            </button>

            <button
              onClick={handlePublish}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary text-sm font-bold hover:bg-secondary/15 transition-all ml-auto"
            >
              <span className="material-symbols-outlined text-[15px]">send</span>
              Publish Now
            </button>
          </div>

          {/* Schedule date picker (mock) */}
          {showSchedule && (
            <div className="glass-card p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">calendar_today</span>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="bg-transparent text-sm text-primary focus:outline-none flex-1"
              />
              <button
                onClick={() => { showToast('Post scheduled for ' + (scheduleDate || 'selected time')); setShowSchedule(false) }}
                className="px-4 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/15 transition-all"
              >
                Confirm
              </button>
            </div>
          )}
        </div>

        {/* Right — Preview */}
        <div className="space-y-4">
          {showPreview ? (
            <div className="glass-card p-6">
              <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-4">
                Preview as: {platform}
              </div>

              {/* Phone frame mock */}
              <div className="max-w-[280px] mx-auto">
                <div className="bg-black/60 rounded-3xl border border-white/10 p-0 overflow-hidden">
                  {/* Post header */}
                  <div className="p-4 flex items-center gap-2 border-b border-white/5">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-black text-primary">
                      AL
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-white">almo.sa</div>
                      <div className="text-[10px] text-white/40">Sponsored</div>
                    </div>
                    <span className="ml-auto text-white/40 text-[18px]">···</span>
                  </div>

                  {/* Image placeholder */}
                  <div className="w-full aspect-square bg-gradient-to-br from-primary/10 via-[#ff9fe3]/10 to-secondary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">image</span>
                  </div>

                  {/* Caption */}
                  <div className="p-4">
                    <div className="flex gap-4 mb-3">
                      {[
                        { icon: 'favorite_border' },
                        { icon: 'chat_bubble_outline' },
                        { icon: 'send' },
                      ].map((ic, i) => (
                        <span key={i} className="material-symbols-outlined text-[20px] text-white/60">{ic.icon}</span>
                      ))}
                      <span className="material-symbols-outlined text-[20px] text-white/60 ml-auto">bookmark_border</span>
                    </div>
                    <div className="text-[11px] text-white/80 leading-snug line-clamp-4">
                      <span className="font-bold">almo.sa</span> {draftText.slice(0, 120)}{draftText.length > 120 ? '...' : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30 mb-3">preview</span>
              <p className="text-sm text-on-surface-variant">Click Preview to see how your post will look</p>
            </div>
          )}

          {/* Past posts */}
          <div>
            <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">
              Recent Posts
            </div>
            <div className="space-y-3">
              {PAST_POSTS.map((post, i) => (
                <div key={i} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold tracking-[0.08em] uppercase ${PLATFORM_COLOR[post.platform as Platform]}`}>
                      {post.platform}
                    </span>
                    <span className="text-[10px] text-on-surface-variant/50">{post.daysAgo}</span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant line-clamp-2 mb-3">{post.caption}</p>
                  <div className="flex items-center gap-4 text-[11px] text-on-surface-variant/60">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">favorite</span>
                      {post.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">chat_bubble</span>
                      {post.comments}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">share</span>
                      {post.shares}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
