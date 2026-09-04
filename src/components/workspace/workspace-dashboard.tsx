import Link from "next/link";

import { ArrowUpRightIcon } from "@/components/icons/arrow-up-right";

import { NotesCreateDialog, PersonalNotesPanel } from "@/components/notes/personal-notes-panel";
import { DiscussionDashboardPanel } from "@/components/discussions/discussion-dashboard-panel";
import { StatusBadge } from "@/components/tasks/status-badge";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { TaskDueTimer } from "@/components/tasks/task-due-timer";
import { WorkspaceRecentTasks } from "@/components/workspace/workspace-recent-tasks";
import { roleLabel, type AppRole, type NestFlowProfile } from "@/lib/auth/types";
import type { PersonalNote } from "@/lib/notes/types";
import type { DiscussionThread } from "@/lib/tasks/discussion-shared";
import type {
  NestFlowTask,
  NestFlowWorkspace,
  TaskAssignee,
  TaskCounters,
  TaskStatus,
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
  canCreateTasks?: boolean;
  notes?: PersonalNote[];
  discussionThreads?: DiscussionThread[];
  unreadMentionCount?: number;
};

const statusPriority: Record<TaskStatus, number> = {
  blocked: 0,
  review: 1,
  in_progress: 2,
  todo: 3,
  backlog: 4,
  completed: 5,
};

function pickPriorityTask(tasks: NestFlowTask[]): NestFlowTask | null {
  const active = tasks.filter(
    (task) => task.status !== "completed" && task.status !== "backlog",
  );

  if (active.length === 0) {
    return null;
  }

  const now = Date.now();

  return [...active].sort((left, right) => {
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
  })[0];
}

export function WorkspaceDashboard({
  profile,
  role,
  tasks,
  counters,
  workspaces,
  people,
  canAssign,
  canCreateTasks = true,
  notes = [],
  discussionThreads = [],
  unreadMentionCount = 0,
}: WorkspaceDashboardProps) {
  const firstName = profile.fullName?.split(" ")[0];
  const priorityTask = pickPriorityTask(tasks);

  const welcomeParts = [
    firstName ? `Welcome back, ${firstName}` : "Welcome back",
    roleLabel(role),
    profile.nestId ?? null,
  ].filter(Boolean);

  const quickLinks = [
    {
      id: "my",
      title: "My assignments",
      href: "/app/my-tasks",
    },
    {
      id: "board",
      title: "Work board",
      href: "/app/work?view=board",
    },
    {
      id: "list",
      title: "Work list",
      href: "/app/work?view=list",
    },
    {
      id: "calendar",
      title: "Calendar",
      href: "/app/calendar",
    },
  ].filter((item) => {
    if (role === "admin" && (item.id === "board" || item.id === "list")) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              {welcomeParts.join(" · ")}
            </p>
          </div>

          <p className="text-sm font-medium text-foreground">
            {counters.open} open · {counters.inProgress} in progress ·{" "}
            {counters.blocked} blocked
            {counters.overdue > 0 ? ` · ${counters.overdue} overdue` : null}
          </p>

          <div className="flex flex-wrap gap-2">
            <StatPill label="Open" value={String(counters.open)} tone="primary" />
            <StatPill
              label="In progress"
              value={String(counters.inProgress)}
              tone="success"
            />
            <StatPill
              label="Blocked"
              value={String(counters.blocked)}
              tone="danger"
            />
          </div>
        </div>

        <div className="shrink-0">
          {canCreateTasks ? (
            <TaskCreateDialog
              workspaces={workspaces}
              people={people}
              canAssign={canAssign}
              defaultAssigneeId={profile.userId}
            />
          ) : (
            <NotesCreateDialog />
          )}
        </div>
      </div>

      {priorityTask ? (
        <Link
          href={`/app/tasks/${priorityTask.id}`}
          className="group flex flex-col gap-3 rounded-[1.75rem] border border-border/80 bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Needs attention
            </p>
            <p className="truncate font-heading text-xl font-semibold tracking-tight group-hover:underline">
              {priorityTask.title}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={priorityTask.status} />
            <TaskDueTimer
              dueAt={priorityTask.dueAt}
              status={priorityTask.status}
              tone="surface"
            />
            <span className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-foreground">
              <ArrowUpRightIcon className="inline-flex" size={16} aria-hidden />
            </span>
          </div>
        </Link>
      ) : null}

      <WorkspaceRecentTasks tasks={tasks} />

      <section className="space-y-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick links
        </h2>
        <nav
          aria-label="Workspace quick links"
          className="flex flex-wrap gap-2"
        >
          {quickLinks.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.title}
              <ArrowUpRightIcon className="inline-flex opacity-70" size={14} aria-hidden />
            </Link>
          ))}
        </nav>
      </section>

      {!canCreateTasks ? <PersonalNotesPanel notes={notes} /> : null}

      <DiscussionDashboardPanel
        threads={discussionThreads}
        unreadMentionCount={unreadMentionCount}
      />
    </div>
  );
}

function StatPill({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string;
  tone?: "primary" | "success" | "danger";
}) {
  const dotClass =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "danger"
        ? "bg-red-500"
        : "bg-primary";

  return (
    <div className="flex items-center gap-2 rounded-full border border-border/80 bg-muted/60 px-3 py-1.5">
      <span className={cn("size-2 shrink-0 rounded-full", dotClass)} aria-hidden />
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
