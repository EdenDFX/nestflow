"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { PriorityBadge, StatusBadge } from "@/components/tasks/status-badge";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createInviteAction,
  setProfileStatusAction,
} from "@/lib/admin/actions";
import { TeamRosterPanel } from "@/components/admin/team-roster-panel";
import { TemplatesAutomationPanel } from "@/components/admin/templates-automation-panel";
import type {
  DirectoryUser,
  Invite,
  NestFlowTeam,
  TeamMembershipRow,
} from "@/lib/admin/types";
import type { AutomationRule, TaskTemplate } from "@/lib/tasks/m8-types";
import type { NestFlowTask, NestFlowWorkspace } from "@/lib/tasks/types";
import type { TaskAssignee } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type PeopleTab = "queues" | "status" | "invites" | "teams" | "templates";

export function PeopleSuite({
  hrTasks,
  employees,
  invites,
  workspaces,
  people,
  canAssign,
  canManageStatus,
  teams = [],
  memberships = [],
  templates = [],
  automationRules = [],
}: {
  hrTasks: NestFlowTask[];
  employees: DirectoryUser[];
  invites: Invite[];
  workspaces: NestFlowWorkspace[];
  people: TaskAssignee[];
  canAssign: boolean;
  canManageStatus: boolean;
  teams?: NestFlowTeam[];
  memberships?: TeamMembershipRow[];
  templates?: TaskTemplate[];
  automationRules?: AutomationRule[];
}) {
  const [tab, setTab] = useState<PeopleTab>("queues");
  const [query, setQuery] = useState("");
  const hrWorkspaceIds = useMemo(
    () => new Set(workspaces.filter((w) => w.kind === "hr").map((w) => w.id)),
    [workspaces],
  );

  const filteredEmployees = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((user) =>
      [user.fullName, user.email, user.nestId, user.department, user.status]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q)),
    );
  }, [employees, query]);

  const tabs = (
    [
      ["queues", `Queues (${hrTasks.length})`],
      ["status", "Employee status"],
      ["teams", "Teams"],
      ["templates", "Templates & automation"],
      ["invites", `Invites (${invites.filter((i) => i.status === "pending").length})`],
    ] as const
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            People tasks
          </h1>
          <p className="text-muted-foreground">
            HR queues, team rosters, employee status, and invite coordination.
          </p>
        </div>
        {hrWorkspaceIds.size > 0 ? (
          <TaskCreateDialog
            workspaces={workspaces.filter((w) => w.kind === "hr")}
            people={people}
            canAssign={canAssign}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
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

      {tab === "queues" ? (
        <div className="space-y-2">
          {hrTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open people/HR workspace tasks yet. Create one to start an
              onboarding or compliance queue.
            </p>
          ) : (
            hrTasks.map((task) => (
              <Link
                key={task.id}
                href={`/app/tasks/${task.id}`}
                className="block rounded-xl border border-border/80 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <p className="font-medium">{task.title}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {task.assignees
                    .map(
                      (person) =>
                        person.fullName ?? person.nestId ?? person.email,
                    )
                    .join(", ") || "Unassigned"}
                  {task.dueAt
                    ? ` · Due ${new Date(task.dueAt).toLocaleDateString()}`
                    : ""}
                </p>
              </Link>
            ))
          )}
        </div>
      ) : null}

      {tab === "status" ? (
        <div className="space-y-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search employees…"
            className="max-w-md"
          />
          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Employee</th>
                  <th className="px-3 py-2 font-medium">Department</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Open tasks</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((user) => (
                  <EmployeeStatusRow
                    key={user.userId}
                    user={user}
                    canManageStatus={canManageStatus}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "teams" ? (
        <TeamRosterPanel
          teams={teams}
          memberships={memberships}
          users={employees}
        />
      ) : null}

      {tab === "templates" ? (
        <TemplatesAutomationPanel
          templates={templates}
          rules={automationRules}
          workspaces={workspaces}
        />
      ) : null}

      {tab === "invites" ? <HrInvitesPanel invites={invites} /> : null}
    </div>
  );
}

function EmployeeStatusRow({
  user,
  canManageStatus,
}: {
  user: DirectoryUser;
  canManageStatus: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <tr className="border-b border-border/60">
      <td className="px-3 py-2.5">
        <p className="font-medium">{user.fullName ?? "Unnamed"}</p>
        <p className="text-xs text-muted-foreground">
          {user.nestId ? `${user.nestId} · ` : ""}
          {user.email}
        </p>
      </td>
      <td className="px-3 py-2.5">{user.department ?? "-"}</td>
      <td className="px-3 py-2.5">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs",
            user.isActive
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-muted text-muted-foreground",
          )}
        >
          {user.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-3 py-2.5">{user.openTaskCount}</td>
      <td className="px-3 py-2.5">
        {canManageStatus ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await setProfileStatusAction({
                  userId: user.userId,
                  status: user.isActive ? "Inactive" : "Active",
                });
                if (!result.ok) {
                  toast.error(result.error ?? "Could not update status.");
                  return;
                }
                toast.success(
                  user.isActive ? "Employee deactivated." : "Employee activated.",
                );
                router.refresh();
              });
            }}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </Button>
        ) : (
          "-"
        )}
      </td>
    </tr>
  );
}

function HrInvitesPanel({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [nestId, setNestId] = useState("");
  const [fullName, setFullName] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="space-y-3 rounded-xl border border-border/80 p-4">
        <h2 className="font-heading text-lg font-semibold">Invite staff</h2>
        <div className="space-y-2">
          <Label htmlFor="hr-invite-email">Work email</Label>
          <Input
            id="hr-invite-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hr-invite-nest">Nest ID</Label>
          <Input
            id="hr-invite-nest"
            value={nestId}
            onChange={(event) => setNestId(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hr-invite-name">Full name</Label>
          <Input
            id="hr-invite-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>
        <Button
          type="button"
          disabled={pending || !email.trim()}
          onClick={() => {
            startTransition(async () => {
              const result = await createInviteAction({
                email,
                nestId: nestId || undefined,
                fullName: fullName || undefined,
                roles: ["staff"],
              });
              if (!result.ok) {
                toast.error(result.error ?? "Could not create invite.");
                return;
              }
              setEmail("");
              setNestId("");
              setFullName("");
              toast.success("Invite created.");
              router.refresh();
            });
          }}
        >
          Send invite
        </Button>
      </div>
      <ul className="space-y-2">
        {invites.map((invite) => (
          <li
            key={invite.id}
            className="rounded-xl border border-border/80 px-4 py-3"
          >
            <p className="font-medium">{invite.email}</p>
            <p className="text-xs text-muted-foreground">
              {invite.status}
              {invite.nestId ? ` · ${invite.nestId}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
