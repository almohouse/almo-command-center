import { motion, AnimatePresence } from 'motion/react'
import { useAudioPlayer } from '@/data/audio-player'
import AudioPlaylistPanel from '@/components/layout/AudioPlaylistPanel'

interface Props {
  sidebarWidth: number
}

export default function AudioPlayer({ sidebarWidth }: Props) {
  const { track, playing, show, pause, resume, close, togglePlaylist, showPlaylist } = useAudioPlayer()

  return (
    <AnimatePresence>
      {show && track && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 right-0 z-50 transition-[left] duration-300 ease-in-out"
          style={{ left: sidebarWidth }}
        >
          {/* Playlist panel (above the bar) */}
          <AnimatePresence>
            {showPlaylist && <AudioPlaylistPanel />}
          </AnimatePresence>

          {/* Player bar */}
          <div
            className="h-16 flex items-center px-6 gap-4"
            style={{
              background: 'rgba(19, 19, 22, 0.88)',
              backdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(230, 230, 250, 0.06)',
            }}
          >
            {/* Play/Pause */}
            <button
              onClick={() => playing ? pause() : resume()}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary/15 text-secondary hover:bg-secondary/25 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">
                {playing ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Track info */}
            <div className="min-w-0 shrink-0">
              <div className="text-xs font-semibold text-primary truncate">{track.title}</div>
              <div className="text-[10px] text-on-surface-variant">{track.subtitle}</div>
            </div>

            {/* Progress bar */}
            <div className="flex-1 flex items-center gap-3 mx-4">
              <span className="text-[10px] font-mono text-on-surface-variant shrink-0">0:42</span>
              <div className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-secondary"
                  initial={{ width: '0%' }}
                  animate={{ width: playing ? '100%' : '35%' }}
                  transition={{ duration: playing ? 90 : 0.3, ease: 'linear' }}
                  style={{ boxShadow: '0 0 6px #cacafe40' }}
                />
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant shrink-0">{track.duration}</span>
            </div>

            {/* Playlist toggle */}
            <button
              onClick={togglePlaylist}
              className={[
                'transition-colors shrink-0',
                showPlaylist ? 'text-primary' : 'text-on-surface-variant hover:text-primary',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[18px]">queue_music</span>
            </button>

            {/* Volume */}
            <button className="text-on-surface-variant hover:text-primary transition-colors shrink-0">
              <span className="material-symbols-outlined text-[18px]">volume_up</span>
            </button>

            {/* Close */}
            <button
              onClick={close}
              className="text-on-surface-variant hover:text-primary transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
