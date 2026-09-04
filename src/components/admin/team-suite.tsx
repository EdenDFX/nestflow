"use client";

import Link from "next/link";
import { useState } from "react";

import { TeamPerformanceGrid } from "@/components/admin/team-performance-grid";
import { TeamTaskBoard } from "@/components/admin/team-task-board";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { PriorityBadge, StatusBadge } from "@/components/tasks/status-badge";
import { Button } from "@/components/ui/button";
import type { ManagedTeamSummary } from "@/lib/admin/queries";
import type { WorkloadRow } from "@/lib/admin/types";
import type { AppRole } from "@/lib/auth/types";
import type {
  NestFlowTask,
  NestFlowWorkspace,
  TaskAssignee,
} from "@/lib/tasks/types";

type TeamTab = "performance" | "board" | "blocked";

export function TeamSuite({
  tasks,
  blocked,
  workload,
  workspaces,
  people,
  canAssign,
  canCreateTasks = false,
  defaultAssigneeId,
  managedTeams,
  isOrgWide,
  initialPersonId,
  roles,
}: {
  tasks: NestFlowTask[];
  blocked: NestFlowTask[];
  workload: WorkloadRow[];
  workspaces: NestFlowWorkspace[];
  people: TaskAssignee[];
  canAssign: boolean;
  canCreateTasks?: boolean;
  defaultAssigneeId?: string;
  managedTeams: ManagedTeamSummary[];
  isOrgWide: boolean;
  initialPersonId?: string | null;
  roles: AppRole[];
}) {
  const [tab, setTab] = useState<TeamTab>(
    initialPersonId ? "board" : "performance",
  );
  const [personKey, setPersonKey] = useState(initialPersonId ?? null);
  if (initialPersonId && initialPersonId !== personKey) {
    setPersonKey(initialPersonId);
    setTab("board");
  }
  const teamLabel = isOrgWide
    ? "Organisation"
    : managedTeams.length > 0
      ? managedTeams.map((team) => team.name).join(" · ")
      : "No managed team";

  const openTotal = workload.reduce((sum, row) => sum + row.openCount, 0);
  const blockedTotal = workload.reduce((sum, row) => sum + row.blockedCount, 0);
  const overdueTotal = workload.reduce((sum, row) => sum + row.overdueCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {teamLabel}
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            {isOrgWide
              ? "Org-wide performance, board, and blocked queue."
              : "Performance and work for people HR / Admin placed on your roster."}
          </p>
          <dl className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
            <div>
              <dt className="inline">People </dt>
              <dd className="inline tabular-nums font-medium text-foreground">
                {workload.length}
              </dd>
            </div>
            <div>
              <dt className="inline">Open </dt>
              <dd className="inline tabular-nums font-medium text-foreground">
                {openTotal}
              </dd>
            </div>
            <div>
              <dt className="inline">Blocked </dt>
              <dd className="inline tabular-nums font-medium text-foreground">
                {blockedTotal}
              </dd>
            </div>
            <div>
              <dt className="inline">Overdue </dt>
              <dd className="inline tabular-nums font-medium text-foreground">
                {overdueTotal}
              </dd>
            </div>
          </dl>
        </div>
        {canCreateTasks ? (
          <TaskCreateDialog
            workspaces={workspaces}
            people={people}
            canAssign={canAssign}
            defaultAssigneeId={defaultAssigneeId}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["performance", "Performance"],
            ["board", "Team board"],
            ["blocked", `Blocked (${blocked.length})`],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={tab === id ? "default" : "outline"}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "performance" ? (
        <TeamPerformanceGrid workload={workload} />
      ) : null}

      {tab === "board" ? (
        <TeamTaskBoard
          initialTasks={tasks}
          roster={workload}
          people={people}
          canAssign={canAssign}
          initialAssigneeId={initialPersonId ?? undefined}
          roles={roles}
        />
      ) : null}

      {tab === "blocked" ? (
        <div className="space-y-2">
          {blocked.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-sm text-muted-foreground">
              No blocked tasks in your managed teams.
            </p>
          ) : (
            blocked.map((task) => (
              <Link
                key={task.id}
                href={`/app/tasks/${task.id}`}
                className="block rounded-2xl border border-border/80 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <p className="font-medium">{task.title}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {task.blockedReason || "No blocker reason recorded."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {task.assignees
                    .map(
                      (person) =>
                        person.fullName ?? person.nestId ?? person.email,
                    )
                    .join(", ") || "Unassigned"}
                </p>
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
