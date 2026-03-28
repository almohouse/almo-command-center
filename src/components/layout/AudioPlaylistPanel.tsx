import { motion } from 'motion/react'
import { useAudioPlayer } from '@/data/audio-player'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'business', label: 'Business' },
  { key: 'agents', label: 'Agents' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'discovery', label: 'Discovery' },
] as const

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export default function AudioPlaylistPanel() {
  const {
    episodes, showPlaylist, togglePlaylist, removeEpisode,
    filterCategory, setFilterCategory, playEpisode, currentEpisodeId, playing,
  } = useAudioPlayer()

  if (!showPlaylist) return null

  const filtered = filterCategory === 'all'
    ? episodes
    : episodes.filter(ep => ep.category === filterCategory)

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute bottom-full left-0 right-0 rounded-t-2xl overflow-hidden"
      style={{
        background: 'rgba(18, 18, 22, 0.97)',
        backdropFilter: 'blur(32px)',
        border: '1px solid rgba(230, 230, 250, 0.08)',
        borderBottom: 'none',
        maxHeight: '60vh',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="text-lg font-bold uppercase tracking-[0.2em] text-primary">
          Audio Library
        </div>
        <button
          onClick={togglePlaylist}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-primary/[0.05] hover:text-primary transition-all"
        >
          <span className="text-lg">×</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-6 pb-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setFilterCategory(cat.key)}
            className={[
              'px-3 py-1 rounded-lg text-[10px] font-bold tracking-[0.08em] uppercase border transition-all',
              filterCategory === cat.key
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'text-on-surface-variant border-primary/[0.06] hover:text-primary',
            ].join(' ')}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Episode list */}
      <div className="overflow-y-auto px-3 pb-4" style={{ maxHeight: 'calc(60vh - 110px)' }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant/40">
              library_music
            </span>
            <div>
              <div className="text-sm font-semibold text-primary/60">No audio episodes yet</div>
              <div className="text-xs text-on-surface-variant mt-1">
                Generate summaries from any page with an Audio Summary button.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map(ep => {
              const isCurrent = currentEpisodeId === ep.id
              return (
                <div
                  key={ep.id}
                  className={[
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                    isCurrent ? 'bg-primary/[0.06]' : 'hover:bg-primary/[0.03]',
                  ].join(' ')}
                  style={isCurrent ? { borderLeft: '2px solid #e6e6fa' } : { borderLeft: '2px solid transparent' }}
                >
                  {/* Play button */}
                  <button
                    onClick={() => playEpisode(ep)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isCurrent && playing ? 'pause' : 'play_arrow'}
                    </span>
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse-glow shrink-0" />
                      )}
                      <div className="text-sm font-semibold text-on-surface truncate">
                        {ep.title}
                      </div>
                    </div>
                    <div className="text-[10px] text-on-surface-variant truncate">{ep.subtitle}</div>
                  </div>

                  {/* Duration */}
                  <div className="text-[10px] font-mono text-on-surface-variant shrink-0">
                    {ep.duration}
                  </div>

                  {/* Relative time */}
                  <div className="text-[10px] text-on-surface-variant shrink-0 w-16 text-right">
                    {relativeTime(ep.createdAt)}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeEpisode(ep.id) }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant/40 opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error/10 transition-all shrink-0"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
