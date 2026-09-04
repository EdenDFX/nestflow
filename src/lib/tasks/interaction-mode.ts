import type { AppRole } from "@/lib/auth/types";
import type { NestFlowTask } from "@/lib/tasks/types";

export type TaskInteractionMode = "full_edit" | "progress" | "discussion";

/** Administrator without line_manager or hr operates tasks in view-only mode. */
export function isAdminTaskOversightOnly(roles: readonly AppRole[]): boolean {
  return (
    roles.includes("admin") &&
    !roles.includes("line_manager") &&
    !roles.includes("hr")
  );
}

export function canOperateOnTasks(roles: readonly AppRole[]): boolean {
  if (isAdminTaskOversightOnly(roles)) {
    return false;
  }
  return (
    roles.includes("admin") ||
    roles.includes("hr") ||
    roles.includes("line_manager")
  );
}

export function resolveTaskInteractionMode(
  profile: { userId: string; roles: AppRole[] },
  task: NestFlowTask,
): TaskInteractionMode {
  if (isAdminTaskOversightOnly(profile.roles)) {
    return "discussion";
  }

  const canAssign =
    profile.roles.includes("hr") || profile.roles.includes("line_manager");

  if (profile.roles.includes("admin") || canAssign) {
    return "full_edit";
  }

  const isAssignee = task.assignees.some(
    (assignee) => assignee.userId === profile.userId,
  );
  const isCreator = task.createdBy === profile.userId;

  if (isAssignee || isCreator) {
    return "progress";
  }

  return "discussion";
}
