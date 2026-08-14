"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PriorityBadge, StatusBadge } from "@/components/tasks/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type OversightTab = "tasks" | "log" | "reports" | "roles";

type StatusFilter = "all" | TaskStatus | "overdue" | "unassigned";

const TAB_ITEMS: { id: OversightTab; label: string }[] = [
  { id: "tasks", label: "Tasks" },
  { id: "log", label: "Log" },
  { id: "reports", label: "Delivery" },
  { id: "roles", label: "Roles" },
];

const QUICK_FILTERS: { id: StatusFilter; label: string }[] = [
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

function formatWhen(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatWhenTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/** Turn raw activity copy into readable labels for the admin list. */
function formatActivitySummary(summary: string | null): string {
  if (!summary?.trim()) return "No activity yet";

  let text = summary.trim();

  const statusMove = text.match(
    /^Moved status from (\w+) to (\w+)$/i,
  );
  if (statusMove) {
    const from = statusMove[1]!.toLowerCase();
    const to = statusMove[2]!.toLowerCase();
    const fromLabel = isTaskStatus(from) ? STATUS_LABELS[from] : statusMove[1];
    const toLabel = isTaskStatus(to) ? STATUS_LABELS[to] : statusMove[2];
    return `Status: ${fromLabel} → ${toLabel}`;
  }

  // Humanise snake_case status tokens embedded in freeform summaries.
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

function isOverdue(task: OversightTaskRow) {
  if (task.status === "completed" || !task.dueAt) return false;
  return new Date(task.dueAt).getTime() < Date.now();
}

function taskPriority(task: OversightTaskRow): TaskPriority {
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

function statusDotClass(status: TaskStatus, overdue: boolean) {
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

function statusDotLabel(status: TaskStatus, overdue: boolean) {
  if (overdue && status !== "completed") return "Overdue";
  switch (status) {
    case "completed":
      return "Completed";
    case "blocked":
      return "Blocked";
    case "review":
      return "Review";
    case "in_progress":
      return "In progress";
    case "todo":
      return "To do";
    case "backlog":
      return "Backlog";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function personInitials(name: string | null | undefined, fallback?: string | null) {
  const source = (name?.trim() || fallback?.trim() || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
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

  const activePeople = users.filter((user) => user.isActive).length;

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="flex flex-col gap-4 border-b border-border/80 p-5 sm:p-6">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Administrator
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Overview
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Org-wide tasks, activity, delivery, and roles.{" "}
              <span className="tabular-nums text-foreground">{tasks.length}</span>{" "}
              tasks ·{" "}
              <span className="tabular-nums text-foreground">{activePeople}</span>{" "}
              active ·{" "}
              <span className="tabular-nums text-foreground">
                {report.pendingApprovals}
              </span>{" "}
              pending approvals
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 divide-x divide-y divide-border/80 sm:grid-cols-4 sm:divide-y-0">
          <MetricCell
            label="Open"
            value={report.openTasks}
            onClick={() => {
              setTab("tasks");
              setStatusFilter("all");
              setQuery("");
            }}
          />
          <MetricCell
            label="Overdue"
            value={report.overdue}
            tone={report.overdue > 0 ? "warn" : "default"}
            onClick={() => {
              setTab("tasks");
              setStatusFilter("overdue");
              setQuery("");
            }}
          />
          <MetricCell
            label="Blocked"
            value={report.blocked}
            tone={report.blocked > 0 ? "warn" : "default"}
            onClick={() => {
              setTab("tasks");
              setStatusFilter("blocked");
              setQuery("");
            }}
          />
          <MetricCell
            label="Completed (7 days)"
            value={report.completedLast7Days}
            onClick={() => {
              setTab("reports");
              setQuery("");
            }}
          />
        </dl>
      </header>

      <nav
        aria-label="Admin overview sections"
        className="flex gap-1 border-b border-border/80"
      >
        {TAB_ITEMS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setQuery("");
              }}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
              {active ? (
                <span
                  aria-hidden
                  className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary"
                />
              ) : null}
            </button>
          );
        })}
      </nav>

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

function MetricCell({
  label,
  value,
  tone = "default",
  onClick,
}: {
  label: string;
  value: number;
  tone?: "default" | "warn";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-5 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-heading text-2xl font-semibold tabular-nums tracking-tight",
          tone === "warn" && value > 0 && "text-destructive",
        )}
      >
        {value}
      </dd>
    </button>
  );
}

const PAGE_SIZE_OPTIONS = [10, 15, 25] as const;
const DEFAULT_PAGE_SIZE = 10;

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
  const filterKey = `${statusFilter}::${query}`;
  const [pageState, setPageState] = useState({
    key: filterKey,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE as number,
  });
  // Reset to page 1 when search or status filters change (no effect needed).
  const page = pageState.key === filterKey ? pageState.page : 1;
  const pageSize =
    pageState.key === filterKey ? pageState.pageSize : DEFAULT_PAGE_SIZE;

  const totalMatched = tasks.length;
  const totalPages = Math.max(1, Math.ceil(totalMatched / pageSize) || 1);
  const currentPage = Math.min(page, totalPages);
  const rangeStart =
    totalMatched === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalMatched);
  const pageTasks = tasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function goToPage(next: number) {
    setPageState({
      key: filterKey,
      page: Math.min(Math.max(1, next), totalPages),
      pageSize,
    });
  }

  function updatePageSize(nextSize: number) {
    setPageState({
      key: filterKey,
      page: 1,
      pageSize: nextSize,
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            All tasks
          </h2>
          <p className="text-sm text-muted-foreground">
            {totalMatched === 0 ? (
              <>No matching tasks</>
            ) : (
              <>
                Showing{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {rangeStart}–{rangeEnd}
                </span>{" "}
                of{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {totalMatched}
                </span>
                {totalMatched !== total ? (
                  <>
                    {" "}
                    matching ·{" "}
                    <span className="tabular-nums font-medium text-foreground">
                      {total}
                    </span>{" "}
                    loaded
                  </>
                ) : null}
              </>
            )}
          </p>
        </div>
        <div className="w-full max-w-md">
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search title, creator, assignee, workspace…"
            aria-label="Search tasks"
            className="h-11 rounded-xl"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {QUICK_FILTERS.map((filter) => {
          const active = statusFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onStatusFilterChange(filter.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/80 bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
              aria-pressed={active}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {totalMatched === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 px-6 py-16 text-center">
          <p className="font-heading text-lg font-semibold">No matching tasks</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another filter or clear the search.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              onStatusFilterChange("all");
              onQueryChange("");
            }}
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <>
          <ul className="space-y-2.5">
            {pageTasks.map((task) => {
              const status = isTaskStatus(task.status) ? task.status : "backlog";
              const overdue = isOverdue(task);
              return (
                <li key={task.id}>
                  <Link
                    href={`/app/tasks/${task.id}`}
                    className={cn(
                      "group block rounded-2xl border border-border/70 bg-card transition-colors",
                      "hover:border-primary/35 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <div className="grid min-w-0 gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1.5fr)_auto] sm:items-start lg:grid-cols-[minmax(0,1.6fr)_minmax(7.5rem,0.65fr)_minmax(7.5rem,0.75fr)_minmax(8.5rem,0.85fr)] lg:gap-4">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span
                            className={cn(
                              "mt-1.5 size-2.5 shrink-0 rounded-full ring-2 ring-background",
                              statusDotClass(status, overdue),
                            )}
                            title={statusDotLabel(status, overdue)}
                            aria-label={statusDotLabel(status, overdue)}
                          />
                          <div className="min-w-0 space-y-1.5">
                            <p className="truncate font-heading text-[15px] font-semibold tracking-tight group-hover:text-primary">
                              {task.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <StatusBadge status={status} />
                              <PriorityBadge priority={taskPriority(task)} />
                              {overdue ? (
                                <span className="rounded-full bg-destructive/12 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-destructive uppercase">
                                  Overdue
                                </span>
                              ) : null}
                              {task.workspaceKind === "hr" ? (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                  HR
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {task.workspaceName}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Creator
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-[10px] font-semibold">
                            {personInitials(
                              task.createdByName,
                              task.createdByNestId,
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {task.createdByName ?? "Unknown"}
                            </p>
                            <p className="truncate font-mono text-[11px] text-muted-foreground">
                              {task.createdByNestId ?? "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Assignees
                        </p>
                        {task.assigneeNames.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Unassigned
                          </p>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5">
                              {task.assigneeNames.slice(0, 3).map((name) => (
                                <span
                                  key={name}
                                  title={name}
                                  className="flex size-6 items-center justify-center rounded-full border border-background bg-muted font-heading text-[10px] font-semibold"
                                >
                                  {personInitials(name)}
                                </span>
                              ))}
                            </div>
                            <p className="min-w-0 truncate text-sm">
                              {task.assigneeNames.join(", ")}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <div>
                          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                            Due
                          </p>
                          <p
                            className={cn(
                              "text-sm tabular-nums",
                              overdue
                                ? "font-semibold text-destructive"
                                : "text-foreground",
                            )}
                          >
                            {formatWhen(task.dueAt)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Created {formatWhen(task.createdAt)}
                          </p>
                        </div>
                        <div className="space-y-0.5 border-t border-border/60 pt-1.5">
                          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                            Latest update
                          </p>
                          <p
                            className="line-clamp-2 text-sm leading-snug text-foreground"
                            title={formatActivitySummary(task.lastUpdateSummary)}
                          >
                            {formatActivitySummary(task.lastUpdateSummary)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatWhenTime(task.lastUpdateAt)}
                            {task.lastUpdateBy
                              ? ` · ${task.lastUpdateBy}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <nav
            aria-label="Task list pagination"
            className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                Page{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {totalPages}
                </span>
              </span>
              <span className="hidden sm:inline" aria-hidden>
                ·
              </span>
              <label className="flex items-center gap-2">
                <span>Rows</span>
                <select
                  className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
                  value={pageSize}
                  onChange={(event) =>
                    updatePageSize(Number.parseInt(event.target.value, 10))
                  }
                  aria-label="Rows per page"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => goToPage(1)}
              >
                First
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                Previous
              </Button>
              {paginationWindow(currentPage, totalPages).map((item, index) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-1 text-sm text-muted-foreground"
                    aria-hidden
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    type="button"
                    size="sm"
                    variant={item === currentPage ? "default" : "outline"}
                    onClick={() => goToPage(item)}
                    aria-current={item === currentPage ? "page" : undefined}
                    className="min-w-9 tabular-nums"
                  >
                    {item}
                  </Button>
                ),
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                Next
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(totalPages)}
              >
                Last
              </Button>
            </div>
          </nav>
        </>
      )}
    </section>
  );
}

/** Compact page number window with ellipsis for long ranges. */
function paginationWindow(
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
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Activity log
          </h2>
          <p className="text-sm text-muted-foreground">
            Task updates and admin actions, newest first.
          </p>
        </div>
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Filter log…"
          className="h-11 w-full max-w-sm rounded-xl"
          aria-label="Filter activity log"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
        {entries.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-muted-foreground">
            No log entries match.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {entries.map((entry, index) => (
              <li
                key={entry.id}
                className={cn(
                  "flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-start sm:justify-between sm:gap-8",
                  index === 0 && "bg-primary/[0.03]",
                )}
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                        entry.source === "task"
                          ? "bg-primary/12 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {entry.source === "task" ? "Task" : "Admin"}
                    </span>
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {formatActivitySummary(entry.summary)}
                    </p>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
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
                      className="rounded-lg border border-border/80 px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary"
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
  const hoursLogged = Math.round((report.totalMinutesLogged / 60) * 10) / 10;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Performance and delivery
        </h2>
        <p className="text-sm text-muted-foreground">
          Snapshot of work, approvals, recurring load, and logged time. Refresh
          the page to update numbers.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
        <ReportStat
          label="Pending approvals"
          value={report.pendingApprovals}
          tone={report.pendingApprovals > 0 ? "warn" : "default"}
        />
        <ReportStat label="Recurring open" value={report.recurringOpen} />
        <ReportStat label="Hours logged" value={hoursLogged} />
        <ReportStat
          label="30d completion %"
          value={
            report.completionRate30d === null ? "—" : report.completionRate30d
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-border/70 bg-card">
          <header className="border-b border-border/70 px-5 py-4">
            <h3 className="font-heading text-base font-semibold">By status</h3>
          </header>
          <ul className="space-y-4 p-5">
            {report.byStatus.map((row) => (
              <li key={row.status} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{row.label}</span>
                  <span className="tabular-nums font-medium">{row.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full w-full origin-left rounded-full bg-primary motion-safe:transition-transform"
                    style={{
                      transform: `scaleX(${row.count / maxStatus})`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card">
          <header className="border-b border-border/70 px-5 py-4">
            <h3 className="font-heading text-base font-semibold">
              Workspaces
            </h3>
          </header>
          {report.byWorkspace.length === 0 ? (
            <p className="px-5 py-10 text-sm text-muted-foreground">
              No workspaces with tasks yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border/60 text-[11px] tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">Workspace</th>
                    <th className="px-3 py-3 font-medium">Open</th>
                    <th className="px-3 py-3 font-medium">Overdue</th>
                    <th className="px-3 py-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byWorkspace.map((row) => (
                    <tr
                      key={row.name}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="px-5 py-3.5 font-medium">{row.name}</td>
                      <td className="px-3 py-3.5 tabular-nums">{row.open}</td>
                      <td
                        className={cn(
                          "px-3 py-3.5 tabular-nums",
                          row.overdue > 0 && "font-medium text-destructive",
                        )}
                      >
                        {row.overdue}
                      </td>
                      <td className="px-3 py-3.5 tabular-nums text-muted-foreground">
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

      <div className="rounded-3xl border border-border/70 bg-card">
        <header className="border-b border-border/70 px-5 py-4">
          <h3 className="font-heading text-base font-semibold">
            Top creators
          </h3>
          <p className="text-xs text-muted-foreground">
            People who opened the most tasks (currently unarchived)
          </p>
        </header>
        {report.topCreators.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted-foreground">
            No creators yet.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {report.topCreators.map((row, index) => (
              <li
                key={row.name}
                className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-xs font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="truncate font-medium">{row.name}</span>
                </div>
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
  value: number | string;
  tone?: "default" | "warn";
}) {
  const numeric = typeof value === "number" ? value : null;
  return (
    <div className="rounded-2xl border border-border/70 bg-card px-4 py-3.5">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-heading text-3xl font-semibold tabular-nums tracking-tight",
          tone === "warn" && numeric !== null && numeric > 0 && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function RolesPanel({ users }: { users: DirectoryUser[] }) {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Roles
        </h2>
        <p className="text-sm text-muted-foreground">
          NestFlow application roles only. Gear roles are managed elsewhere.
        </p>
      </div>
      <ul className="space-y-2.5">
        {users.map((user) => (
          <RoleRow key={user.userId} user={user} />
        ))}
      </ul>
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
    <li className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-sm font-semibold">
            {personInitials(user.fullName, user.nestId ?? user.email)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{user.fullName ?? "Unnamed"}</p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {user.nestId ?? user.email}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {user.isActive ? "Active" : "Inactive"}
              {user.openTaskCount > 0
                ? ` · ${user.openTaskCount} open task${user.openTaskCount === 1 ? "" : "s"}`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                  aria-pressed={active}
                >
                  {roleLabel(role)}
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={save}
            className="sm:min-w-20"
          >
            Save
          </Button>
        </div>
      </div>
    </li>
  );
}
