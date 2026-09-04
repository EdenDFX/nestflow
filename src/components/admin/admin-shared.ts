import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  startOfWeek,
  subWeeks,
} from "date-fns";

import {
  isTaskStatus,
  STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";
import type { OversightTaskRow } from "@/lib/admin/types";

/** Lagos date label for admin lists. */
export function formatWhen(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatWhenTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/** Turn raw activity copy into readable labels for the admin list. */
export function formatActivitySummary(summary: string | null): string {
  if (!summary?.trim()) return "No activity yet";

  let text = summary.trim();

  const statusMove = text.match(/^Moved status from (\w+) to (\w+)$/i);
  if (statusMove) {
    const from = statusMove[1]!.toLowerCase();
    const to = statusMove[2]!.toLowerCase();
    const fromLabel = isTaskStatus(from) ? STATUS_LABELS[from] : statusMove[1];
    const toLabel = isTaskStatus(to) ? STATUS_LABELS[to] : statusMove[2];
    return `Status: ${fromLabel} → ${toLabel}`;
  }

  for (const status of [
    "in_progress",
    "backlog",
    "blocked",
    "review",
    "completed",
    "todo",
  ] as const) {
    text = text.replaceAll(
      new RegExp(`\\b${status}\\b`, "gi"),
      STATUS_LABELS[status],
    );
  }

  return text;
}

export function isOverdue(task: OversightTaskRow) {
  if (task.status === "completed" || !task.dueAt) return false;
  return new Date(task.dueAt).getTime() < Date.now();
}

export function taskPriority(task: OversightTaskRow): TaskPriority {
  if (
    task.priority === "urgent" ||
    task.priority === "high" ||
    task.priority === "medium" ||
    task.priority === "low"
  ) {
    return task.priority;
  }
  return "medium";
}

export function statusDotClass(status: TaskStatus, overdue: boolean) {
  if (overdue && status !== "completed") return "bg-destructive";
  switch (status) {
    case "completed":
      return "bg-success";
    case "blocked":
      return "bg-destructive";
    case "review":
      return "bg-warning";
    case "in_progress":
      return "bg-primary";
    case "todo":
      return "bg-info";
    case "backlog":
      return "bg-muted-foreground/50";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/** CSS modifier for admin calendar task blocks. */
export function calendarTaskToneClass(status: TaskStatus, overdue: boolean) {
  if (overdue && status !== "completed") return "is-overdue";
  switch (status) {
    case "completed":
      return "is-completed";
    case "blocked":
      return "is-blocked";
    case "review":
      return "is-review";
    case "in_progress":
      return "is-in-progress";
    case "todo":
      return "is-todo";
    case "backlog":
      return "is-backlog";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function taskRowSurfaceClass(status: TaskStatus, overdue: boolean) {
  if (overdue && status !== "completed") {
    return "bg-destructive/[0.05] hover:bg-destructive/[0.08]";
  }
  switch (status) {
    case "completed":
      return "bg-success/[0.05] hover:bg-success/[0.08]";
    case "blocked":
      return "bg-destructive/[0.05] hover:bg-destructive/[0.08]";
    case "review":
      return "bg-warning/[0.07] hover:bg-warning/[0.11]";
    case "in_progress":
      return "bg-primary/[0.05] hover:bg-primary/[0.09]";
    case "todo":
      return "bg-info/[0.05] hover:bg-info/[0.09]";
    case "backlog":
      return "bg-muted/35 hover:bg-muted/50";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function personInitials(name: string | null | undefined, fallback?: string | null) {
  const source = (name?.trim() || fallback?.trim() || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export type StatusFilter = "all" | TaskStatus | "overdue" | "unassigned";

export const QUICK_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "unassigned", label: "Unassigned" },
  { id: "in_progress", label: "In progress" },
  { id: "blocked", label: "Blocked" },
  { id: "review", label: "Review" },
  { id: "completed", label: "Completed" },
  { id: "todo", label: "To do" },
  { id: "backlog", label: "Backlog" },
];

export const PAGE_SIZE_OPTIONS = [10, 15, 25] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Compact page number window with ellipsis for long ranges. */
export function paginationWindow(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current]);
  for (let delta = 1; delta <= 1; delta += 1) {
    pages.add(current - delta);
    pages.add(current + delta);
  }

  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const result: Array<number | "ellipsis"> = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) {
      result.push("ellipsis");
    }
    result.push(page);
    previous = page;
  }
  return result;
}

/** Monday-based week interval for admin calendar. */
export function getWeekInterval(anchor: Date) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  const end = endOfWeek(anchor, { weekStartsOn: 1 });
  return { start, end, days: eachDayOfInterval({ start, end }) };
}

export function shiftWeek(anchor: Date, delta: number) {
  return delta >= 0 ? addWeeks(anchor, delta) : subWeeks(anchor, Math.abs(delta));
}

export function isDateInWeek(date: Date, weekStart: Date, weekEnd: Date) {
  return isWithinInterval(date, { start: weekStart, end: weekEnd });
}

/** Timestamp used to place a task on the admin week grid. */
export function taskCalendarDate(task: OversightTaskRow): Date | null {
  // Completed work should land on the completion day so "Completed (7d)"
  // jumps to the current week instead of an old due date.
  const source =
    task.status === "completed"
      ? (task.completedAt ?? task.dueAt)
      : (task.dueAt ?? null);
  if (!source) return null;
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Day key yyyy-MM-dd for placing a task on the admin week grid. */
export function taskCalendarDayKey(task: OversightTaskRow): string | null {
  const date = taskCalendarDate(task);
  if (!date) return null;
  return format(date, "yyyy-MM-dd");
}

export function formatDueTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function isAllDayDue(value: string | null) {
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  return date.getHours() === 0 && date.getMinutes() === 0;
}

/** Hours rendered as timed rows on the admin week grid. */
export const CALENDAR_HOUR_START = 8;
export const CALENDAR_HOUR_END = 18;

export function taskDueHour(value: string | null): number | null {
  if (!value || isAllDayDue(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours();
}

/** True when the task should sit in the all-day row (incl. outside grid hours). */
export function isCalendarAllDay(task: OversightTaskRow) {
  const date = taskCalendarDate(task);
  if (!date) return true;
  if (date.getHours() === 0 && date.getMinutes() === 0) return true;
  const hour = date.getHours();
  return hour < CALENDAR_HOUR_START || hour > CALENDAR_HOUR_END;
}

export function taskCalendarHour(task: OversightTaskRow): number | null {
  if (isCalendarAllDay(task)) return null;
  const date = taskCalendarDate(task);
  if (!date) return null;
  return date.getHours();
}

export function isToday(date: Date) {
  return isSameDay(date, new Date());
}

export function completedInLastDays(task: OversightTaskRow, days = 7) {
  if (!task.completedAt) return false;
  const completedAt = new Date(task.completedAt).getTime();
  if (Number.isNaN(completedAt)) return false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return completedAt >= cutoff;
}

/** Whether a task matches a status/quick filter used by admin metrics. */
export function taskMatchesStatusFilter(
  task: OversightTaskRow,
  filter: StatusFilter,
) {
  if (filter === "all") return task.status !== "completed";
  if (filter === "overdue") return isOverdue(task);
  if (filter === "unassigned") return task.assigneeNames.length === 0;
  // Align with the Completed (7d) metric when possible.
  if (filter === "completed") {
    return task.status === "completed" || completedInLastDays(task, 7);
  }
  return task.status === filter;
}

/** Prefer a dated task so metric clicks can jump the week calendar. */
export function pickCalendarFocusTask(
  tasks: OversightTaskRow[],
  filter: StatusFilter,
): OversightTaskRow | null {
  const matching = tasks.filter((task) =>
    taskMatchesStatusFilter(task, filter),
  );
  const dated = matching.filter((task) => taskCalendarDayKey(task));
  if (dated.length === 0) return matching[0] ?? null;

  dated.sort((a, b) => {
    const aTime = taskCalendarDate(a)!.getTime();
    const bTime = taskCalendarDate(b)!.getTime();
    return aTime - bTime;
  });

  if (filter === "completed") {
    // Most recently completed first.
    return dated[dated.length - 1] ?? null;
  }

  const todayKey = format(new Date(), "yyyy-MM-dd");
  return (
    dated.find((task) => taskCalendarDayKey(task)! >= todayKey) ??
    dated[dated.length - 1] ??
    null
  );
}

/** Apple-like spring for admin layout / resize motion. */
export const ADMIN_SPRING = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.85,
} as const;

/** Softer spring for panel crossfades and day slides. */
export const ADMIN_SPRING_SOFT = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.95,
} as const;
