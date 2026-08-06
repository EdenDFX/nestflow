export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "review",
  "completed",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type TaskAssignee = {
  userId: string;
  fullName: string | null;
  nestId: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export type NestFlowTask = {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  blockedReason: string | null;
  createdBy: string;
  completedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignees: TaskAssignee[];
  tags: string[];
};

export type NestFlowWorkspace = {
  id: string;
  teamId: string;
  name: string;
  isArchived: boolean;
  kind: "general" | "hr";
};

export type TaskCounters = {
  open: number;
  inProgress: number;
  blocked: number;
  overdue: number;
  completed: number;
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  review: "Review",
  completed: "Completed",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  backlog: ["todo", "in_progress"],
  todo: ["in_progress", "blocked", "backlog"],
  in_progress: ["blocked", "review", "todo"],
  blocked: ["todo", "in_progress"],
  review: ["in_progress", "completed"],
  completed: ["in_progress"],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskPriority(value: string): value is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(value);
}
