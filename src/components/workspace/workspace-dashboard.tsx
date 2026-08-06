"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { roleLabel, type AppRole, type NestFlowProfile } from "@/lib/auth/types";
import {
  STATUS_LABELS,
  type NestFlowTask,
  type NestFlowWorkspace,
  type TaskAssignee,
  type TaskCounters,
  type TaskStatus,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

const statusFilters = [
  "All",
  "To Do",
  "In Progress",
  "Blocked",
  "Review",
] as const;

type StatusFilter = (typeof statusFilters)[number];

const filterToStatus: Record<Exclude<StatusFilter, "All">, TaskStatus> = {
  "To Do": "todo",
  "In Progress": "in_progress",
  Blocked: "blocked",
  Review: "review",
};

type WorkspaceDashboardProps = {
  profile: NestFlowProfile;
  role: AppRole;
  tasks: NestFlowTask[];
  counters: TaskCounters;
  workspaces: NestFlowWorkspace[];
  people: TaskAssignee[];
  canAssign: boolean;
};

export function WorkspaceDashboard({
  profile,
  role,
  tasks,
  counters,
  workspaces,
  people,
  canAssign,
}: WorkspaceDashboardProps) {
  const [taskFilter, setTaskFilter] = useState<StatusFilter>("All");
  const firstName = profile.fullName?.split(" ")[0];

  const visibleTasks = useMemo(() => {
    const filtered =
      taskFilter === "All"
        ? tasks
        : tasks.filter((task) => task.status === filterToStatus[taskFilter]);
    return filtered.slice(0, 8);
  }, [taskFilter, tasks]);

  const focusItems = [
    {
      id: "my",
      title: "My assignments",
      subtitle: `${counters.open} open on your plate`,
      badge: "Assigned",
      href: "/app/my-tasks",
    },
    {
      id: "board",
      title: "Board",
      subtitle: "Move work across statuses",
      badge: "Board",
      href: "/app/board",
    },
    {
      id: "list",
      title: "List view",
      subtitle: "Sort and filter densely",
      badge: "List",
      href: "/app/list",
    },
    {
      id: "overdue",
      title: "Overdue",
      subtitle:
        counters.overdue > 0
          ? `${counters.overdue} need attention`
          : "Nothing overdue",
      badge: "Due",
      href: "/app/my-tasks",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-semibold tracking-tight uppercase sm:text-5xl">
            Workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back{firstName ? `, ${firstName}` : ""}. Signed in as{" "}
            {roleLabel(role)}.
            {profile.nestId ? ` Nest ID ${profile.nestId}.` : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <TaskCreateDialog
            workspaces={workspaces}
            people={people}
            canAssign={canAssign}
            defaultAssigneeId={profile.userId}
          />

          <div className="flex flex-wrap gap-2">
            <StatPill label="Open" value={String(counters.open)} trend="up" />
            <StatPill
              label="In progress"
              value={String(counters.inProgress)}
              trend="up"
              tone="success"
            />
            <StatPill
              label="Blocked"
              value={String(counters.blocked)}
              trend="down"
              tone="danger"
            />
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-semibold">Focus</h2>
            <span className="rounded-full border border-primary/50 px-2.5 py-0.5 text-xs font-medium text-primary">
              {focusItems.length}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {focusItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="relative overflow-hidden rounded-[1.5rem] border border-border/80 bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {item.badge.slice(0, 1)}
              </div>
              <h3 className="mt-4 font-heading text-base font-semibold">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">NestFlow</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground/80">
                  {item.badge}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-semibold">Recent tasks</h2>
            <span className="rounded-full border border-primary/50 px-2.5 py-0.5 text-xs font-medium text-primary">
              {visibleTasks.length}
            </span>
          </div>
          <FilterRow
            filters={statusFilters}
            active={taskFilter}
            onChange={setTaskFilter}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {visibleTasks.length === 0 ? (
            <div className="col-span-full rounded-[1.5rem] border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
              No tasks yet. Create your first NestFlow task to populate this
              workspace.
            </div>
          ) : (
            visibleTasks.map((task, index) => {
              const accent = index === 0;
              return (
                <article
                  key={task.id}
                  className={cn(
                    "flex min-h-[180px] flex-col justify-between rounded-[1.5rem] border p-4",
                    accent
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/80 bg-card",
                  )}
                >
                  <div className="space-y-2">
                    <p
                      className={cn(
                        "text-xs font-medium",
                        accent
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {task.dueAt
                        ? `Due ${new Date(task.dueAt).toLocaleDateString()}`
                        : "No due date"}{" "}
                      · {task.priority}
                    </p>
                    <h3 className="font-heading text-lg font-semibold tracking-tight">
                      {task.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium",
                        accent
                          ? "bg-black/20 text-primary-foreground"
                          : "bg-muted text-foreground/80",
                      )}
                    >
                      {STATUS_LABELS[task.status]}
                    </span>
                    <Link
                      href={`/app/tasks/${task.id}`}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium",
                        accent
                          ? "bg-white text-black"
                          : "border border-border hover:bg-accent",
                      )}
                    >
                      Open
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function StatPill({
  label,
  value,
  trend,
  tone = "primary",
}: {
  label: string;
  value: string;
  trend: "up" | "down";
  tone?: "primary" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
      : tone === "danger"
        ? "bg-red-500/15 text-red-600 dark:text-red-300"
        : "bg-primary/15 text-primary";

  return (
    <div className="flex items-center gap-2 rounded-full border border-border/80 bg-muted/60 px-3 py-1.5">
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "inline-flex size-5 items-center justify-center rounded-full",
          toneClass,
        )}
      >
        {trend === "up" ? (
          <ArrowUpRight className="size-3" />
        ) : (
          <ArrowDownRight className="size-3" />
        )}
      </span>
    </div>
  );
}

function FilterRow<T extends string>({
  filters,
  active,
  onChange,
}: {
  filters: readonly T[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground">
        <Search className="size-3.5" />
      </span>
      <span className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground">
        <Filter className="size-3.5" />
      </span>
      {filters.map((filter) => {
        const isActive = filter === active;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onChange(filter)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "border border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
