import { isAppRole, type AppRole } from "@/lib/auth/types";
import type {
  AuditEvent,
  Department,
  DirectoryUser,
  Invite,
  WorkloadRow,
} from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/server";
import type { NestFlowTask } from "@/lib/tasks/types";
import { listTasks } from "@/lib/tasks/queries";

type ProfileRow = {
  id: string;
  nest_id: string | null;
  email: string | null;
  full_name: string | null;
  department: string | null;
  status: string | null;
  deleted_at: string | null;
};

export async function listDirectoryUsers(): Promise<DirectoryUser[]> {
  const supabase = await createClient();

  const [{ data: profiles, error: profileError }, { data: roleRows, error: roleError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, nest_id, email, full_name, department, status, deleted_at")
        .order("full_name", { ascending: true }),
      supabase.from("nf_user_roles").select("user_id, role"),
    ]);

  if (profileError) throw new Error(profileError.message);
  if (roleError) throw new Error(roleError.message);

  const rolesByUser = new Map<string, AppRole[]>();
  for (const row of roleRows ?? []) {
    if (!isAppRole(row.role)) continue;
    const list = rolesByUser.get(row.user_id) ?? [];
    list.push(row.role);
    rolesByUser.set(row.user_id, list);
  }

  const tasks = await listTasks();
  const openByUser = new Map<string, number>();
  for (const task of tasks) {
    if (task.status === "completed" || task.archivedAt) continue;
    for (const assignee of task.assignees) {
      openByUser.set(
        assignee.userId,
        (openByUser.get(assignee.userId) ?? 0) + 1,
      );
    }
  }

  return ((profiles ?? []) as ProfileRow[]).map((row) => {
    const roles = rolesByUser.get(row.id) ?? (["staff"] as AppRole[]);
    const isActive =
      row.deleted_at == null && (row.status ?? "Active") === "Active";
    return {
      userId: row.id,
      nestId: row.nest_id,
      email: row.email,
      fullName: row.full_name,
      department: row.department,
      status: row.status,
      isActive,
      roles,
      openTaskCount: openByUser.get(row.id) ?? 0,
    };
  });
}

export async function listDepartments(): Promise<Department[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_departments")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    createdAt: row.created_at,
  }));
}

export async function listInvites(): Promise<Invite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_invites")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    nestId: row.nest_id,
    fullName: row.full_name,
    department: row.department,
    roles: ((row.roles ?? []) as string[]).filter(isAppRole),
    status: row.status,
    note: row.note ?? "",
    createdAt: row.created_at,
    invitedBy: row.invited_by,
  }));
}

export async function listAuditEvents(limit = 100): Promise<AuditEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_audit_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const actorIds = [
    ...new Set(
      (data ?? [])
        .map((row) => row.actor_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const names = new Map<string, string | null>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);
    for (const row of profiles ?? []) {
      names.set(row.id, row.full_name);
    }
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_id ? (names.get(row.actor_id) ?? null) : null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    summary: row.summary,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  }));
}

export async function listManagedTeamMemberIds(
  userId: string,
  isAdmin: boolean,
): Promise<string[] | null> {
  const supabase = await createClient();

  if (isAdmin) {
    return null; // null = all members in accessible tasks
  }

  const { data: managed, error } = await supabase
    .from("nf_team_memberships")
    .select("team_id")
    .eq("user_id", userId)
    .eq("is_manager", true);

  if (error) throw new Error(error.message);
  const teamIds = (managed ?? []).map((row) => row.team_id as string);
  if (teamIds.length === 0) return [];

  const { data: members, error: memberError } = await supabase
    .from("nf_team_memberships")
    .select("user_id")
    .in("team_id", teamIds);

  if (memberError) throw new Error(memberError.message);
  return [...new Set((members ?? []).map((row) => row.user_id as string))];
}

export async function getTeamSuiteData(profile: {
  userId: string;
  roles: AppRole[];
}): Promise<{
  tasks: NestFlowTask[];
  blocked: NestFlowTask[];
  workload: WorkloadRow[];
}> {
  const isAdmin = profile.roles.includes("admin");
  const memberIds = await listManagedTeamMemberIds(profile.userId, isAdmin);
  const allTasks = await listTasks();

  const tasks =
    memberIds === null
      ? allTasks.filter((task) => !task.archivedAt)
      : allTasks.filter(
          (task) =>
            !task.archivedAt &&
            task.assignees.some((person) => memberIds.includes(person.userId)),
        );

  const blocked = tasks.filter((task) => task.status === "blocked");

  const directory = await listDirectoryUsers();
  const scopedPeople =
    memberIds === null
      ? directory
      : directory.filter((person) => memberIds.includes(person.userId));

  const now = Date.now();
  const workload: WorkloadRow[] = scopedPeople.map((person) => {
    const theirs = tasks.filter((task) =>
      task.assignees.some((assignee) => assignee.userId === person.userId),
    );
    return {
      userId: person.userId,
      fullName: person.fullName,
      nestId: person.nestId,
      email: person.email,
      openCount: theirs.filter((task) => task.status !== "completed").length,
      blockedCount: theirs.filter((task) => task.status === "blocked").length,
      overdueCount: theirs.filter(
        (task) =>
          task.status !== "completed" &&
          task.dueAt &&
          new Date(task.dueAt).getTime() < now,
      ).length,
      completedCount: theirs.filter((task) => task.status === "completed")
        .length,
    };
  });

  workload.sort((a, b) => b.openCount - a.openCount);

  return { tasks, blocked, workload };
}

export async function getHrSuiteData(): Promise<{
  hrTasks: NestFlowTask[];
  employees: DirectoryUser[];
  invites: Invite[];
}> {
  const supabase = await createClient();
  const { data: hrWorkspaces, error } = await supabase
    .from("nf_workspaces")
    .select("id")
    .eq("kind", "hr");

  if (error) throw new Error(error.message);
  const hrIds = new Set((hrWorkspaces ?? []).map((row) => row.id as string));

  const [allTasks, employees, invites] = await Promise.all([
    listTasks(),
    listDirectoryUsers(),
    listInvites(),
  ]);

  const hrTasks = allTasks.filter(
    (task) => !task.archivedAt && hrIds.has(task.workspaceId),
  );

  return { hrTasks, employees, invites };
}

export async function listWorkspacesDetailed() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_workspaces")
    .select("id, name, kind, team_id, is_archived")
    .eq("is_archived", false)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}
