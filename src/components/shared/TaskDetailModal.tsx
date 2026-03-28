import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import MentionTextarea from './MentionTextarea'
import {
  type Task, type Comment, type TaskStatus,
  TASK_COLUMNS, PRIORITY_BORDER,
  getCurrentUser, fmtDate, fmtTimestamp, renderMentionText,
} from '@/data/store'

interface Props {
  task: Task | null
  onClose: () => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onAddComment: (taskId: string, comment: Comment) => void
}

export default function TaskDetailModal({ task, onClose, onStatusChange, onAddComment }: Props) {
  const [comment, setComment] = useState('')

  function handlePost() {
    if (!comment.trim() || !task) return
    onAddComment(task.id, {
      id: `c-${Date.now()}`,
      author: getCurrentUser(),
      text: comment,
      createdAt: new Date().toISOString(),
    })
    setComment('')
  }

  return (
    <AnimatePresence>
      {task && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
            className="w-[640px] max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{
              background: 'rgba(18, 18, 22, 0.97)',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(230, 230, 250, 0.08)',
            }}
          >
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-[11px] text-on-surface-variant tracking-[0.05em] mb-2">{task.id}</div>
                  <h2 className="text-2xl font-black text-primary leading-tight">{task.title}</h2>
                </div>
                <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors shrink-0 ml-4">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Status chips */}
              <div>
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">Status</div>
                <div className="flex flex-wrap gap-2">
                  {TASK_COLUMNS.map(col => (
                    <button
                      key={col.status}
                      onClick={() => onStatusChange(task.id, col.status)}
                      className={[
                        'px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-[0.08em] uppercase border transition-all',
                        task.status === col.status
                          ? `${col.color} border-current bg-white/5`
                          : 'text-on-surface-variant border-primary/[0.08] hover:border-primary/20 hover:text-primary',
                      ].join(' ')}
                    >
                      {col.status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1.5">Description</div>
                  <p className="text-sm text-on-surface leading-relaxed">{task.description}</p>
                </div>
              )}

              {/* Metadata grid */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">Priority</div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.05em] px-2.5 py-1 rounded-full border"
                    style={{
                      color: PRIORITY_BORDER[task.priority],
                      borderColor: PRIORITY_BORDER[task.priority] + '50',
                      background: PRIORITY_BORDER[task.priority] + '15',
                    }}
                  >{task.priority}</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">Assignee</div>
                  <span className="text-sm text-primary font-semibold">{task.assignee}</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">Assigned By</div>
                  <span className="text-sm text-on-surface">{task.assignedBy}</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">Due Date</div>
                  <span className="text-sm text-on-surface">{task.dueDate ? fmtDate(task.dueDate) : '—'}</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">Project</div>
                  <span className="text-sm text-on-surface">{task.project}</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">Updated</div>
                  <span className="text-sm text-on-surface-variant">{fmtDate(task.updatedAt)}</span>
                </div>
              </div>

              {/* Status History */}
              {task.statusHistory.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">Status History</div>
                  <div className="space-y-2">
                    {task.statusHistory.map((sh, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-[10px] text-on-surface-variant/60 font-mono w-16 shrink-0">{fmtDate(sh.at)}</span>
                        <span className="text-on-surface-variant/40">
                          {sh.from ? (
                            <>{sh.from} <span className="material-symbols-outlined text-[12px] align-middle">arrow_forward</span> {sh.to}</>
                          ) : (
                            <>Created as {sh.to}</>
                          )}
                        </span>
                        <span className="text-[10px] text-primary/60 ml-auto shrink-0">by {sh.by}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              <div>
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-3">
                  Attachments <span className="text-on-surface-variant/40">({task.attachments.length})</span>
                </div>
                {task.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {task.attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-container-high/50 border border-primary/[0.06]">
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">attach_file</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-primary font-medium truncate">{att.name}</div>
                          <div className="text-[10px] text-on-surface-variant">{att.size} · {att.addedBy} · {fmtDate(att.addedAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-on-surface-variant/40">No attachments</div>
                )}
                <button
                  onClick={() => alert('Attachment upload coming soon')}
                  className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add attachment
                </button>
              </div>

              {/* Comments */}
              <div className="border-t border-primary/[0.06] pt-5">
                <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-4">
                  Comments <span className="text-on-surface-variant/40">({task.comments.length})</span>
                </div>
                {task.comments.length > 0 && (
                  <div className="space-y-4 mb-5">
                    {task.comments.map(c => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-black text-primary shrink-0 mt-0.5">
                          {c.author[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-primary">{c.author}</span>
                            <span className="text-[10px] text-on-surface-variant">{fmtTimestamp(c.createdAt)}</span>
                          </div>
                          <p className="text-sm text-on-surface leading-relaxed">{renderMentionText(c.text)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <MentionTextarea
                  value={comment}
                  onChange={setComment}
                  placeholder="Write a comment... (type @ to mention)"
                  rows={3}
                />
                <button
                  onClick={handlePost}
                  className="mt-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
                >
                  Post Comment
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
