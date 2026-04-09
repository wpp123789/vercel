import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Task, Comment, ActivityLog } from '../types';
import { LABEL_DEFS, COLUMNS } from '../types';
import { fetchComments, addComment, fetchActivity } from '../lib/db';

const MEMBER_MAP: Record<string, { name: string; bg: string; text: string; initials: string }> = {
  m1: { name: 'Alex Chen', initials: 'AC', bg: '#CECBF6', text: '#3C3489' },
  m2: { name: 'Sara Kim', initials: 'SK', bg: '#F4C0D1', text: '#72243E' },
  m3: { name: 'James Wu', initials: 'JW', bg: '#9FE1CB', text: '#085041' },
  m4: { name: 'Mia Park', initials: 'MP', bg: '#FAC775', text: '#633806' },
};

interface Props {
  task: Task;
  userId: string;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function TaskDetail({ task, userId, onEdit, onDelete, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchComments(task.id).then(setComments).catch(() => {});
    fetchActivity(task.id).then(setActivity).catch(() => {});
  }, [task.id]);

  async function handleSendComment() {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const c = await addComment(task.id, userId, draft.trim());
      setComments((prev) => [...prev, c]);
      setDraft('');
    } finally {
      setSending(false);
    }
  }

  const colLabel = COLUMNS.find((c) => c.id === task.status)?.label ?? '';
  const labels = (task.labels ?? []).map((id) => LABEL_DEFS.find((l) => l.id === id)).filter(Boolean);
  const assignees = (task.assignee_ids ?? []).map((id) => MEMBER_MAP[id]).filter(Boolean);

  function activityLabel(log: ActivityLog) {
    if (log.event_type === 'created') return 'Task created';
    if (log.event_type === 'status_changed') {
      const from = COLUMNS.find((c) => c.id === (log.event_data as any).from)?.label ?? '';
      const to = COLUMNS.find((c) => c.id === (log.event_data as any).to)?.label ?? '';
      return `Moved from ${from} → ${to}`;
    }
    if (log.event_type === 'comment_added') return 'Added a comment';
    return log.event_type.replace(/_/g, ' ');
  }

  return (
    <>
      <div className="overlay-bg" onClick={onClose} />
      <div className="detail-panel open">
        <div className="detail-header">
          <h2 className="detail-title">{task.title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="detail-body">
          {/* Description */}
          {task.description && (
            <div className="detail-section">
              <div className="detail-section-label">Description</div>
              <p className="detail-desc">{task.description}</p>
            </div>
          )}

          {/* Meta */}
          <div className="detail-section">
            <div className="detail-section-label">Details</div>
            <div className="detail-row">
              <span className="detail-row-label">Status</span>
              <span style={{ fontSize: 13 }}>{colLabel}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">Priority</span>
              <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
            </div>
            {task.due_date && (
              <div className="detail-row">
                <span className="detail-row-label">Due</span>
                <span style={{ fontSize: 13 }}>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            {assignees.length > 0 && (
              <div className="detail-row">
                <span className="detail-row-label">Assignees</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {assignees.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div className="avatar" style={{ width: 22, height: 22, fontSize: 9, background: m.bg, color: m.text }}>{m.initials}</div>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {labels.length > 0 && (
              <div className="detail-row">
                <span className="detail-row-label">Labels</span>
                <div className="card-labels" style={{ margin: 0 }}>
                  {labels.map((l) => l && (
                    <span key={l.id} className="label-pill" style={{ background: l.bg, color: l.color }}>{l.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Activity */}
          {activity.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-label">Activity</div>
              {activity.map((a) => (
                <div key={a.id} className="activity-item">
                  <div className="activity-dot" />
                  <div>
                    <div className="activity-text">{activityLabel(a)}</div>
                    <div className="activity-time">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          <div className="detail-section">
            <div className="detail-section-label">Comments ({comments.length})</div>
            {comments.map((c) => (
              <div key={c.id} className="comment">
                <div className="avatar" style={{ width: 26, height: 26, fontSize: 10, flexShrink: 0, background: '#CECBF6', color: '#3C3489' }}>
                  G
                </div>
                <div className="comment-content">
                  <div className="comment-meta">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </div>
                  <div className="comment-text">{c.content}</div>
                </div>
              </div>
            ))}
            <div className="comment-input-wrap">
              <div className="avatar" style={{ width: 26, height: 26, fontSize: 10, flexShrink: 0, alignSelf: 'flex-end', background: '#EEEDFE', color: '#534AB7' }}>G</div>
              <textarea
                className="comment-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a comment..."
                rows={1}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
              />
              <button className="comment-send" onClick={handleSendComment} disabled={sending}>
                →
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={onEdit}>Edit task</button>
            <button className="btn-cancel" onClick={onDelete}>Delete</button>
          </div>
        </div>
      </div>
    </>
  );
}
