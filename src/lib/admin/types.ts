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

export type WorkloadRow = {
  userId: string;
  fullName: string | null;
  nestId: string | null;
  email: string | null;
  openCount: number;
  blockedCount: number;
  overdueCount: number;
  completedCount: number;
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
    admin: true,
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
    capability: "Create & update own tasks",
    admin: true,
    lineManager: true,
    hr: true,
    staff: true,
  },
  {
    capability: "Comment & checklist",
    admin: true,
    lineManager: true,
    hr: true,
    staff: true,
  },
];
