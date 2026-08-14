"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  AdminReportSnapshot,
  AuditEvent,
  Department,
  DirectoryUser,
  Invite,
  NestFlowTeam,
  OversightLogEntry,
  OversightTaskRow,
  TeamMembershipRow,
} from "@/lib/admin/types";
import type { NestFlowTask, TaskAssignee } from "@/lib/tasks/types";

const AdminOversight = dynamic(
  () =>
    import("@/components/admin/admin-oversight").then((mod) => mod.AdminOversight),
  {
    loading: () => (
      <div className="h-[24rem] rounded-xl bg-muted/40" aria-hidden />
    ),
  },
);
const AdminSuite = dynamic(
  () => import("@/components/admin/admin-suite").then((mod) => mod.AdminSuite),
  {
    loading: () => (
      <div className="h-[24rem] rounded-xl bg-muted/40" aria-hidden />
    ),
  },
);

type AdminMode = "work" | "people";

export function AdminConsole({
  tasks,
  log,
  report,
  oversightUsers,
  users,
  departments,
  invites,
  auditEvents,
  teams,
  memberships,
  people = [],
  openByUser = {},
}: {
  tasks: OversightTaskRow[];
  log: OversightLogEntry[];
  report: AdminReportSnapshot;
  oversightUsers: DirectoryUser[];
  users: DirectoryUser[];
  departments: Department[];
  invites: Invite[];
  auditEvents: AuditEvent[];
  teams: NestFlowTeam[];
  memberships: TeamMembershipRow[];
  people?: TaskAssignee[];
  openByUser?: Record<string, NestFlowTask[]>;
}) {
  const [mode, setMode] = useState<AdminMode>("work");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "work" ? "default" : "outline"}
          onClick={() => setMode("work")}
        >
          Work
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "people" ? "default" : "outline"}
          onClick={() => setMode("people")}
        >
          People
        </Button>
      </div>

      {mode === "work" ? (
        <AdminOversight
          tasks={tasks}
          log={log}
          report={report}
          users={oversightUsers}
        />
      ) : (
        <AdminSuite
          embedded
          users={users}
          departments={departments}
          invites={invites}
          auditEvents={auditEvents}
          teams={teams}
          memberships={memberships}
          people={people}
          openByUser={openByUser}
        />
      )}
    </div>
  );
}
