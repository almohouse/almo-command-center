import { useState, useRef } from 'react'
import { MENTIONABLES } from '@/data/agents'

export default function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionIdx, setMentionIdx] = useState(0)
  const [cursorPos, setCursorPos] = useState(0)

  const filtered = mentionQuery !== null
    ? MENTIONABLES.filter(m => m.name.toLowerCase().startsWith(mentionQuery.toLowerCase()))
    : []

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value
    const pos = e.target.selectionStart ?? text.length
    onChange(text)
    setCursorPos(pos)

    const before = text.slice(0, pos)
    const atMatch = before.match(/@(\w*)$/)
    if (atMatch) {
      setMentionQuery(atMatch[1])
      setMentionIdx(0)
    } else {
      setMentionQuery(null)
    }
  }

  function insertMention(name: string) {
    const before = value.slice(0, cursorPos)
    const after = value.slice(cursorPos)
    const atIdx = before.lastIndexOf('@')
    const newText = before.slice(0, atIdx) + '@' + name + ' ' + after
    onChange(newText)
    setMentionQuery(null)
    ref.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (mentionQuery === null || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setMentionIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setMentionIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      insertMention(filtered[mentionIdx].name)
    } else if (e.key === 'Escape') {
      setMentionQuery(null)
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows ?? 3}
        className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-primary/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary/30 focus:outline-none transition-all resize-none"
      />
      {mentionQuery !== null && filtered.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto rounded-xl bg-surface-container-high border border-primary/[0.12] shadow-lg z-50">
          {filtered.map((m, i) => (
            <button
              key={m.id}
              onClick={() => insertMention(m.name)}
              className={[
                'w-full flex items-center gap-3 px-3 py-2 text-left transition-all',
                i === mentionIdx ? 'bg-primary/10' : 'hover:bg-primary/[0.05]',
              ].join(' ')}
            >
              <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                {m.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-primary truncate">{m.name}</div>
                <div className="text-[10px] text-on-surface-variant truncate">{m.title}</div>
              </div>
              <span className="ml-auto text-[9px] font-bold tracking-[0.08em] uppercase text-on-surface-variant/50 shrink-0">
                {m.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
