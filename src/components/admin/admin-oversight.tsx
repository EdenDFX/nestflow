"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PriorityBadge, StatusBadge } from "@/components/tasks/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setUserRolesAction } from "@/lib/admin/actions";
import type {
  AdminReportSnapshot,
  DirectoryUser,
  OversightLogEntry,
  OversightTaskRow,
} from "@/lib/admin/types";
import { APP_ROLES, roleLabel, type AppRole } from "@/lib/auth/types";
import {
  isTaskStatus,
  STATUS_LABELS,
  type TaskStatus,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type OversightTab = "tasks" | "log" | "reports" | "roles";

type StatusFilter = "all" | TaskStatus | "overdue" | "unassigned";

function formatWhen(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatWhenTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isOverdue(task: OversightTaskRow) {
  if (task.status === "completed" || !task.dueAt) return false;
  return new Date(task.dueAt).getTime() < Date.now();
}

export function AdminOversight({
  tasks,
  log,
  report,
  users,
}: {
  tasks: OversightTaskRow[];
  log: OversightLogEntry[];
  report: AdminReportSnapshot;
  users: DirectoryUser[];
}) {
  const [tab, setTab] = useState<OversightTab>("tasks");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (statusFilter === "overdue" && !isOverdue(task)) return false;
      if (statusFilter === "unassigned" && task.assigneeNames.length > 0) {
        return false;
      }
      if (
        statusFilter !== "all" &&
        statusFilter !== "overdue" &&
        statusFilter !== "unassigned" &&
        task.status !== statusFilter
      ) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        task.title,
        task.createdByName,
        task.createdByNestId,
        task.workspaceName,
        ...task.assigneeNames,
        task.lastUpdateSummary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [tasks, query, statusFilter]);

  const filteredLog = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return log;
    return log.filter((entry) =>
      [entry.summary, entry.detail, entry.actorName, entry.taskTitle]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [log, query]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-semibold tracking-tight uppercase sm:text-5xl">
            Overview
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Every task across NestFlow: who created it, who owns it, due dates,
            and what changed. Use Log for history and Reports for a quick
            read of org health.
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <div>
            <dt className="inline">Open </dt>
            <dd className="inline tabular-nums font-medium text-foreground">
              {report.openTasks}
            </dd>
          </div>
          <div>
            <dt className="inline">Overdue </dt>
            <dd className="inline tabular-nums font-medium text-foreground">
              {report.overdue}
            </dd>
          </div>
          <div>
            <dt className="inline">Blocked </dt>
            <dd className="inline tabular-nums font-medium text-foreground">
              {report.blocked}
            </dd>
          </div>
          <div>
            <dt className="inline">Done (7d) </dt>
            <dd className="inline tabular-nums font-medium text-foreground">
              {report.completedLast7Days}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["tasks", "All tasks"],
            ["log", "Log"],
            ["reports", "Reports"],
            ["roles", "Roles"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={tab === id ? "default" : "outline"}
            onClick={() => {
              setTab(id);
              setQuery("");
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "tasks" ? (
        <TasksPanel
          tasks={filteredTasks}
          total={tasks.length}
          query={query}
          onQueryChange={setQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      ) : null}

      {tab === "log" ? (
        <LogPanel
          entries={filteredLog}
          query={query}
          onQueryChange={setQuery}
        />
      ) : null}

      {tab === "reports" ? <ReportsPanel report={report} /> : null}

      {tab === "roles" ? <RolesPanel users={users} /> : null}
    </div>
  );
}

function TasksPanel({
  tasks,
  total,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
}: {
  tasks: OversightTaskRow[];
  total: number;
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold">All tasks</h2>
          <p className="text-xs text-muted-foreground">
            Showing {tasks.length} of {total}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search title, creator, assignee…"
            className="w-full sm:w-64"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              onStatusFilterChange(value as StatusFilter)
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {(
                [
                  "backlog",
                  "todo",
                  "in_progress",
                  "blocked",
                  "review",
                  "completed",
                ] as const
              ).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-border/80 bg-muted/40 text-[11px] tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Created by</th>
              <th className="px-3 py-3 font-medium">Assignees</th>
              <th className="px-3 py-3 font-medium">Timeframe</th>
              <th className="px-3 py-3 font-medium">Latest update</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No tasks match this filter.
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const status = isTaskStatus(task.status)
                  ? task.status
                  : "backlog";
                return (
                  <tr
                    key={task.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/app/tasks/${task.id}`}
                        className="font-medium hover:underline"
                      >
                        {task.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {task.workspaceName}
                        {task.workspaceKind === "hr" ? " · HR" : ""}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex flex-col items-start gap-1.5">
                        <StatusBadge status={status} />
                        <PriorityBadge
                          priority={
                            task.priority === "urgent" ||
                            task.priority === "high" ||
                            task.priority === "medium" ||
                            task.priority === "low"
                              ? task.priority
                              : "medium"
                          }
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="font-medium">
                        {task.createdByName ?? "Unknown"}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {task.createdByNestId ?? "-"}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      {task.assigneeNames.length === 0 ? (
                        <span className="text-muted-foreground">Unassigned</span>
                      ) : (
                        <p className="max-w-[12rem] truncate">
                          {task.assigneeNames.join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-muted-foreground">
                      <p>
                        Created {formatWhen(task.createdAt)}
                      </p>
                      <p
                        className={cn(
                          isOverdue(task) && "font-medium text-destructive",
                        )}
                      >
                        Due {formatWhen(task.dueAt)}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="max-w-[14rem] truncate text-sm">
                        {task.lastUpdateSummary ?? "No activity yet"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatWhenTime(task.lastUpdateAt)}
                        {task.lastUpdateBy ? ` · ${task.lastUpdateBy}` : ""}
                      </p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LogPanel({
  entries,
  query,
  onQueryChange,
}: {
  entries: OversightLogEntry[];
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold">Activity log</h2>
          <p className="text-xs text-muted-foreground">
            Task updates and admin actions, newest first.
          </p>
        </div>
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Filter log…"
          className="w-full sm:w-64"
        />
      </div>

      <div className="rounded-2xl border border-border/80 bg-card">
        {entries.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No log entries match.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        entry.source === "task"
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {entry.source === "task" ? "Task" : "Admin"}
                    </span>
                    <p className="text-sm font-medium">{entry.summary}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.actorName ?? "System"}
                    {entry.taskTitle ? ` · ${entry.taskTitle}` : ""}
                    {entry.detail ? ` · ${entry.detail}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <time className="text-xs tabular-nums text-muted-foreground">
                    {formatWhenTime(entry.at)}
                  </time>
                  {entry.taskId ? (
                    <Link
                      href={`/app/tasks/${entry.taskId}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Open
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ReportsPanel({ report }: { report: AdminReportSnapshot }) {
  const maxStatus = Math.max(1, ...report.byStatus.map((row) => row.count));

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-semibold">Reports</h2>
        <p className="text-xs text-muted-foreground">
          Simple snapshot of work across the organisation. Numbers update when
          you refresh the page.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStat label="Open tasks" value={report.openTasks} />
        <ReportStat
          label="Overdue"
          value={report.overdue}
          tone={report.overdue > 0 ? "warn" : "default"}
        />
        <ReportStat
          label="Blocked"
          value={report.blocked}
          tone={report.blocked > 0 ? "warn" : "default"}
        />
        <ReportStat label="Unassigned open" value={report.unassignedOpen} />
        <ReportStat label="Created (7 days)" value={report.createdLast7Days} />
        <ReportStat
          label="Completed (7 days)"
          value={report.completedLast7Days}
        />
        <ReportStat label="Updated (7 days)" value={report.updatedLast7Days} />
        <ReportStat label="All tasks" value={report.totalTasks} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/80 bg-card">
          <header className="border-b border-border/80 px-5 py-4">
            <h3 className="font-heading text-base font-semibold">
              By status
            </h3>
          </header>
          <ul className="space-y-3 p-5">
            {report.byStatus.map((row) => (
              <li key={row.status} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{row.label}</span>
                  <span className="tabular-nums font-medium">{row.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.round((row.count / maxStatus) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card">
          <header className="border-b border-border/80 px-5 py-4">
            <h3 className="font-heading text-base font-semibold">
              Workspaces
            </h3>
          </header>
          {report.byWorkspace.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              No workspaces with tasks yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border/70 text-[11px] tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Workspace</th>
                    <th className="px-3 py-2.5 font-medium">Open</th>
                    <th className="px-3 py-2.5 font-medium">Overdue</th>
                    <th className="px-3 py-2.5 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byWorkspace.map((row) => (
                    <tr
                      key={row.name}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-5 py-3 font-medium">{row.name}</td>
                      <td className="px-3 py-3 tabular-nums">{row.open}</td>
                      <td
                        className={cn(
                          "px-3 py-3 tabular-nums",
                          row.overdue > 0 && "font-medium text-destructive",
                        )}
                      >
                        {row.overdue}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-muted-foreground">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card">
        <header className="border-b border-border/80 px-5 py-4">
          <h3 className="font-heading text-base font-semibold">
            Top creators
          </h3>
          <p className="text-xs text-muted-foreground">
            People who opened the most tasks (currently unarchived)
          </p>
        </header>
        {report.topCreators.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">No creators yet.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {report.topCreators.map((row) => (
              <li
                key={row.name}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <span className="font-medium">{row.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {row.count} task{row.count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ReportStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card px-4 py-3">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-heading text-3xl font-semibold tabular-nums tracking-tight",
          tone === "warn" && value > 0 && "text-warning",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function RolesPanel({ users }: { users: DirectoryUser[] }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">Roles</h2>
        <p className="text-xs text-muted-foreground">
          NestFlow application roles only. Gear roles are managed elsewhere.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border/80 bg-muted/40 text-[11px] tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Person</th>
              <th className="px-3 py-3 font-medium">Roles</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <RoleRow key={user.userId} user={user} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RoleRow({ user }: { user: DirectoryUser }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [roles, setRoles] = useState<AppRole[]>(user.roles);

  function toggleRole(role: AppRole) {
    setRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    );
  }

  function save() {
    startTransition(async () => {
      const next = roles.length > 0 ? roles : (["staff"] as AppRole[]);
      const result = await setUserRolesAction({
        userId: user.userId,
        roles: next,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not update roles.");
        return;
      }
      toast.success("Roles updated.");
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium">{user.fullName ?? "Unnamed"}</p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {user.nestId ?? user.email}
        </p>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1.5">
          {APP_ROLES.map((role) => {
            const active = roles.includes(role);
            return (
              <button
                key={role}
                type="button"
                disabled={pending}
                onClick={() => toggleRole(role)}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {roleLabel(role)}
              </button>
            );
          })}
        </div>
      </td>
      <td className="px-3 py-3 text-muted-foreground">
        {user.isActive ? "Active" : "Inactive"}
      </td>
      <td className="px-3 py-3 text-right">
        <Button type="button" size="sm" disabled={pending} onClick={save}>
          Save
        </Button>
      </td>
    </tr>
  );
}
