import type { TaskPriority, TaskStatus } from "@/lib/tasks/types";

export const RECURRENCE_RULES = ["daily", "weekly", "monthly"] as const;
export type RecurrenceRule = (typeof RECURRENCE_RULES)[number];

export const APPROVAL_STATUSES = [
  "none",
  "pending",
  "approved",
  "rejected",
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export type TaskDependency = {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependsOnTitle: string;
  dependsOnStatus: TaskStatus;
  createdAt: string;
};

export type TimeEntry = {
  id: string;
  taskId: string;
  userId: string;
  userName: string | null;
  minutes: number;
  note: string;
  loggedAt: string;
  createdAt: string;
};

export type TaskTemplate = {
  id: string;
  name: string;
  description: string;
  workspaceKind: "general" | "hr";
  defaultPriority: TaskPriority;
  defaultStatus: TaskStatus;
  checklistTitles: string[];
  tags: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export const AUTOMATION_TRIGGERS = [
  "status_changed",
  "task_created",
  "task_completed",
] as const;
export type AutomationTrigger = (typeof AUTOMATION_TRIGGERS)[number];

export const AUTOMATION_ACTIONS = [
  "set_priority",
  "request_approval",
  "add_checklist_item",
  "notify_managers",
] as const;
export type AutomationActionType = (typeof AUTOMATION_ACTIONS)[number];

export type AutomationRule = {
  id: string;
  name: string;
  isActive: boolean;
  triggerType: AutomationTrigger;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  actionType: AutomationActionType;
  actionValue: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskM8Extras = {
  dependencies: TaskDependency[];
  blockersOf: TaskDependency[];
  timeEntries: TimeEntry[];
  totalMinutes: number;
  candidateTasks: Array<{ id: string; title: string; status: TaskStatus }>;
};

export const RECURRENCE_LABELS: Record<RecurrenceRule, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  none: "None",
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
};

export function isRecurrenceRule(value: string): value is RecurrenceRule {
  return (RECURRENCE_RULES as readonly string[]).includes(value);
}

export function isApprovalStatus(value: string | null | undefined): value is ApprovalStatus {
  if (!value) return false;
  return (APPROVAL_STATUSES as readonly string[]).includes(value);
}

export function advanceDueDate(
  from: Date,
  rule: RecurrenceRule,
  interval: number,
): Date {
  const next = new Date(from.getTime());
  switch (rule) {
    case "daily":
      next.setUTCDate(next.getUTCDate() + interval);
      break;
    case "weekly":
      next.setUTCDate(next.getUTCDate() + 7 * interval);
      break;
    case "monthly":
      next.setUTCMonth(next.getUTCMonth() + interval);
      break;
    default: {
      const _exhaustive: never = rule;
      return _exhaustive;
    }
  }
  return next;
}

export function resolveGearHref(params: {
  gearRef: string | null;
  gearUrl: string | null;
  baseUrl?: string | null;
}): string | null {
  if (params.gearUrl?.trim()) {
    return params.gearUrl.trim();
  }
  const ref = params.gearRef?.trim();
  if (!ref) return null;
  if (ref.startsWith("http://") || ref.startsWith("https://")) {
    return ref;
  }
  const base = (params.baseUrl ?? process.env.NEXT_PUBLIC_GEAR_APP_URL ?? "").replace(
    /\/$/,
    "",
  );
  if (!base) return null;
  return `${base}/gears/${encodeURIComponent(ref)}`;
}
