import { useState, useEffect, useRef, useCallback } from 'react'
import { Users, Send, Square, Play, FileText, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { SectionHeader } from '@/components/cards/SectionHeader'
import { cn } from '@/lib/utils'
import { paperclipApi, CouncilMessage } from '@/api/paperclip'

const AGENT_COLORS: Record<string, string> = {
  DCEO: 'from-accent-purple to-accent-blue',
  CTO: 'from-accent-blue to-accent-cyan',
  CMO: 'from-accent-green to-accent-cyan',
  COO: 'from-accent-yellow to-accent-orange',
  CFO: 'from-accent-red to-accent-orange',
}

function agentColor(name: string) {
  return AGENT_COLORS[name] ?? 'from-accent-blue to-accent-purple'
}

export function CouncilView() {
  const [sessionActive, setSessionActive] = useState(false)
  const [messages, setMessages] = useState<CouncilMessage[]>([])
  const [liveMessages, setLiveMessages] = useState<CouncilMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [liveConnected, setLiveConnected] = useState(false)
  const [mom, setMom] = useState<string | null>(null)
  const [momPosted, setMomPosted] = useState<string | null>(null)
  const [endingMeeting, setEndingMeeting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const fetchLiveMessages = useCallback(async () => {
    try {
      const data = await paperclipApi.councilMessages()
      setLiveMessages(data.messages)
      setLiveConnected(true)
    } catch {
      setLiveConnected(false)
    }
  }, [])

  useEffect(() => {
    fetchLiveMessages()
    pollRef.current = setInterval(fetchLiveMessages, 15000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchLiveMessages])

  useEffect(() => { scrollToBottom() }, [messages, liveMessages])

  const startMeeting = async () => {
    setLoading(true)
    try {
      await paperclipApi.councilStart()
      const systemMsg: CouncilMessage = {
        id: `sys-${Date.now()}`,
        from: 'System',
        agentId: '',
        role: '',
        message: 'Council meeting started. DCEO has opened the floor.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        isSystem: true,
      }
      setMessages([systemMsg])
      setSessionActive(true)
      setMom(null)
      setMomPosted(null)
    } catch (err) {
      console.error('Failed to start meeting:', err)
    } finally {
      setLoading(false)
    }
  }

  const endMeeting = async () => {
    setEndingMeeting(true)
    try {
      const sessionMessages = messages.filter(m => !m.isSystem)
      const result = await paperclipApi.councilEnd(sessionMessages)
      const systemMsg: CouncilMessage = {
        id: `sys-end-${Date.now()}`,
        from: 'System',
        agentId: '',
        role: '',
        message: 'Meeting ended. Minutes of Meeting generated.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        isSystem: true,
      }
      setMessages(prev => [...prev, systemMsg])
      setSessionActive(false)
      setMom(result.mom)
      setMomPosted(result.postedIssueIdentifier)
    } catch (err) {
      console.error('Failed to end meeting:', err)
    } finally {
      setEndingMeeting(false)
    }
  }

  const sendMessage = () => {
    if (!inputMessage.trim() || !sessionActive) return
    const msg: CouncilMessage = {
      id: `user-${Date.now()}`,
      from: 'Moe',
      agentId: 'moe',
      role: 'Co-Founder',
      message: inputMessage.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      isSystem: false,
    }
    setMessages(prev => [...prev, msg])
    setInputMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const displayMessages = sessionActive ? messages : liveMessages

  return (
    <div className="space-y-6 animate-slide-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionHeader title="Council Meeting" subtitle="Live agent feed · DCEO leads" icon={Users} accent="blue" />
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border',
            liveConnected
              ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
              : 'bg-glass text-text-secondary border-glass-border'
          )}>
            {liveConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {liveConnected ? 'Live' : 'Offline'}
          </div>

          {!sessionActive ? (
            <button
              onClick={startMeeting}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent-green/10 text-accent-green border border-accent-green/30 hover:bg-accent-green/20 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Start Meeting
            </button>
          ) : (
            <button
              onClick={endMeeting}
              disabled={endingMeeting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent-red/10 text-accent-red border border-accent-red/30 hover:bg-accent-red/20 transition-all disabled:opacity-50"
            >
              {endingMeeting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
              End Meeting
            </button>
          )}
        </div>
      </div>

      {/* Live agent feed / session chat */}
      <div className="glass-card flex flex-col" style={{ height: '500px' }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-glass-border">
          <p className="text-xs text-text-secondary">
            {sessionActive ? 'Session in progress' : `${liveMessages.length} live agent messages`}
          </p>
          <button onClick={fetchLiveMessages} className="p-1 rounded hover:bg-glass transition-all">
            <RefreshCw className="w-3 h-3 text-text-muted" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {displayMessages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-text-muted">
                {sessionActive ? 'Meeting in session...' : 'No recent agent messages'}
              </p>
            </div>
          )}
          {displayMessages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-3', msg.isSystem && 'justify-center')}>
              {msg.isSystem ? (
                <div className="glass-card px-4 py-2 text-xs text-text-secondary">
                  {msg.message}
                </div>
              ) : (
                <>
                  <div className={cn(
                    'w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
                    agentColor(msg.from)
                  )}>
                    {msg.from.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{msg.from}</span>
                      {msg.role && <span className="text-xs text-text-tertiary">{msg.role}</span>}
                      {msg.issueRef && (
                        <span className="text-xs text-text-muted font-mono truncate max-w-[160px]" title={msg.issueRef}>
                          ↪ {msg.issueRef}
                        </span>
                      )}
                      <span className="text-xs text-text-muted font-mono ml-auto flex-shrink-0">{msg.time}</span>
                    </div>
                    <div className="glass-card p-3">
                      <p className="text-sm text-white leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-glass-border p-4 flex gap-3">
          <input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={sessionActive ? 'Add to the discussion... (Enter to send)' : 'Start a meeting to participate'}
            disabled={!sessionActive}
            className="flex-1 bg-glass border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-blue/50 disabled:opacity-40"
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !sessionActive}
            className="p-2 rounded-lg bg-accent-blue text-white hover:bg-accent-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Minutes of Meeting */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-accent-blue" />
          <p className="metric-label">Minutes of Meeting</p>
          {momPosted && (
            <span className="text-xs text-accent-green border border-accent-green/20 bg-accent-green/10 px-2 py-0.5 rounded-full ml-2">
              Posted to {momPosted}
            </span>
          )}
        </div>
        {mom ? (
          <pre className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed font-sans max-h-64 overflow-y-auto">
            {mom}
          </pre>
        ) : (
          <p className="text-sm text-text-secondary">
            Auto-generated MoM will appear here after each session ends. Distributed to all Chiefs, Moe, and Alaa.
          </p>
        )}
      </div>
    </div>
  )
}
