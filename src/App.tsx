import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useTasks } from './hooks/useTasks';
import { KanbanColumn } from './components/KanbanColumn';
import { TaskModal } from './components/TaskModal';
import { TaskDetail } from './components/TaskDetail';
import type { Task, Status } from './types';
import { COLUMNS } from './types';

export default function App() {
  const { userId, tasks, loading, error, addTask, editTask, removeTask, moveTask } = useTasks();

  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterLabel, setFilterLabel] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<Status>('todo');

  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Filter tasks per column
  function columnTasks(colId: Status): Task[] {
    return tasks.filter((t) => {
      if (t.status !== colId) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterLabel && !(t.labels ?? []).includes(filterLabel)) return false;
      return true;
    });
  }

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter((t) => {
      if (!t.due_date || t.status === 'done') return false;
      return new Date(t.due_date) < new Date();
    }).length,
  }), [tasks]);

  // DnD handlers
  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const taskId = active.id as string;
    // The over id is either a column id or another task id
    const overId = over.id as string;
    const targetCol = (COLUMNS.find((c) => c.id === overId)?.id ??
      tasks.find((t) => t.id === overId)?.status) as Status | undefined;

    if (targetCol) moveTask(taskId, targetCol);
  }

  function openAdd(status: Status = 'todo') {
    setEditingTask(null);
    setDefaultStatus(status);
    setShowModal(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setDefaultStatus(task.status);
    setShowModal(true);
    setDetailTask(null);
  }

  async function handleSave(data: Omit<Task, 'id' | 'user_id' | 'created_at'>) {
    if (editingTask) {
      await editTask(editingTask.id, data);
    } else {
      await addTask(data);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 32, height: 32, border: '2px solid #AFA9EC', borderTopColor: '#534AB7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Setting up your board…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 14, color: '#A32D2D' }}>⚠ {error}</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Check your Supabase env vars.</p>
      </div>
    );
  }

  const pct = stats.total > 0 ? Math.round(stats.done / stats.total * 100) : 0;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <div className="logo">
              <div className="logo-dot">
                <svg viewBox="0 0 12 12" fill="white" width="12" height="12">
                  <rect x="1" y="1" width="4" height="4" rx="1"/>
                  <rect x="7" y="1" width="4" height="4" rx="1"/>
                  <rect x="1" y="7" width="4" height="4" rx="1"/>
                  <rect x="7" y="7" width="4" height="4" rx="1"/>
                </svg>
              </div>
              Next Play
            </div>
            <div className="project-name"><span>/</span> Sprint Board</div>
          </div>
          <div className="header-right">
            <span className="guest-badge">Guest session</span>
            <div className="avatar">G</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-tertiary)' }}>
              <circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/>
            </svg>
            <input
              className="search-input"
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="divider" />
          <button
            className={`filter-btn${filterPriority === 'high' ? ' active' : ''}`}
            onClick={() => setFilterPriority(filterPriority === 'high' ? '' : 'high')}
          >
            <span style={{ width: 6, height: 6, background: '#E24B4A', borderRadius: '50%', display: 'inline-block' }} />
            High priority
          </button>
          <button
            className={`filter-btn${filterLabel ? ' active' : ''}`}
            onClick={() => setFilterLabel(filterLabel ? '' : 'feature')}
          >
            Labels {filterLabel && `· ${filterLabel}`}
          </button>
          <button className="add-task-btn" onClick={() => openAdd()}>
            + Add task
          </button>
        </div>

        {/* Stats bar */}
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-dot" style={{ background: '#888780' }} />
            <strong>{stats.total}</strong> total
          </div>
          <div className="stat">
            <span className="stat-dot" style={{ background: '#1D9E75' }} />
            <strong>{stats.done}</strong> done
          </div>
          <div className="stat">
            <span className="stat-dot" style={{ background: '#E24B4A' }} />
            <strong>{stats.overdue}</strong> overdue
          </div>
          <div className="stat" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            {pct}% complete
            <div style={{ width: 80, height: 4, background: 'var(--color-background-secondary)', borderRadius: 2, marginLeft: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#1D9E75', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="board">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              color={col.color}
              tasks={columnTasks(col.id)}
              onOpen={setDetailTask}
              onEdit={openEdit}
              onAddTask={() => openAdd(col.id)}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <TaskModal
          task={editingTask}
          defaultStatus={defaultStatus}
          onSave={handleSave}
          onDelete={async (id) => { await removeTask(id); }}
          onClose={() => setShowModal(false)}
        />
      )}

      {detailTask && userId && (
        <TaskDetail
          task={tasks.find((t) => t.id === detailTask.id) ?? detailTask}
          userId={userId}
          onEdit={() => openEdit(detailTask)}
          onDelete={async () => { await removeTask(detailTask.id); setDetailTask(null); }}
          onClose={() => setDetailTask(null)}
        />
      )}
    </DndContext>
  );
}
