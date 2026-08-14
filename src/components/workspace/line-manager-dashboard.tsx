"use client";

import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { BadgeAlertIcon } from "@/components/icons/badge-alert";

import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { StatusBadge } from "@/components/tasks/status-badge";
import type { ManagedTeamSummary } from "@/lib/admin/queries";
import type { WorkloadRow } from "@/lib/admin/types";
import type { NestFlowProfile } from "@/lib/auth/types";
import type {
  NestFlowTask,
  NestFlowWorkspace,
  TaskAssignee,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type LineManagerDashboardProps = {
  profile: NestFlowProfile;
  managedTeams: ManagedTeamSummary[];
  workload: WorkloadRow[];
  blocked: NestFlowTask[];
  teamTasks: NestFlowTask[];
  workspaces: NestFlowWorkspace[];
  people: TaskAssignee[];
  canAssign: boolean;
};

function formatDue(dueAt: string | null) {
  if (!dueAt) return "No due date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(dueAt));
}

export function LineManagerDashboard({
  profile,
  managedTeams,
  workload,
  blocked,
  teamTasks,
  workspaces,
  people,
  canAssign,
}: LineManagerDashboardProps) {
  const firstName = profile.fullName?.trim().split(/\s+/)[0];
  const teamLabel =
    managedTeams.length === 0
      ? "No team assigned"
      : managedTeams.map((team) => team.name).join(" · ");

  const openCount = teamTasks.filter((task) => task.status !== "completed").length;
  const inProgress = teamTasks.filter(
    (task) => task.status === "in_progress",
  ).length;
  const overdueCount = workload.reduce((sum, row) => sum + row.overdueCount, 0);
  const rosterSize = workload.length;
  const attention = blocked.slice(0, 5);
  const hotWorkload = workload
    .filter((row) => row.openCount > 0 || row.blockedCount > 0)
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="flex flex-col gap-6 border-b border-border/80 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Team desk
            </p>
            <div className="space-y-1">
              <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                {teamLabel}
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                {firstName ? `${firstName}, ` : null}
                your view is limited to people on this roster. HR / Admin assign
                members here.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {managedTeams.map((team) => (
                <span
                  key={team.id}
                  className="rounded-md border border-border/80 bg-muted/50 px-2.5 py-1 text-xs font-medium"
                >
                  {team.name}
                </span>
              ))}
              {managedTeams.length === 0 ? (
                <span className="rounded-md border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground">
                  Waiting for team assignment
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TaskCreateDialog
              workspaces={workspaces}
              people={people}
              canAssign={canAssign}
              defaultAssigneeId={profile.userId}
            />
            <Link
              href="/app/team"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Open team suite
              <ArrowRightIcon className="inline-flex" size={14} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-border/80 sm:grid-cols-4 sm:divide-y-0">
          <MetricCell label="Roster" value={rosterSize} />
          <MetricCell label="Open" value={openCount} />
          <MetricCell label="In progress" value={inProgress} />
          <MetricCell
            label="Blocked"
            value={blocked.length}
            tone={blocked.length > 0 ? "warn" : "default"}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-border/80 bg-card">
          <header className="flex items-center justify-between border-b border-border/80 px-5 py-4">
            <div>
              <h2 className="font-heading text-lg font-semibold">Roster load</h2>
              <p className="text-xs text-muted-foreground">
                Only your managed team{managedTeams.length === 1 ? "" : "s"}.
                {overdueCount > 0
                  ? ` ${overdueCount} overdue across the roster.`
                  : " No overdue work right now."}
              </p>
            </div>
            <Link
              href="/app/team"
              className="text-xs font-medium text-primary hover:underline"
            >
              Full workload
            </Link>
          </header>

          {workload.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              No members on your roster yet. Ask HR to assign people under{" "}
              {teamLabel}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="border-b border-border/70 text-[11px] tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Person</th>
                    <th className="px-3 py-2.5 font-medium">Open</th>
                    <th className="px-3 py-2.5 font-medium">Blocked</th>
                    <th className="px-3 py-2.5 font-medium">Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {(hotWorkload.length > 0 ? hotWorkload : workload.slice(0, 6)).map(
                    (row) => (
                      <tr
                        key={row.userId}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="px-5 py-3">
                          <Link
                            href={`/app/team?person=${row.userId}`}
                            className="block hover:text-primary"
                          >
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {row.fullName ?? "Unnamed"}
                              </p>
                              {row.isManager ? (
                                <span className="rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold text-background">
                                  LM
                                </span>
                              ) : null}
                            </div>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {row.nestId ?? row.email}
                            </p>
                          </Link>
                        </td>
                        <td className="px-3 py-3 tabular-nums">{row.openCount}</td>
                        <td
                          className={cn(
                            "px-3 py-3 tabular-nums",
                            row.blockedCount > 0 && "font-semibold text-warning",
                          )}
                        >
                          {row.blockedCount}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-3 tabular-nums",
                            row.overdueCount > 0 && "font-semibold text-destructive",
                          )}
                        >
                          {row.overdueCount}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border/80 bg-[#141210] text-white dark:bg-[#0a0908]">
          <header className="flex items-start gap-3 border-b border-white/10 px-5 py-4">
            <span className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-warning/20 text-warning">
              <BadgeAlertIcon className="inline-flex" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-semibold">Attention</h2>
              <p className="text-xs text-white/55">
                Blocked work inside your managed teams.
              </p>
            </div>
          </header>

          {attention.length === 0 ? (
            <p className="px-5 py-8 text-sm text-white/55">
              No blocked tasks on your roster. Keep the board moving.
            </p>
          ) : (
            <ul className="divide-y divide-white/10">
              {attention.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/app/tasks/${task.id}`}
                    className="block px-5 py-3.5 transition-colors hover:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium">{task.title}</p>
                        <p className="truncate text-xs text-white/50">
                          {task.assignees
                            .map((person) => person.fullName ?? person.nestId)
                            .filter(Boolean)
                            .join(", ") || "Unassigned"}{" "}
                          · {formatDue(task.dueAt)}
                        </p>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                    {task.blockedReason ? (
                      <p className="mt-2 line-clamp-2 text-xs text-white/45">
                        {task.blockedReason}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-white/10 px-5 py-3">
            <Link
              href="/app/team"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              Manage blocked queue
              <ArrowRightIcon className="inline-flex" size={14} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warn";
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-heading text-3xl font-semibold tabular-nums tracking-tight",
          tone === "warn" && "text-warning",
        )}
      >
        {value}
      </p>
    </div>
  );
}
