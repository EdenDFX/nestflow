import type { AppRole } from "@/lib/auth/types";

export type MutationCapability =
  | "manage_users"
  | "invite_users"
  | "manage_departments"
  | "view_audit"
  | "assign_tasks"
  | "manage_team_suite"
  | "access_hr_workspaces"
  | "create_tasks"
  | "comment_checklist";

const MATRIX: Record<MutationCapability, AppRole[]> = {
  manage_users: ["admin"],
  invite_users: ["admin", "hr"],
  manage_departments: ["admin"],
  view_audit: ["admin"],
  assign_tasks: ["admin", "line_manager", "hr"],
  manage_team_suite: ["admin", "line_manager"],
  access_hr_workspaces: ["admin", "hr"],
  create_tasks: ["admin", "line_manager", "hr", "staff"],
  comment_checklist: ["admin", "line_manager", "hr", "staff"],
};

export function rolesAllow(
  roles: AppRole[],
  capability: MutationCapability,
): boolean {
  const allowed = MATRIX[capability];
  return roles.some((role) => allowed.includes(role));
}

export function assertCapability(
  roles: AppRole[],
  capability: MutationCapability,
): void {
  if (!rolesAllow(roles, capability)) {
    throw new Error(`FORBIDDEN:${capability}`);
  }
}

export function getCapabilityMatrix() {
  return MATRIX;
}
