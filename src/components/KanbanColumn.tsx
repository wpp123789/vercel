import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '../types';
import { TaskCard } from './TaskCard';

interface Props {
  id: string;
  label: string;
  color: string;
  tasks: Task[];
  onOpen: (task: Task) => void;
  onEdit: (task: Task) => void;
  onAddTask: () => void;
}

export function KanbanColumn({ id, label, color, tasks, onOpen, onEdit, onAddTask }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="column">
      <div className="col-header">
        <div className="col-title">
          <span className="col-status-dot" style={{ background: color }} />
          <span className="col-label">{label}</span>
          <span className="col-count">{tasks.length}</span>
        </div>
        <button className="col-add" onClick={onAddTask} title={`Add task to ${label}`}>+</button>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`col-body${isOver ? ' drag-over' : ''}`}
        >
          {tasks.length === 0 && (
            <div className="empty-state">
              <span>No tasks yet</span>
            </div>
          )}
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpen} onEdit={onEdit} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
