"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Filter,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { TaskDueTimer } from "@/components/tasks/task-due-timer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SteppedCard,
  SteppedCardActionLink,
  isSteppedCardLightTone,
  type SteppedCardTone,
} from "@/components/ui/stepped-card";
import { UserAvatars } from "@/components/ui/user-avatars";
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

/** Card surface by task status (To Do green, Blocked red, Review yellow, Completed grey). */
function toneForStatus(status: TaskStatus): SteppedCardTone {
  switch (status) {
    case "todo":
      return "todo";
    case "blocked":
      return "blocked";
    case "review":
      return "review";
    case "completed":
      return "completed";
    case "in_progress":
      return "primary";
    case "backlog":
      return "ink";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

type WorkspaceDashboardProps = {
  profile: NestFlowProfile;
  role: AppRole;
  tasks: NestFlowTask[];
  counters: TaskCounters;
  workspaces: NestFlowWorkspace[];
  people: TaskAssignee[];
  canAssign: boolean;
};

function personInitials(person: {
  fullName?: string | null;
  nestId?: string | null;
  email?: string | null;
}) {
  const source = person.fullName?.trim() || person.nestId || person.email || "NF";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

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
  ].filter((item) => {
    // Admin home skips Board and List; those views are for staff and line managers.
    if (role === "admin" && (item.id === "board" || item.id === "list")) {
      return false;
    }
    return true;
  });

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
          {focusItems.map((item, index) => {
            const tone = index % 2 === 0 ? "primary" : "ink";
            const onPrimary = tone === "primary";

            return (
              <SteppedCard
                key={item.id}
                tone={tone}
                cornerActions={
                  <SteppedCardActionLink
                    href={item.href}
                    aria-label={`Open ${item.title}`}
                  >
                    <ArrowUpRight className="size-4" />
                  </SteppedCardActionLink>
                }
              >
                <div className="space-y-4">
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full text-sm font-semibold",
                      onPrimary
                        ? "bg-[#1c1917]/10 text-[#1c1917]"
                        : "bg-white/10 text-white",
                    )}
                  >
                    {item.badge.slice(0, 1)}
                  </div>
                  <div className="space-y-1.5 pe-2">
                    <h3 className="font-heading text-xl font-semibold tracking-tight">
                      {item.title}
                    </h3>
                    <p
                      className={cn(
                        "text-sm",
                        onPrimary ? "text-[#1c1917]/70" : "text-white/65",
                      )}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                      onPrimary
                        ? "border-[#1c1917]/15 bg-white/35 text-[#1c1917]"
                        : "border-white/15 bg-white/10 text-white",
                    )}
                  >
                    {item.badge}
                    <ChevronDown className="size-3.5 opacity-70" aria-hidden />
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      onPrimary ? "text-[#1c1917]/55" : "text-white/50",
                    )}
                  >
                    NestFlow
                  </span>
                </div>
              </SteppedCard>
            );
          })}
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
            <div className="col-span-full rounded-[1.75rem] border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
              No tasks yet. Create your first NestFlow task to populate this
              workspace.
            </div>
          ) : (
            visibleTasks.map((task) => {
              const tone = toneForStatus(task.status);
              const onLight = isSteppedCardLightTone(tone);
              const lead = task.assignees[0];
              const avatarUsers = task.assignees.map((assignee) => ({
                id: assignee.userId,
                name:
                  assignee.fullName?.trim() ||
                  assignee.nestId ||
                  assignee.email ||
                  "Someone",
                image: assignee.avatarUrl,
              }));
              const greyed = task.status === "completed";

              return (
                <SteppedCard
                  key={task.id}
                  tone={tone}
                  className={cn(greyed && "grayscale-[0.35]")}
                  cornerActions={
                    <SteppedCardActionLink
                      href={`/app/tasks/${task.id}`}
                      aria-label={`Open ${task.title}`}
                    >
                      <ArrowUpRight className="size-4" />
                    </SteppedCardActionLink>
                  }
                >
                  <div className="space-y-3">
                    {lead ? (
                      <Avatar className="size-10 ring-2 ring-black/10 dark:ring-white/10">
                        {lead.avatarUrl ? (
                          <AvatarImage src={lead.avatarUrl} alt="" />
                        ) : null}
                        <AvatarFallback
                          className={cn(
                            "text-xs font-semibold",
                            onLight
                              ? "bg-[#1c1917] text-white"
                              : "bg-white/20 text-white",
                          )}
                        >
                          {personInitials(lead)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="size-10 ring-2 ring-black/10 dark:ring-white/10">
                        <AvatarFallback
                          className={cn(
                            "text-xs font-semibold",
                            onLight
                              ? "bg-[#1c1917] text-white"
                              : "bg-white/20 text-white",
                          )}
                        >
                          NF
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className="space-y-2 pe-2">
                      <h3 className="font-heading text-xl font-semibold tracking-tight">
                        <Link
                          href={`/app/tasks/${task.id}`}
                          className="hover:underline"
                        >
                          {task.title}
                        </Link>
                      </h3>

                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        {avatarUsers.length > 0 ? (
                          <UserAvatars
                            users={avatarUsers}
                            size={22}
                            maxVisible={3}
                            overlap={55}
                            focusScale={1.18}
                            isOverlapOnly
                            tooltipPlacement="top"
                            inverted={!onLight}
                          />
                        ) : (
                          <span
                            className={cn(
                              "text-[11px] font-medium",
                              onLight ? "text-[#1c1917]/60" : "text-white/55",
                            )}
                          >
                            Unassigned
                          </span>
                        )}
                        <TaskDueTimer
                          dueAt={task.dueAt}
                          status={task.status}
                          tone={
                            onLight
                              ? tone === "completed"
                                ? "surface"
                                : "on-primary"
                              : "on-ink"
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex min-w-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                        onLight
                          ? "border-[#1c1917]/15 bg-white/40 text-[#1c1917]"
                          : "border-white/20 bg-white/10 text-white",
                        greyed && "border-border/60 bg-background/40",
                      )}
                    >
                      {lead ? (
                        <Avatar className="size-4" size="sm">
                          {lead.avatarUrl ? (
                            <AvatarImage src={lead.avatarUrl} alt="" />
                          ) : null}
                          <AvatarFallback className="bg-black/20 text-[7px]">
                            {personInitials(lead)}
                          </AvatarFallback>
                        </Avatar>
                      ) : null}
                      <span className="truncate">
                        {STATUS_LABELS[task.status]}
                      </span>
                      <ChevronDown
                        className="size-3.5 shrink-0 opacity-70"
                        aria-hidden
                      />
                    </span>
                  </div>
                </SteppedCard>
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
