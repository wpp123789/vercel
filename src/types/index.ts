export type Priority = 'low' | 'normal' | 'high';
export type Status = 'todo' | 'in_progress' | 'in_review' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  due_date: string | null;
  user_id: string;
  created_at: string;
  labels?: string[];
  assignee_ids?: string[];
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

export interface ActivityLog {
  id: string;
  task_id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  color: string;
  initials: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  bg: string;
}

export const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: '#888780' },
  { id: 'in_progress', label: 'In Progress', color: '#534AB7' },
  { id: 'in_review', label: 'In Review', color: '#EF9F27' },
  { id: 'done', label: 'Done', color: '#1D9E75' },
];

export const LABEL_DEFS: Label[] = [
  { id: 'bug', name: 'Bug', bg: '#FCEBEB', color: '#A32D2D' },
  { id: 'feature', name: 'Feature', bg: '#EEEDFE', color: '#3C3489' },
  { id: 'design', name: 'Design', bg: '#FBEAF0', color: '#72243E' },
  { id: 'docs', name: 'Docs', bg: '#EAF3DE', color: '#27500A' },
  { id: 'urgent', name: 'Urgent', bg: '#FAEEDA', color: '#633806' },
];
