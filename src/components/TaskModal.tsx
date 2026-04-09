import React, { useState, useEffect } from 'react';
import type { Task, Status, Priority } from '../types';
import { LABEL_DEFS, COLUMNS } from '../types';

const MEMBERS = [
  { id: 'm1', name: 'Alex Chen', initials: 'AC', bg: '#CECBF6', text: '#3C3489' },
  { id: 'm2', name: 'Sara Kim', initials: 'SK', bg: '#F4C0D1', text: '#72243E' },
  { id: 'm3', name: 'James Wu', initials: 'JW', bg: '#9FE1CB', text: '#085041' },
  { id: 'm4', name: 'Mia Park', initials: 'MP', bg: '#FAC775', text: '#633806' },
];

interface FormState {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  due_date: string;
  labels: string[];
  assignee_ids: string[];
}

interface Props {
  task: Task | null;
  defaultStatus?: Status;
  onSave: (data: Omit<Task, 'id' | 'user_id' | 'created_at'>) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function TaskModal({ task, defaultStatus = 'todo', onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'normal',
    due_date: '',
    labels: [],
    assignee_ids: [],
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ?? '',
        labels: task.labels ?? [],
        assignee_ids: task.assignee_ids ?? [],
      });
    }
  }, [task]);

  const toggle = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  function handleSave() {
    if (!form.title.trim()) return;
    onSave({
      title: form.title.trim(),
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null,
      labels: form.labels,
      assignee_ids: form.assignee_ids,
    });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Edit task' : 'New task'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add details..."
              rows={3}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}>
                {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Due date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Labels</label>
            <div className="label-select">
              {LABEL_DEFS.map((l) => (
                <span
                  key={l.id}
                  className={`label-option${form.labels.includes(l.id) ? ' selected' : ''}`}
                  style={{
                    background: l.bg,
                    color: l.color,
                    borderColor: form.labels.includes(l.id) ? l.color : 'transparent',
                  }}
                  onClick={() => setForm({ ...form, labels: toggle(form.labels, l.id) })}
                >
                  {l.name}
                </span>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Assignees</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MEMBERS.map((m) => {
                const sel = form.assignee_ids.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => setForm({ ...form, assignee_ids: toggle(form.assignee_ids, m.id) })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                      padding: '4px 8px', borderRadius: 20,
                      border: `0.5px solid ${sel ? m.bg : 'var(--color-border-tertiary)'}`,
                      background: sel ? m.bg + '55' : 'transparent',
                    }}
                  >
                    <div className="avatar" style={{ width: 20, height: 20, fontSize: 8, background: m.bg, color: m.text }}>
                      {m.initials}
                    </div>
                    <span style={{ fontSize: 12 }}>{m.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="modal-actions">
            {task && onDelete && (
              <button className="btn-danger" onClick={() => { onDelete(task.id); onClose(); }}>
                Delete
              </button>
            )}
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>
              {task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
