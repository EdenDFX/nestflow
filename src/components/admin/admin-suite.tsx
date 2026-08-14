"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DeactivateUserButton } from "@/components/admin/deactivate-user-button";
import { TeamRosterPanel } from "@/components/admin/team-roster-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createDepartmentAction,
  createInviteAction,
  deleteDepartmentAction,
  revokeInviteAction,
  setProfileDepartmentAction,
  setUserRolesAction,
} from "@/lib/admin/actions";
import { PERMISSION_MATRIX } from "@/lib/admin/types";
import type {
  AuditEvent,
  Department,
  DirectoryUser,
  Invite,
  NestFlowTeam,
  TeamMembershipRow,
} from "@/lib/admin/types";
import type { NestFlowTask, TaskAssignee } from "@/lib/tasks/types";
import { APP_ROLES, roleLabel, type AppRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

type AdminTab =
  | "users"
  | "teams"
  | "departments"
  | "permissions"
  | "audit"
  | "invites";

export function AdminSuite({
  users,
  departments,
  invites,
  auditEvents,
  teams,
  memberships,
  people = [],
  openByUser = {},
  embedded = false,
}: {
  users: DirectoryUser[];
  departments: Department[];
  invites: Invite[];
  auditEvents: AuditEvent[];
  teams: NestFlowTeam[];
  memberships: TeamMembershipRow[];
  people?: TaskAssignee[];
  openByUser?: Record<string, NestFlowTask[]>;
  embedded?: boolean;
}) {
  const [tab, setTab] = useState<AdminTab>("users");
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [user.fullName, user.email, user.nestId, user.department]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q)),
    );
  }, [users, query]);

  const filteredAudit = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return auditEvents;
    return auditEvents.filter((event) =>
      [event.action, event.summary, event.actorName, event.entityType]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q)),
    );
  }, [auditEvents, query]);

  return (
    <div className="space-y-6">
      {embedded ? (
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            People
          </h2>
          <p className="text-sm text-muted-foreground">
            Users, teams, departments, permissions, invites, and audit history.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Admin
          </h1>
          <p className="text-muted-foreground">
            Users, teams, departments, permissions, invites, and audit history.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["users", "Users"],
            ["teams", "Teams"],
            ["invites", "Invites"],
            ["departments", "Departments"],
            ["permissions", "Permissions"],
            ["audit", "Audit log"],
          ] as const
        ).map(([id, label]) => (
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

      {tab === "users" || tab === "audit" ? (
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            tab === "users" ? "Search people…" : "Filter audit events…"
          }
          className="max-w-md"
        />
      ) : null}

      {tab === "users" ? (
        <UsersPanel
          users={filteredUsers}
          departments={departments}
          people={people}
          openByUser={openByUser}
        />
      ) : null}
      {tab === "teams" ? (
        <TeamRosterPanel
          teams={teams}
          memberships={memberships}
          users={users}
        />
      ) : null}
      {tab === "invites" ? <InvitesPanel invites={invites} /> : null}
      {tab === "departments" ? (
        <DepartmentsPanel departments={departments} />
      ) : null}
      {tab === "permissions" ? <PermissionsPanel /> : null}
      {tab === "audit" ? <AuditPanel events={filteredAudit} /> : null}
    </div>
  );
}

function UsersPanel({
  users,
  departments,
  people,
  openByUser,
}: {
  users: DirectoryUser[];
  departments: Department[];
  people: TaskAssignee[];
  openByUser: Record<string, NestFlowTask[]>;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Person</th>
            <th className="px-3 py-2 font-medium">Department</th>
            <th className="px-3 py-2 font-medium">Roles</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Open</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow
              key={user.userId}
              user={user}
              departments={departments}
              people={people}
              openTasks={openByUser[user.userId] ?? []}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({
  user,
  departments,
  people,
  openTasks,
}: {
  user: DirectoryUser;
  departments: Department[];
  people: TaskAssignee[];
  openTasks: NestFlowTask[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [roles, setRoles] = useState<AppRole[]>(user.roles);
  const [department, setDepartment] = useState(user.department ?? "");

  function saveRoles() {
    startTransition(async () => {
      const result = await setUserRolesAction({
        userId: user.userId,
        roles,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not update roles.");
        return;
      }
      toast.success("Roles updated.");
      router.refresh();
    });
  }

  function saveDepartment() {
    startTransition(async () => {
      const result = await setProfileDepartmentAction({
        userId: user.userId,
        department,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not update department.");
        return;
      }
      toast.success("Department updated.");
      router.refresh();
    });
  }

  function toggleRole(role: AppRole) {
    setRoles((current) => {
      if (current.includes(role)) {
        const next = current.filter((item) => item !== role);
        return next.length > 0 ? next : current;
      }
      return [...current, role];
    });
  }

  return (
    <tr className="border-b border-border/60 align-top">
      <td className="px-3 py-3">
        <p className="font-medium">{user.fullName ?? "Unnamed"}</p>
        <p className="text-xs text-muted-foreground">
          {user.nestId ? `${user.nestId} · ` : ""}
          {user.email}
        </p>
      </td>
      <td className="px-3 py-3">
        <div className="flex min-w-40 flex-col gap-2">
          <Select
            value={department || "__none__"}
            onValueChange={(value) =>
              setDepartment(value === "__none__" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={saveDepartment}
          >
            Save dept
          </Button>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {APP_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              disabled={pending}
              onClick={() => toggleRole(role)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px]",
                roles.includes(role)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              {roleLabel(role)}
            </button>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          className="mt-2"
          disabled={pending}
          onClick={saveRoles}
        >
          Save roles
        </Button>
      </td>
      <td className="px-3 py-3">
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
      <td className="px-3 py-3">{user.openTaskCount}</td>
      <td className="px-3 py-3">
        <DeactivateUserButton
          user={user}
          openTasks={openTasks}
          people={people}
        />
      </td>
    </tr>
  );
}

function DepartmentsPanel({ departments }: { departments: Department[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function create() {
    startTransition(async () => {
      const result = await createDepartmentAction({ name, description });
      if (!result.ok) {
        toast.error(result.error ?? "Could not create department.");
        return;
      }
      setName("");
      setDescription("");
      toast.success("Department created.");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-3 rounded-xl border border-border/80 p-4">
        <h2 className="font-heading text-lg font-semibold">Add department</h2>
        <div className="space-y-2">
          <Label htmlFor="dept-name">Name</Label>
          <Input
            id="dept-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dept-desc">Description</Label>
          <Input
            id="dept-desc"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <Button type="button" disabled={pending || !name.trim()} onClick={create}>
          Create
        </Button>
      </div>
      <ul className="space-y-2">
        {departments.map((dept) => (
          <li
            key={dept.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/80 px-4 py-3"
          >
            <div>
              <p className="font-medium">{dept.name}</p>
              <p className="text-xs text-muted-foreground">
                {dept.description || dept.slug}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await deleteDepartmentAction(dept.id);
                  if (!result.ok) {
                    toast.error(result.error ?? "Could not delete.");
                    return;
                  }
                  toast.success("Department deleted.");
                  router.refresh();
                });
              }}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InvitesPanel({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [nestId, setNestId] = useState("");
  const [fullName, setFullName] = useState("");

  function create() {
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
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="space-y-3 rounded-xl border border-border/80 p-4">
        <h2 className="font-heading text-lg font-semibold">Invite employee</h2>
        <p className="text-xs text-muted-foreground">
          Records the invite and sends a Supabase invite email when the service
          role key is configured.
        </p>
        <div className="space-y-2">
          <Label htmlFor="invite-email">Work email</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-nest">Nest ID</Label>
          <Input
            id="invite-nest"
            value={nestId}
            onChange={(event) => setNestId(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-name">Full name</Label>
          <Input
            id="invite-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>
        <Button type="button" disabled={pending || !email.trim()} onClick={create}>
          Send invite
        </Button>
      </div>
      <ul className="space-y-2">
        {invites.length === 0 ? (
          <li className="text-sm text-muted-foreground">No invites yet.</li>
        ) : (
          invites.map((invite) => (
            <li
              key={invite.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/80 px-4 py-3"
            >
              <div>
                <p className="font-medium">{invite.email}</p>
                <p className="text-xs text-muted-foreground">
                  {invite.status}
                  {invite.nestId ? ` · ${invite.nestId}` : ""}
                  {invite.fullName ? ` · ${invite.fullName}` : ""}
                </p>
              </div>
              {invite.status === "pending" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await revokeInviteAction(invite.id);
                      if (!result.ok) {
                        toast.error(result.error ?? "Could not revoke.");
                        return;
                      }
                      toast.success("Invite revoked.");
                      router.refresh();
                    });
                  }}
                >
                  Revoke
                </Button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function PermissionsPanel() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Capability</th>
            <th className="px-3 py-2 font-medium">Admin</th>
            <th className="px-3 py-2 font-medium">Line Manager</th>
            <th className="px-3 py-2 font-medium">HR</th>
            <th className="px-3 py-2 font-medium">Staff</th>
          </tr>
        </thead>
        <tbody>
          {PERMISSION_MATRIX.map((row) => (
            <tr key={row.capability} className="border-b border-border/60">
              <td className="px-3 py-2.5">{row.capability}</td>
              <td className="px-3 py-2.5">{row.admin ? "Yes" : "-"}</td>
              <td className="px-3 py-2.5">{row.lineManager ? "Yes" : "-"}</td>
              <td className="px-3 py-2.5">{row.hr ? "Yes" : "-"}</td>
              <td className="px-3 py-2.5">{row.staff ? "Yes" : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-2 text-xs text-muted-foreground">
        Matrix mirrors ADR-003. Server actions and RLS enforce these boundaries.
      </p>
    </div>
  );
}

function AuditPanel({ events }: { events: AuditEvent[] }) {
  return (
    <div className="space-y-2">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No audit events yet.</p>
      ) : (
        events.map((event) => (
          <div
            key={event.id}
            className="rounded-xl border border-border/80 px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium">{event.summary}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(event.createdAt).toLocaleString()}
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {event.action} · {event.entityType}
              {event.actorName ? ` · ${event.actorName}` : ""}
            </p>
          </div>
        ))
      )}
      <p className="pt-2 text-xs text-muted-foreground">
        <Link href="/app/admin" className="underline-offset-2 hover:underline">
          Refresh
        </Link>{" "}
        after admin actions to see the latest entries.
      </p>
    </div>
  );
}
