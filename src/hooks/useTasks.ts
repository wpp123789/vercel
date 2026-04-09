import { useState, useEffect, useCallback } from 'react';
import { supabase, ensureGuestSession, getCurrentUserId } from '../lib/supabase';
import * as db from '../lib/db';
import type { Task, Status } from '../types';

export function useTasks() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Init: ensure guest session, then load tasks
  useEffect(() => {
    async function init() {
      try {
        const uid = await ensureGuestSession();
        setUserId(uid);
        const data = await db.fetchTasks(uid);
        setTasks(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) => (t.id === (payload.new as Task).id ? (payload.new as Task) : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== (payload.old as Task).id));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const addTask = useCallback(
    async (payload: Omit<Task, 'id' | 'user_id' | 'created_at'>) => {
      if (!userId) return;
      try {
        const task = await db.createTask(userId, payload);
        await db.logActivity(task.id, userId, 'created', { title: task.title });
        // Real-time will update state; optimistic update for speed:
        setTasks((prev) => [task, ...prev]);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [userId]
  );

  const editTask = useCallback(
    async (id: string, patch: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>) => {
      if (!userId) return;
      // Optimistic update
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      try {
        await db.updateTask(id, patch);
        if (patch.status) {
          const prev = tasks.find((t) => t.id === id);
          await db.logActivity(id, userId, 'status_changed', {
            from: prev?.status,
            to: patch.status,
          });
        }
      } catch (e) {
        setError((e as Error).message);
        // Revert by refetching
        const data = await db.fetchTasks(userId);
        setTasks(data);
      }
    },
    [userId, tasks]
  );

  const removeTask = useCallback(
    async (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      try {
        await db.deleteTask(id);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    []
  );

  const moveTask = useCallback(
    async (id: string, status: Status) => {
      if (!userId) return;
      const prev = tasks.find((t) => t.id === id);
      if (!prev || prev.status === status) return;
      setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, status } : t)));
      try {
        await db.moveTask(id, status);
        await db.logActivity(id, userId, 'status_changed', { from: prev.status, to: status });
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [userId, tasks]
  );

  return { userId, tasks, loading, error, addTask, editTask, removeTask, moveTask };
}
