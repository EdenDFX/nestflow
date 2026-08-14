import { isAppRole, type AppRole } from "@/lib/auth/types";
import type {
  AuditEvent,
  AdminReportSnapshot,
  Department,
  DirectoryUser,
  Invite,
  NestFlowTeam,
  OversightLogEntry,
  OversightTaskRow,
  TeamMembershipRow,
  WorkloadRow,
} from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/server";
import { getDeliveryReportExtras, sumTimeMinutesByUser } from "@/lib/tasks/m8-queries";
import type { NestFlowTask, TaskAssignee } from "@/lib/tasks/types";
import { STATUS_LABELS, type TaskStatus } from "@/lib/tasks/types";
import { listAssignablePeople, listTasks } from "@/lib/tasks/queries";
import { groupOpenTasksByAssignee } from "@/lib/tasks/open-by-assignee";

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

export type ManagedTeamSummary = {
  id: string;
  name: string;
  slug: string;
};

/**
 * Admins see the org-wide scope (null member list).
 * Line managers only see people on teams they manage (is_manager).
 */
export async function listManagedTeamMemberIds(
  userId: string,
  isAdmin: boolean,
): Promise<string[] | null> {
  if (isAdmin) {
    return null; // null = org-wide
  }

  const teams = await listManagedTeamsForUser(userId);
  const teamIds = teams.map((team) => team.id);
  if (teamIds.length === 0) return [];

  const supabase = await createClient();
  const { data: members, error: memberError } = await supabase
    .from("nf_team_memberships")
    .select("user_id")
    .in("team_id", teamIds);

  if (memberError) throw new Error(memberError.message);
  return [...new Set((members ?? []).map((row) => row.user_id as string))];
}

export async function listManagedTeamsForUser(
  userId: string,
): Promise<ManagedTeamSummary[]> {
  const supabase = await createClient();
  const { data: managed, error } = await supabase
    .from("nf_team_memberships")
    .select("team_id")
    .eq("user_id", userId)
    .eq("is_manager", true);

  if (error) throw new Error(error.message);
  const teamIds = (managed ?? []).map((row) => row.team_id as string);
  if (teamIds.length === 0) return [];

  const { data: teams, error: teamError } = await supabase
    .from("nf_teams")
    .select("id, name, slug")
    .in("id", teamIds)
    .eq("is_archived", false)
    .order("name");

  if (teamError) throw new Error(teamError.message);
  return (teams ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
  }));
}

export async function listAssignablePeopleForProfile(profile: {
  userId: string;
  roles: AppRole[];
}): Promise<TaskAssignee[]> {
  const people = await listAssignablePeople();

  // Admins can assign anyone.
  if (profile.roles.includes("admin")) {
    return people;
  }

  // HR may only assign themselves, admins, and line managers (not staff).
  if (profile.roles.includes("hr")) {
    const privilegedIds = await listUserIdsWithRoles([
      "admin",
      "line_manager",
    ]);
    privilegedIds.add(profile.userId);
    return people.filter((person) => privilegedIds.has(person.userId));
  }

  if (profile.roles.includes("line_manager")) {
    const memberIds = await listManagedTeamMemberIds(profile.userId, false);
    if (!memberIds || memberIds.length === 0) {
      return people.filter((person) => person.userId === profile.userId);
    }
    return people.filter((person) => memberIds.includes(person.userId));
  }

  return people.filter((person) => person.userId === profile.userId);
}

/** Active NestFlow users that have any of the given roles. */
export async function listUserIdsWithRoles(
  roles: AppRole[],
): Promise<Set<string>> {
  if (roles.length === 0) return new Set();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_user_roles")
    .select("user_id, role")
    .in("role", roles);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((row) => row.user_id as string));
}

export async function listTeamsWithRoster(): Promise<{
  teams: NestFlowTeam[];
  memberships: TeamMembershipRow[];
}> {
  const supabase = await createClient();
  const [{ data: teams, error: teamError }, { data: rows, error: memError }] =
    await Promise.all([
      supabase
        .from("nf_teams")
        .select("id, name, slug, is_archived")
        .eq("is_archived", false)
        .order("name"),
      supabase
        .from("nf_team_memberships")
        .select("id, team_id, user_id, is_manager"),
    ]);

  if (teamError) throw new Error(teamError.message);
  if (memError) throw new Error(memError.message);

  const userIds = [
    ...new Set((rows ?? []).map((row) => row.user_id as string)),
  ];
  const profilesById = new Map<
    string,
    {
      full_name: string | null;
      nest_id: string | null;
      email: string | null;
    }
  >();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, nest_id, email")
      .in("id", userIds);
    if (profileError) throw new Error(profileError.message);
    for (const profile of profiles ?? []) {
      profilesById.set(profile.id, profile);
    }
  }

  const teamNameById = new Map(
    (teams ?? []).map((team) => [team.id as string, team.name as string]),
  );

  const memberships: TeamMembershipRow[] = (rows ?? [])
    .filter((row) => teamNameById.has(row.team_id as string))
    .map((row) => {
      const profile = profilesById.get(row.user_id as string);
      return {
        id: row.id as string,
        teamId: row.team_id as string,
        teamName: teamNameById.get(row.team_id as string) ?? "Team",
        userId: row.user_id as string,
        fullName: profile?.full_name ?? null,
        nestId: profile?.nest_id ?? null,
        email: profile?.email ?? null,
        isManager: Boolean(row.is_manager),
      };
    })
    .sort((a, b) => {
      if (a.teamName !== b.teamName) return a.teamName.localeCompare(b.teamName);
      if (a.isManager !== b.isManager) return a.isManager ? -1 : 1;
      return (a.fullName ?? a.email ?? "").localeCompare(
        b.fullName ?? b.email ?? "",
      );
    });

  const countByTeam = new Map<string, number>();
  const managersByTeam = new Map<string, string[]>();
  for (const row of memberships) {
    countByTeam.set(row.teamId, (countByTeam.get(row.teamId) ?? 0) + 1);
    if (row.isManager) {
      const list = managersByTeam.get(row.teamId) ?? [];
      list.push(row.userId);
      managersByTeam.set(row.teamId, list);
    }
  }

  return {
    teams: (teams ?? []).map((team) => ({
      id: team.id as string,
      name: team.name as string,
      slug: team.slug as string,
      isArchived: Boolean(team.is_archived),
      memberCount: countByTeam.get(team.id as string) ?? 0,
      managerIds: managersByTeam.get(team.id as string) ?? [],
    })),
    memberships,
  };
}

export async function getTeamSuiteData(profile: {
  userId: string;
  roles: AppRole[];
}): Promise<{
  tasks: NestFlowTask[];
  blocked: NestFlowTask[];
  workload: WorkloadRow[];
  managedTeams: ManagedTeamSummary[];
  isOrgWide: boolean;
}> {
  const isAdmin = profile.roles.includes("admin");
  const roster = isAdmin ? await listTeamsWithRoster() : null;
  const managedTeams: ManagedTeamSummary[] = isAdmin
    ? (roster?.teams ?? []).map((team) => ({
        id: team.id,
        name: team.name,
        slug: team.slug,
      }))
    : await listManagedTeamsForUser(profile.userId);
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

  const managerIdSet = new Set<string>();
  if (roster) {
    for (const membership of roster.memberships) {
      if (membership.isManager) managerIdSet.add(membership.userId);
    }
  } else if (managedTeams.length > 0) {
    const supabase = await createClient();
    const { data: managerRows } = await supabase
      .from("nf_team_memberships")
      .select("user_id")
      .in(
        "team_id",
        managedTeams.map((team) => team.id),
      )
      .eq("is_manager", true);
    for (const row of managerRows ?? []) {
      managerIdSet.add(row.user_id as string);
    }
  }

  const now = Date.now();
  const minutesByUser = await sumTimeMinutesByUser(
    scopedPeople.map((person) => person.userId),
  );
  const workload: WorkloadRow[] = scopedPeople.map((person) => {
    const theirs = tasks.filter((task) =>
      task.assignees.some((assignee) => assignee.userId === person.userId),
    );
    const openTasks = theirs.filter((task) => task.status !== "completed");
    const focusTask =
      openTasks.find((task) => task.status === "in_progress") ??
      openTasks[0] ??
      null;

    return {
      userId: person.userId,
      fullName: person.fullName,
      nestId: person.nestId,
      email: person.email,
      department: person.department,
      openCount: openTasks.length,
      blockedCount: theirs.filter((task) => task.status === "blocked").length,
      overdueCount: theirs.filter(
        (task) =>
          task.status !== "completed" &&
          task.dueAt &&
          new Date(task.dueAt).getTime() < now,
      ).length,
      completedCount: theirs.filter((task) => task.status === "completed")
        .length,
      minutesLogged: minutesByUser.get(person.userId) ?? 0,
      isManager: managerIdSet.has(person.userId),
      focusTaskId: focusTask?.id ?? null,
      focusTaskTitle: focusTask?.title ?? null,
      focusTaskStatus: focusTask?.status ?? null,
    };
  });

  workload.sort((a, b) => {
    if (Boolean(a.isManager) !== Boolean(b.isManager)) {
      return a.isManager ? -1 : 1;
    }
    return b.openCount - a.openCount;
  });

  return {
    tasks,
    blocked,
    workload,
    managedTeams,
    isOrgWide: memberIds === null,
  };
}

export async function getHrSuiteData(): Promise<{
  hrTasks: NestFlowTask[];
  employees: DirectoryUser[];
  invites: Invite[];
  openByUser: Record<string, NestFlowTask[]>;
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

  return {
    hrTasks,
    employees,
    invites,
    openByUser: groupOpenTasksByAssignee(allTasks),
  };
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

function personLabel(profile: {
  full_name?: string | null;
  nest_id?: string | null;
  email?: string | null;
} | null | undefined): string {
  if (!profile) return "Unknown";
  return (
    profile.full_name?.trim() ||
    profile.nest_id ||
    profile.email ||
    "Unknown"
  );
}

function startOfDaysAgo(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Administrator oversight: every open/historical non-archived task with creator,
 * timeframe, assignees, latest update, plus combined log and simple report stats.
 */
export async function getAdminOversightData(): Promise<{
  tasks: OversightTaskRow[];
  log: OversightLogEntry[];
  report: AdminReportSnapshot;
  users: DirectoryUser[];
}> {
  const supabase = await createClient();
  const [tasks, workspaces, auditEvents, users] = await Promise.all([
    listTasks({ includeArchived: false }),
    listWorkspacesDetailed(),
    listAuditEvents(120),
    listDirectoryUsers(),
  ]);

  const workspaceById = new Map(
    (workspaces as { id: string; name: string; kind: string }[]).map((row) => [
      row.id,
      {
        name: row.name as string,
        kind: row.kind === "hr" ? ("hr" as const) : ("general" as const),
      },
    ]),
  );

  const creatorIds = [...new Set(tasks.map((task) => task.createdBy))];
  const profilesById = new Map<
    string,
    { full_name: string | null; nest_id: string | null; email: string | null }
  >();

  if (creatorIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, nest_id, email")
      .in("id", creatorIds);
    if (profileError) throw new Error(profileError.message);
    for (const profile of profiles ?? []) {
      profilesById.set(profile.id, profile);
    }
  }

  const taskIds = tasks.map((task) => task.id);
  const lastByTask = new Map<
    string,
    { summary: string; at: string; actorId: string | null }
  >();
  const recentActivity: {
    id: string;
    task_id: string;
    actor_id: string | null;
    event_type: string;
    summary: string;
    created_at: string;
  }[] = [];

  if (taskIds.length > 0) {
    const { data: activityRows, error: activityError } = await supabase
      .from("nf_activity_events")
      .select("id, task_id, actor_id, event_type, summary, created_at")
      .in("task_id", taskIds)
      .order("created_at", { ascending: false })
      .limit(300);
    if (activityError) throw new Error(activityError.message);
    recentActivity.push(...((activityRows ?? []) as typeof recentActivity));

    for (const row of recentActivity) {
      if (!lastByTask.has(row.task_id)) {
        lastByTask.set(row.task_id, {
          summary: row.summary as string,
          at: row.created_at as string,
          actorId: (row.actor_id as string | null) ?? null,
        });
      }
    }
  }

  const activityActorIds = [
    ...new Set(
      recentActivity
        .map((row) => row.actor_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  for (const id of activityActorIds) {
    if (!profilesById.has(id)) {
      // load later in batch
    }
  }
  const missingActorIds = activityActorIds.filter((id) => !profilesById.has(id));
  if (missingActorIds.length > 0) {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, nest_id, email")
      .in("id", missingActorIds);
    if (error) throw new Error(error.message);
    for (const profile of profiles ?? []) {
      profilesById.set(profile.id, profile);
    }
  }

  const taskTitleById = new Map(tasks.map((task) => [task.id, task.title]));

  const oversightTasks: OversightTaskRow[] = tasks.map((task) => {
    const creator = profilesById.get(task.createdBy);
    const workspace = workspaceById.get(task.workspaceId);
    const last = lastByTask.get(task.id);
    return {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      workspaceName: workspace?.name ?? "Workspace",
      workspaceKind: workspace?.kind ?? "general",
      createdById: task.createdBy,
      createdByName: creator?.full_name ?? null,
      createdByNestId: creator?.nest_id ?? null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      dueAt: task.dueAt,
      completedAt: task.completedAt,
      assigneeNames: task.assignees.map(
        (person) =>
          person.fullName ?? person.nestId ?? person.email ?? "Unnamed",
      ),
      lastUpdateSummary: last?.summary ?? null,
      lastUpdateAt: last?.at ?? task.updatedAt,
      lastUpdateBy: last?.actorId
        ? personLabel(profilesById.get(last.actorId))
        : null,
    };
  });

  const activityLog: OversightLogEntry[] = recentActivity.slice(0, 120).map(
    (row) => ({
      id: `task-${row.id}`,
      source: "task" as const,
      at: row.created_at,
      actorName: row.actor_id
        ? personLabel(profilesById.get(row.actor_id))
        : null,
      summary: row.summary,
      detail: row.event_type.replaceAll("_", " "),
      taskId: row.task_id,
      taskTitle: taskTitleById.get(row.task_id) ?? null,
    }),
  );

  const auditLog: OversightLogEntry[] = auditEvents.map((event) => ({
    id: `admin-${event.id}`,
    source: "admin" as const,
    at: event.createdAt,
    actorName: event.actorName,
    summary: event.summary,
    detail: event.action.replaceAll("_", " "),
    taskId: event.entityType === "task" ? event.entityId : null,
    taskTitle: null,
  }));

  const log = [...activityLog, ...auditLog].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  const now = Date.now();
  const weekAgo = startOfDaysAgo(7).getTime();
  const openTasks = tasks.filter((task) => task.status !== "completed");

  const statusOrder: TaskStatus[] = [
    "backlog",
    "todo",
    "in_progress",
    "blocked",
    "review",
    "completed",
  ];
  const byStatus = statusOrder.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: tasks.filter((task) => task.status === status).length,
  }));

  const byWorkspaceMap = new Map<
    string,
    { name: string; open: number; total: number; overdue: number }
  >();
  for (const task of tasks) {
    const name = workspaceById.get(task.workspaceId)?.name ?? "Workspace";
    const bucket = byWorkspaceMap.get(name) ?? {
      name,
      open: 0,
      total: 0,
      overdue: 0,
    };
    bucket.total += 1;
    if (task.status !== "completed") {
      bucket.open += 1;
      if (task.dueAt && new Date(task.dueAt).getTime() < now) {
        bucket.overdue += 1;
      }
    }
    byWorkspaceMap.set(name, bucket);
  }

  const creatorCounts = new Map<string, number>();
  for (const task of tasks) {
    const name = personLabel(profilesById.get(task.createdBy));
    creatorCounts.set(name, (creatorCounts.get(name) ?? 0) + 1);
  }
  const topCreators = [...creatorCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const delivery = await getDeliveryReportExtras(tasks);

  const report: AdminReportSnapshot = {
    totalTasks: tasks.length,
    openTasks: openTasks.length,
    overdue: openTasks.filter(
      (task) => task.dueAt !== null && new Date(task.dueAt).getTime() < now,
    ).length,
    blocked: openTasks.filter((task) => task.status === "blocked").length,
    unassignedOpen: openTasks.filter((task) => task.assignees.length === 0)
      .length,
    completedLast7Days: tasks.filter(
      (task) =>
        task.completedAt !== null &&
        new Date(task.completedAt).getTime() >= weekAgo,
    ).length,
    createdLast7Days: tasks.filter(
      (task) => new Date(task.createdAt).getTime() >= weekAgo,
    ).length,
    updatedLast7Days: tasks.filter(
      (task) => new Date(task.updatedAt).getTime() >= weekAgo,
    ).length,
    byStatus,
    byWorkspace: [...byWorkspaceMap.values()].sort((a, b) => b.open - a.open),
    topCreators,
    pendingApprovals: delivery.pendingApprovals,
    recurringOpen: delivery.recurringOpen,
    totalMinutesLogged: delivery.totalMinutesLogged,
    approvedCompleted: delivery.approvedCompleted,
    completionRate30d: delivery.completionRate30d,
  };

  return { tasks: oversightTasks, log, report, users };
}

export async function getAdminSuiteData(): Promise<{
  users: DirectoryUser[];
  departments: Department[];
  invites: Invite[];
  auditEvents: AuditEvent[];
  teams: NestFlowTeam[];
  memberships: TeamMembershipRow[];
  people: TaskAssignee[];
  openByUser: Record<string, NestFlowTask[]>;
}> {
  const [users, departments, invites, auditEvents, roster, people, tasks] =
    await Promise.all([
      listDirectoryUsers(),
      listDepartments(),
      listInvites(),
      listAuditEvents(120),
      listTeamsWithRoster(),
      listAssignablePeople(),
      listTasks(),
    ]);

  return {
    users,
    departments,
    invites,
    auditEvents,
    teams: roster.teams,
    memberships: roster.memberships,
    people,
    openByUser: groupOpenTasksByAssignee(tasks),
  };
}

