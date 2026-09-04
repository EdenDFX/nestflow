import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { ArrowUpRightIcon } from "@/components/icons/arrow-up-right";
import { ChevronDownIcon } from "@/components/icons/chevron-down";

import { DiscussionDashboardPanel } from "@/components/discussions/discussion-dashboard-panel";
import { PriorityBadge, StatusBadge } from "@/components/tasks/status-badge";
import {
  SteppedCard,
  SteppedCardActionLink,
} from "@/components/ui/stepped-card";
import type {
  DirectoryUser,
  Invite,
  NestFlowTeam,
  TeamMembershipRow,
} from "@/lib/admin/types";
import type { NestFlowProfile } from "@/lib/auth/types";
import type {
  NestFlowTask,
  NestFlowWorkspace,
  TaskAssignee,
} from "@/lib/tasks/types";
import type { DiscussionThread } from "@/lib/tasks/discussion-queries";
import { cn } from "@/lib/utils";

type HrDashboardProps = {
  profile: NestFlowProfile;
  hrTasks: NestFlowTask[];
  employees: DirectoryUser[];
  invites: Invite[];
  teams: NestFlowTeam[];
  memberships: TeamMembershipRow[];
  workspaces: NestFlowWorkspace[];
  people: TaskAssignee[];
  canAssign: boolean;
  discussionThreads?: DiscussionThread[];
  unreadMentionCount?: number;
};

function isGeneralTeam(team: NestFlowTeam) {
  return team.slug === "general" || team.name.toLowerCase() === "general";
}

function formatDue(dueAt: string | null) {
  if (!dueAt) return "No due date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(dueAt));
}

function personLabel(person: {
  fullName?: string | null;
  nestId?: string | null;
  email?: string | null;
}) {
  return person.fullName ?? person.nestId ?? person.email ?? "Unnamed";
}

export function HrDashboard({
  profile,
  hrTasks,
  employees,
  invites,
  teams,
  memberships,
  workspaces: _workspaces,
  people: _people,
  canAssign: _canAssign,
  discussionThreads = [],
  unreadMentionCount = 0,
}: HrDashboardProps) {
  const firstName = profile.fullName?.trim().split(/\s+/)[0];

  const activeCount = employees.filter((e) => e.isActive).length;
  const inactiveCount = employees.filter((e) => !e.isActive).length;
  const pendingInvites = invites.filter((i) => i.status === "pending");
  const openHrTasks = hrTasks.filter((t) => t.status !== "completed");

  const functionalTeams = teams.filter((team) => !isGeneralTeam(team));
  const functionalTeamIds = new Set(functionalTeams.map((t) => t.id));
  const onFunctional = new Set(
    memberships
      .filter((m) => functionalTeamIds.has(m.teamId))
      .map((m) => m.userId),
  );
  const unrostered = employees.filter(
    (e) => e.isActive && !onFunctional.has(e.userId),
  );
  const teamsWithoutManager = functionalTeams.filter(
    (team) => team.managerIds.length === 0,
  );

  const queuePreview = openHrTasks.slice(0, 5);
  const invitePreview = pendingInvites.slice(0, 6);
  const placementPreview = unrostered.slice(0, 8);

  const focusItems = [
    {
      id: "teams",
      title: "Team assignment",
      subtitle:
        unrostered.length > 0
          ? `${unrostered.length} need a line-manager team`
          : "All active people are placed",
      badge: "Roster",
      href: "/app/people",
    },
    {
      id: "invites",
      title: "Invites",
      subtitle:
        pendingInvites.length > 0
          ? `${pendingInvites.length} pending`
          : "No pending invites",
      badge: "Invite",
      href: "/app/people",
    },
    {
      id: "queues",
      title: "People queues",
      subtitle:
        openHrTasks.length > 0
          ? `${openHrTasks.length} open in HR workspaces`
          : "Queues are clear",
      badge: "Queue",
      href: "/app/people",
    },
    {
      id: "status",
      title: "Employee status",
      subtitle:
        inactiveCount > 0
          ? `${inactiveCount} inactive in directory`
          : `${activeCount} active people`,
      badge: "Status",
      href: "/app/people",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            People
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back{firstName ? `, ${firstName}` : ""}. Signed in as HR.
            {profile.nestId ? ` Nest ID ${profile.nestId}.` : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/app/people"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Open people suite
            <ArrowRightIcon className="inline-flex" size={14} />
          </Link>
          <div className="flex flex-wrap gap-2">
            <StatPill label="Active" value={String(activeCount)} />
            <StatPill
              label="Invites"
              value={String(pendingInvites.length)}
              tone={pendingInvites.length > 0 ? "primary" : "muted"}
            />
            <StatPill
              label="Unrostered"
              value={String(unrostered.length)}
              tone={unrostered.length > 0 ? "warn" : "muted"}
            />
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-lg font-semibold">Focus</h2>
          <span className="rounded-full border border-primary/50 px-2.5 py-0.5 text-xs font-medium text-primary">
            {focusItems.length}
          </span>
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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-border/80 bg-card">
          <header className="flex items-center justify-between border-b border-border/80 px-5 py-4">
            <div>
              <h2 className="font-heading text-lg font-semibold">
                Placement queue
              </h2>
              <p className="text-xs text-muted-foreground">
                Active people not yet on a line-manager team.
              </p>
            </div>
            <Link
              href="/app/people"
              className="text-xs font-medium text-primary hover:underline"
            >
              Assign teams
            </Link>
          </header>

          {placementPreview.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              Everyone active is placed under a line manager.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="border-b border-border/70 text-[11px] tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Person</th>
                    <th className="px-3 py-2.5 font-medium">Department</th>
                    <th className="px-3 py-2.5 font-medium">Open tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {placementPreview.map((person) => (
                    <tr
                      key={person.userId}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium">{personLabel(person)}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {person.nestId ?? person.email}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {person.department ?? "-"}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {person.openTaskCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border/80 bg-card">
          <header className="flex items-center justify-between border-b border-border/80 px-5 py-4">
            <div>
              <h2 className="font-heading text-lg font-semibold">
                Pending invites
              </h2>
              <p className="text-xs text-muted-foreground">
                Invitations waiting to be accepted.
              </p>
            </div>
            <span className="rounded-full border border-border/80 px-2.5 py-0.5 text-xs font-medium tabular-nums">
              {pendingInvites.length}
            </span>
          </header>

          {invitePreview.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              No pending invites.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {invitePreview.map((invite) => (
                <li key={invite.id} className="px-5 py-3.5">
                  <p className="truncate text-sm font-medium">
                    {invite.fullName ?? invite.email}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {invite.email}
                    {invite.department ? ` · ${invite.department}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-border/80 px-5 py-3">
            <Link
              href="/app/people"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              Manage invites
              <ArrowRightIcon className="inline-flex" size={14} />
            </Link>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-border/80 bg-card">
          <header className="flex items-center justify-between border-b border-border/80 px-5 py-4">
            <div>
              <h2 className="font-heading text-lg font-semibold">
                People queues
              </h2>
              <p className="text-xs text-muted-foreground">
                Open work in HR workspaces.
              </p>
            </div>
            <Link
              href="/app/people"
              className="text-xs font-medium text-primary hover:underline"
            >
              All queues
            </Link>
          </header>

          {queuePreview.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              No open people-queue tasks.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {queuePreview.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/app/tasks/${task.id}`}
                    className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {task.assignees.map(personLabel).join(", ") ||
                          "Unassigned"}{" "}
                        · {formatDue(task.dueAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border/80 bg-[#141210] text-white dark:bg-[#0a0908]">
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-heading text-lg font-semibold">
                Team coverage
              </h2>
              <p className="text-xs text-white/55">
                Line-manager teams and gaps.
              </p>
            </div>
            <span className="text-xs tabular-nums text-white/50">
              {teamsWithoutManager.length} gap
              {teamsWithoutManager.length === 1 ? "" : "s"}
            </span>
          </header>

          <ul className="divide-y divide-white/10">
            {functionalTeams.map((team) => (
              <li
                key={team.id}
                className="flex items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{team.name}</p>
                  <p className="text-xs text-white/50">
                    {team.memberCount} member
                    {team.memberCount === 1 ? "" : "s"}
                    {team.managerIds.length === 0
                      ? " · needs line manager"
                      : ` · ${team.managerIds.length} line manager${team.managerIds.length === 1 ? "" : "s"}`}
                  </p>
                </div>
                {team.managerIds.length === 0 ? (
                  <span className="shrink-0 rounded bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Gap
                  </span>
                ) : (
                  <span className="shrink-0 text-[11px] text-white/40">
                    Covered
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="border-t border-white/10 px-5 py-3">
            <Link
              href="/app/people"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              Fix coverage
              <ArrowRightIcon className="inline-flex" size={14} />
            </Link>
          </div>
        </section>
      </div>

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
  tone?: "primary" | "muted" | "warn";
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/80 bg-muted/60 px-3 py-1.5">
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "warn" && "text-warning",
          tone === "primary" && "text-primary",
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
