import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, isToday, addDays } from 'date-fns';
import type { Task } from '../types';
import { LABEL_DEFS } from '../types';

interface Props {
  task: Task;
  onOpen: (task: Task) => void;
  onEdit: (task: Task) => void;
}

const MEMBER_COLORS: Record<string, { bg: string; text: string }> = {
  m1: { bg: '#CECBF6', text: '#3C3489' },
  m2: { bg: '#F4C0D1', text: '#72243E' },
  m3: { bg: '#9FE1CB', text: '#085041' },
  m4: { bg: '#FAC775', text: '#633806' },
};

function dueDateStyle(dateStr: string, status: string) {
  if (status === 'done') return null;
  const d = new Date(dateStr);
  if (isPast(d) && !isToday(d)) return 'overdue';
  if (isToday(d) || d <= addDays(new Date(), 2)) return 'soon';
  return null;
}

export function TaskCard({ task, onOpen, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  const ds = task.due_date ? dueDateStyle(task.due_date, task.status) : null;
  const labels = (task.labels ?? []).map((id) => LABEL_DEFS.find((l) => l.id === id)).filter(Boolean);
  const assignees = task.assignee_ids ?? [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card${ds === 'overdue' ? ' overdue-card' : ''}${ds === 'soon' ? ' soon-card' : ''}`}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
    >
      {/* Labels */}
      {labels.length > 0 && (
        <div className="card-labels">
          {labels.map((l) => l && (
            <span key={l.id} className="label-pill" style={{ background: l.bg, color: l.color }}>
              {l.name}
            </span>
          ))}
        </div>
      )}

      {/* Title + menu */}
      <div className="card-top">
        <p className="card-title">{task.title}</p>
        <button
          className="card-menu"
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          aria-label="Edit task"
        >
          ⋯
        </button>
      </div>

      {/* Description snippet */}
      {task.description && (
        <p className="card-desc">{task.description}</p>
      )}

      {/* Footer */}
      <div className="card-footer">
        <div className="card-meta">
          <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
          {task.due_date && (
            <span className={`due-date${ds ? ' ' + ds : ''}`}>
              📅 {format(new Date(task.due_date), 'MMM d')}
            </span>
          )}
        </div>
        {assignees.length > 0 && (
          <div className="assignee-avatars">
            {assignees.slice(0, 3).map((mid) => {
              const c = MEMBER_COLORS[mid];
              const initials = mid === 'm1' ? 'AC' : mid === 'm2' ? 'SK' : mid === 'm3' ? 'JW' : 'MP';
              return (
                <div key={mid} className="avatar" style={{ background: c?.bg, color: c?.text, width: 22, height: 22, fontSize: 9 }}>
                  {initials}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
