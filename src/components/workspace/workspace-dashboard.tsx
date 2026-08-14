import { ArrowDownRightIcon } from "@/components/icons/arrow-down-right";
import { ArrowUpRightIcon } from "@/components/icons/arrow-up-right";
import { ChevronDownIcon } from "@/components/icons/chevron-down";

import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import {
  SteppedCard,
  SteppedCardActionLink,
} from "@/components/ui/stepped-card";
import { WorkspaceRecentTasks } from "@/components/workspace/workspace-recent-tasks";
import { roleLabel, type AppRole, type NestFlowProfile } from "@/lib/auth/types";
import type {
  NestFlowTask,
  NestFlowWorkspace,
  TaskAssignee,
  TaskCounters,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

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
  const firstName = profile.fullName?.split(" ")[0];

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
      title: "Work board",
      subtitle: "Move work across statuses",
      badge: "Board",
      href: "/app/work?view=board",
    },
    {
      id: "list",
      title: "Work list",
      subtitle: "Sort, filter, and bulk update",
      badge: "List",
      href: "/app/work?view=list",
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
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
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
          {focusItems.map((item) => {
            return (
              <SteppedCard
                key={item.id}
                tone="muted"
                cornerActions={
                  <SteppedCardActionLink
                    href={item.href}
                    aria-label={`Open ${item.title}`}
                  >
                    <ArrowUpRightIcon className="inline-flex" />
                  </SteppedCardActionLink>
                }
              >
                <div className="space-y-4">
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                    {item.badge.slice(0, 1)}
                  </div>
                  <div className="space-y-1.5 pe-2">
                    <h3 className="font-heading text-xl font-semibold tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/70 px-3 py-1.5 text-xs font-medium">
                    {item.badge}
                    <ChevronDownIcon className="inline-flex opacity-70" size={14} aria-hidden />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    NestFlow
                  </span>
                </div>
              </SteppedCard>
            );
          })}
        </div>
      </section>

      <WorkspaceRecentTasks tasks={tasks} />
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
          <ArrowUpRightIcon className="inline-flex" size={12} />
        ) : (
          <ArrowDownRightIcon className="inline-flex" size={12} />
        )}
      </span>
    </div>
  );
}
