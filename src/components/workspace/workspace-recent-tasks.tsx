"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ArrowUpRightIcon } from "@/components/icons/arrow-up-right";
import { SearchIcon } from "@/components/icons/search";

import { StatusBadge } from "@/components/tasks/status-badge";
import { TaskDueTimer } from "@/components/tasks/task-due-timer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SteppedCard,
  SteppedCardActionLink,
  type SteppedCardTone,
} from "@/components/ui/stepped-card";
import { UserAvatars } from "@/components/ui/user-avatars";
import { openCommandPalette } from "@/lib/search/types";
import {
  type NestFlowTask,
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

const statusPriority: Record<TaskStatus, number> = {
  blocked: 0,
  review: 1,
  in_progress: 2,
  todo: 3,
  backlog: 4,
  completed: 5,
};

function sortTasksForHome(tasks: NestFlowTask[]): NestFlowTask[] {
  const now = Date.now();

  return [...tasks].sort((left, right) => {
    const statusDiff = statusPriority[left.status] - statusPriority[right.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }

    const leftDue = left.dueAt ? new Date(left.dueAt).getTime() : null;
    const rightDue = right.dueAt ? new Date(right.dueAt).getTime() : null;
    const leftOverdue = leftDue !== null && leftDue < now;
    const rightOverdue = rightDue !== null && rightDue < now;

    if (leftOverdue !== rightOverdue) {
      return leftOverdue ? -1 : 1;
    }

    if (leftDue !== null && rightDue !== null && leftDue !== rightDue) {
      return leftDue - rightDue;
    }

    if (leftDue !== null) {
      return -1;
    }

    if (rightDue !== null) {
      return 1;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

/** Card surface by task status (To Do neutral, Blocked red, Review yellow, Completed green). */
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

type WorkspaceRecentTasksProps = {
  tasks: NestFlowTask[];
};

export function WorkspaceRecentTasks({ tasks }: WorkspaceRecentTasksProps) {
  const [taskFilter, setTaskFilter] = useState<StatusFilter>("All");

  const visibleTasks = useMemo(() => {
    const sorted = sortTasksForHome(tasks);
    const filtered =
      taskFilter === "All"
        ? sorted
        : sorted.filter((task) => task.status === filterToStatus[taskFilter]);
    return filtered.slice(0, 8);
  }, [taskFilter, tasks]);

  return (
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
            return (
              <SteppedCard
                key={task.id}
                tone={tone}
                cornerActions={
                  <SteppedCardActionLink
                    href={`/app/tasks/${task.id}`}
                    aria-label={`Open ${task.title}`}
                  >
                    <ArrowUpRightIcon className="inline-flex" />
                  </SteppedCardActionLink>
                }
              >
                <div className="space-y-3">
                  {lead ? (
                    <Avatar className="size-10 ring-2 ring-black/10 dark:ring-white/10">
                      {lead.avatarUrl ? (
                        <AvatarImage src={lead.avatarUrl} alt="" />
                      ) : null}
                      <AvatarFallback className="bg-foreground/10 text-xs font-semibold text-foreground">
                        {personInitials(lead)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="size-10 ring-2 ring-black/10 dark:ring-white/10">
                      <AvatarFallback className="bg-foreground/10 text-xs font-semibold text-foreground">
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
                        />
                      ) : (
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                      <TaskDueTimer
                        dueAt={task.dueAt}
                        status={task.status}
                        tone="surface"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={task.status} />
                </div>
              </SteppedCard>
            );
          })
        )}
      </div>
    </section>
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
      <button
        type="button"
        className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Search tasks and people"
        onClick={() => openCommandPalette()}
      >
        <SearchIcon className="inline-flex" size={14} />
      </button>
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
