import type { AppRole } from "@/lib/auth/types";
import { isAdminTaskOversightOnly } from "@/lib/tasks/interaction-mode";
import {
  canTransition,
  type TaskStatus,
} from "@/lib/tasks/types";

/** Statuses staff (and HR) may set while progressing work. */
const PROGRESS_STATUSES: readonly TaskStatus[] = [
  "in_progress",
  "blocked",
  "review",
];

/** Statuses line managers may set (create uses todo; close uses completed). */
const MANAGER_STATUSES: readonly TaskStatus[] = ["todo", "completed"];

/**
 * Whether the role may set a task to `to` (independent of graph).
 * Admin with line_manager or hr may set any status. Oversight-only admins may not.
 * Line managers set todo/completed. Staff and HR set in_progress/blocked/review only.
 */
export function canRoleSetStatus(
  roles: readonly AppRole[],
  to: TaskStatus,
): boolean {
  if (isAdminTaskOversightOnly(roles)) {
    return false;
  }
  if (roles.includes("admin")) {
    return true;
  }
  if (roles.includes("line_manager")) {
    return (MANAGER_STATUSES as readonly TaskStatus[]).includes(to);
  }
  return (PROGRESS_STATUSES as readonly TaskStatus[]).includes(to);
}

/**
 * Graph transition plus role ownership of the destination status.
 */
export function canRoleTransition(
  roles: readonly AppRole[],
  from: TaskStatus,
  to: TaskStatus,
): boolean {
  if (from === to) {
    return true;
  }
  if (!canTransition(from, to)) {
    return false;
  }
  return canRoleSetStatus(roles, to);
}

/** Statuses the actor may choose from `from` (excluding same status). */
export function allowedStatusTargets(
  roles: readonly AppRole[],
  from: TaskStatus,
): TaskStatus[] {
  const all: TaskStatus[] = [
    "backlog",
    "todo",
    "in_progress",
    "blocked",
    "review",
    "completed",
  ];
  return all.filter((to) => to !== from && canRoleTransition(roles, from, to));
}
