import type { AppRole } from "@/lib/auth/types";

export type DirectoryUser = {
  userId: string;
  nestId: string | null;
  email: string | null;
  fullName: string | null;
  department: string | null;
  status: string | null;
  isActive: boolean;
  roles: AppRole[];
  openTaskCount: number;
};

export type Department = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
};

export type Invite = {
  id: string;
  email: string;
  nestId: string | null;
  fullName: string | null;
  department: string | null;
  roles: AppRole[];
  status: string;
  note: string;
  createdAt: string;
  invitedBy: string | null;
};

export type AuditEvent = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

/** Org-wide task row for administrator oversight. */
export type OversightTaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  workspaceName: string;
  workspaceKind: "general" | "hr";
  createdById: string;
  createdByName: string | null;
  createdByNestId: string | null;
  createdAt: string;
  updatedAt: string;
  dueAt: string | null;
  completedAt: string | null;
  assigneeNames: string[];
  lastUpdateSummary: string | null;
  lastUpdateAt: string | null;
  lastUpdateBy: string | null;
};

export type OversightLogEntry = {
  id: string;
  source: "task" | "admin";
  at: string;
  actorName: string | null;
  summary: string;
  detail: string;
  taskId: string | null;
  taskTitle: string | null;
};

export type AdminReportSnapshot = {
  totalTasks: number;
  openTasks: number;
  overdue: number;
  blocked: number;
  unassignedOpen: number;
  completedLast7Days: number;
  createdLast7Days: number;
  updatedLast7Days: number;
  byStatus: { status: string; label: string; count: number }[];
  byWorkspace: {
    name: string;
    open: number;
    total: number;
    overdue: number;
  }[];
  topCreators: { name: string; count: number }[];
  /** M8 delivery extras */
  pendingApprovals: number;
  recurringOpen: number;
  totalMinutesLogged: number;
  approvedCompleted: number;
  completionRate30d: number | null;
};

export type WorkloadRow = {
  userId: string;
  fullName: string | null;
  nestId: string | null;
  email: string | null;
  department: string | null;
  openCount: number;
  blockedCount: number;
  overdueCount: number;
  completedCount: number;
  minutesLogged: number;
  isManager?: boolean;
  focusTaskId?: string | null;
  focusTaskTitle?: string | null;
  focusTaskStatus?: string | null;
};

export type NestFlowTeam = {
  id: string;
  name: string;
  slug: string;
  isArchived: boolean;
  memberCount: number;
  managerIds: string[];
};

export type TeamMembershipRow = {
  id: string;
  teamId: string;
  teamName: string;
  userId: string;
  fullName: string | null;
  nestId: string | null;
  email: string | null;
  isManager: boolean;
};

export type PermissionRow = {
  capability: string;
  admin: boolean;
  lineManager: boolean;
  hr: boolean;
  staff: boolean;
};

/** Static capability matrix for Admin overview (ADR-003). */
export const PERMISSION_MATRIX: PermissionRow[] = [
  {
    capability: "Manage users & roles",
    admin: true,
    lineManager: false,
    hr: false,
    staff: false,
  },
  {
    capability: "Invite / deactivate employees",
    admin: true,
    lineManager: false,
    hr: true,
    staff: false,
  },
  {
    capability: "Manage departments",
    admin: true,
    lineManager: false,
    hr: false,
    staff: false,
  },
  {
    capability: "View audit log",
    admin: true,
    lineManager: false,
    hr: false,
    staff: false,
  },
  {
    capability: "Assign / reassign tasks",
    admin: false,
    lineManager: true,
    hr: true,
    staff: false,
  },
  {
    capability: "Manage team board & workload",
    admin: true,
    lineManager: true,
    hr: false,
    staff: false,
  },
  {
    capability: "Access HR people workspaces",
    admin: true,
    lineManager: false,
    hr: true,
    staff: false,
  },
  {
    capability: "Create tasks",
    admin: false,
    lineManager: true,
    hr: false,
    staff: false,
  },
  {
    capability: "Update assigned task progress",
    admin: false,
    lineManager: true,
    hr: true,
    staff: true,
  },
  {
    capability: "Comment on tasks",
    admin: true,
    lineManager: true,
    hr: true,
    staff: true,
  },
  {
    capability: "Checklist & attachments",
    admin: false,
    lineManager: true,
    hr: true,
    staff: true,
  },
];
