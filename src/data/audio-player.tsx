import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AudioTrack {
  title: string
  subtitle: string
  duration: string
}

export interface AudioEpisode {
  id: string
  title: string
  subtitle: string
  duration: string
  category: 'business' | 'agents' | 'meetings' | 'discovery'
  createdAt: string
  url: string | null
}

interface AudioPlayerState {
  track: AudioTrack | null
  playing: boolean
  show: boolean
  play: (track: AudioTrack) => void
  pause: () => void
  resume: () => void
  close: () => void
  episodes: AudioEpisode[]
  showPlaylist: boolean
  togglePlaylist: () => void
  removeEpisode: (id: string) => void
  filterCategory: string
  setFilterCategory: (cat: string) => void
  playEpisode: (episode: AudioEpisode) => void
  currentEpisodeId: string | null
}

const MOCK_EPISODES: AudioEpisode[] = [
  {
    id: 'ep-001',
    title: 'Daily Summary — Mar 28',
    subtitle: 'Dashboard · AI Generated',
    duration: '2:30',
    category: 'business',
    createdAt: '2026-03-28T10:00:00Z',
    url: null,
  },
  {
    id: 'ep-002',
    title: 'Weekly P&L Overview',
    subtitle: 'Finance · AI Generated',
    duration: '4:15',
    category: 'business',
    createdAt: '2026-03-27T16:00:00Z',
    url: null,
  },
  {
    id: 'ep-003',
    title: 'Agent Cost Analysis',
    subtitle: 'Agents · AI Generated',
    duration: '3:45',
    category: 'agents',
    createdAt: '2026-03-27T09:30:00Z',
    url: null,
  },
  {
    id: 'ep-004',
    title: 'Monthly Sales Review',
    subtitle: 'Revenue · AI Generated',
    duration: '5:10',
    category: 'business',
    createdAt: '2026-03-26T14:00:00Z',
    url: null,
  },
  {
    id: 'ep-005',
    title: 'Goals Progress Update',
    subtitle: 'Goals · AI Generated',
    duration: '3:20',
    category: 'business',
    createdAt: '2026-03-25T11:00:00Z',
    url: null,
  },
  {
    id: 'ep-006',
    title: 'Product Discovery: Keyboard Tray',
    subtitle: 'Products · AI Generated',
    duration: '6:00',
    category: 'discovery',
    createdAt: '2026-03-25T08:00:00Z',
    url: null,
  },
  {
    id: 'ep-007',
    title: 'Council Meeting Recap',
    subtitle: 'Meetings · AI Generated',
    duration: '8:45',
    category: 'meetings',
    createdAt: '2026-03-24T17:00:00Z',
    url: null,
  },
  {
    id: 'ep-008',
    title: 'Cash Flow Forecast',
    subtitle: 'Finance · AI Generated',
    duration: '3:55',
    category: 'business',
    createdAt: '2026-03-24T10:00:00Z',
    url: null,
  },
  {
    id: 'ep-009',
    title: 'Agent Performance Review',
    subtitle: 'Agents · AI Generated',
    duration: '4:30',
    category: 'agents',
    createdAt: '2026-03-23T15:00:00Z',
    url: null,
  },
  {
    id: 'ep-010',
    title: 'Supplier Negotiation Briefing',
    subtitle: 'Discovery · AI Generated',
    duration: '5:20',
    category: 'discovery',
    createdAt: '2026-03-22T12:00:00Z',
    url: null,
  },
]

const AudioPlayerContext = createContext<AudioPlayerState | null>(null)

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<AudioTrack | null>(null)
  const [playing, setPlaying] = useState(false)
  const [show, setShow] = useState(false)
  const [episodes, setEpisodes] = useState<AudioEpisode[]>(MOCK_EPISODES)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null)

  const play = useCallback((t: AudioTrack) => {
    setTrack(t)
    setPlaying(true)
    setShow(true)
  }, [])

  const pause = useCallback(() => setPlaying(false), [])
  const resume = useCallback(() => setPlaying(true), [])
  const close = useCallback(() => {
    setShow(false)
    setPlaying(false)
    setTrack(null)
    setCurrentEpisodeId(null)
    setShowPlaylist(false)
  }, [])

  const togglePlaylist = useCallback(() => setShowPlaylist(prev => !prev), [])

  const removeEpisode = useCallback((id: string) => {
    setEpisodes(prev => prev.filter(ep => ep.id !== id))
    if (currentEpisodeId === id) {
      setShow(false)
      setPlaying(false)
      setTrack(null)
      setCurrentEpisodeId(null)
    }
  }, [currentEpisodeId])

  const playEpisode = useCallback((episode: AudioEpisode) => {
    setTrack({ title: episode.title, subtitle: episode.subtitle, duration: episode.duration })
    setPlaying(true)
    setShow(true)
    setCurrentEpisodeId(episode.id)
  }, [])

  return (
    <AudioPlayerContext.Provider value={{
      track, playing, show, play, pause, resume, close,
      episodes, showPlaylist, togglePlaylist, removeEpisode,
      filterCategory, setFilterCategory, playEpisode, currentEpisodeId,
    }}>
      {children}
    </AudioPlayerContext.Provider>
  )
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext)
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider')
  return ctx
}
