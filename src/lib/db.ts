import { supabase } from './supabase';
import type { Task, Comment, ActivityLog, Status } from '../types';

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTask(
  userId: string,
  payload: Omit<Task, 'id' | 'user_id' | 'created_at'>
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...payload, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(
  id: string,
  patch: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function moveTask(id: string, status: Status): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function fetchComments(taskId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addComment(
  taskId: string,
  userId: string,
  content: string
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ task_id: taskId, user_id: userId, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Activity log ──────────────────────────────────────────────────────────────

export async function fetchActivity(taskId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function logActivity(
  taskId: string,
  userId: string,
  eventType: string,
  eventData: Record<string, unknown> = {}
): Promise<void> {
  await supabase.from('activity_logs').insert({
    task_id: taskId,
    user_id: userId,
    event_type: eventType,
    event_data: eventData,
  });
}
