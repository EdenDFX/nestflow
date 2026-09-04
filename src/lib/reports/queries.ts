import {
  listDepartments,
  listDirectoryUsers,
  listManagedTeamMemberIds,
  listUserIdsWithRoles,
} from "@/lib/admin/queries";
import type { AppRole, NestFlowProfile } from "@/lib/auth/types";
import {
  addCalendarDays,
  lagosYmd,
  resolvePeriodBounds,
} from "@/lib/reports/period";
import type {
  PeriodBounds,
  PeriodReport,
  PeriodReportSummary,
  ReportBucket,
  ReportPeriodKind,
  ReportTaskDetail,
  StaffPeriodStats,
  LineManagerWeeklyReport,
  LineManagerWeeklyStats,
  LmBlockListItem,
} from "@/lib/reports/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type TaskRow = {
  id: string;
  workspace_id: string;
  title: string;
  status: string;
  due_at: string | null;
  blocked_reason: string | null;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type AssigneeRow = {
  task_id: string;
  user_id: string;
};

type TimeRow = {
  user_id: string;
  minutes: number;
  logged_at: string;
};

type PersonRow = {
  userId: string;
  fullName: string | null;
  nestId: string | null;
  email: string | null;
  department: string | null;
};

type WorkspaceRow = {
  id: string;
  name: string;
};

function inRange(iso: string | null | undefined, start: Date, end: Date) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

function isOpenStatus(status: string) {
  return status !== "completed";
}

function wasOnTime(dueAt: string | null, completedAt: string | null) {
  if (!dueAt) return true;
  if (!completedAt) return false;
  return new Date(completedAt).getTime() <= new Date(dueAt).getTime();
}

function emptyStats(person: PersonRow): StaffPeriodStats {
  return {
    userId: person.userId,
    fullName: person.fullName,
    nestId: person.nestId,
    email: person.email,
    department: person.department,
    reportKind: "staff",
    assigned: 0,
    completed: 0,
    completedOnTime: 0,
    missed: 0,
    overdue: 0,
    blocked: 0,
    created: 0,
    updated: 0,
    minutesLogged: 0,
    avgCycleHours: null,
    onTimeRate: null,
    details: [],
  };
}

function buildBuckets(period: PeriodBounds): ReportBucket[] {
  if (period.kind === "daily") {
    return [
      {
        key: period.endingDate,
        label: period.endingDate.slice(5),
        completed: 0,
        missed: 0,
      },
    ];
  }

  const buckets: ReportBucket[] = [];
  let cursor = lagosYmd(period.start);
  const last = period.endingDate;
  while (cursor <= last) {
    buckets.push({
      key: cursor,
      label: cursor.slice(5),
      completed: 0,
      missed: 0,
    });
    cursor = addCalendarDays(cursor, 1);
  }
  return buckets;
}

function bucketKeyForInstant(iso: string, period: PeriodBounds): string {
  if (period.kind === "daily") return period.endingDate;
  return lagosYmd(new Date(iso));
}

export function aggregateStaffPeriod(params: {
  period: PeriodBounds;
  people: PersonRow[];
  tasks: TaskRow[];
  assignees: AssigneeRow[];
  timeEntries: TimeRow[];
  workspaces: WorkspaceRow[];
}): PeriodReport {
  const { period, people, tasks, assignees, timeEntries, workspaces } = params;
  const workspaceName = new Map(workspaces.map((w) => [w.id, w.name]));
  const tasksById = new Map(tasks.map((t) => [t.id, t]));
  const assigneesByUser = new Map<string, string[]>();
  for (const row of assignees) {
    const list = assigneesByUser.get(row.user_id) ?? [];
    list.push(row.task_id);
    assigneesByUser.set(row.user_id, list);
  }

  const minutesByUser = new Map<string, number>();
  for (const row of timeEntries) {
    if (!inRange(row.logged_at, period.start, period.end)) continue;
    minutesByUser.set(
      row.user_id,
      (minutesByUser.get(row.user_id) ?? 0) + (row.minutes ?? 0),
    );
  }

  const buckets = buildBuckets(period);
  const bucketIndex = new Map(buckets.map((b, i) => [b.key, i]));

  const staff: StaffPeriodStats[] = people.map((person) => {
    const stats = emptyStats(person);
    stats.minutesLogged = minutesByUser.get(person.userId) ?? 0;
    const taskIds = [...new Set(assigneesByUser.get(person.userId) ?? [])];
    const cycleMs: number[] = [];
    const detailKeys = new Set<string>();

    const pushDetail = (detail: ReportTaskDetail) => {
      const key = `${detail.kind}:${detail.id}`;
      if (detailKeys.has(key)) return;
      detailKeys.add(key);
      stats.details.push(detail);
    };

    for (const taskId of taskIds) {
      const task = tasksById.get(taskId);
      if (!task) continue;

      if (inRange(task.created_at, period.start, period.end)) {
        stats.created += 1;
      }
      if (inRange(task.updated_at, period.start, period.end)) {
        stats.updated += 1;
      }

      const completedInPeriod =
        task.status === "completed" &&
        inRange(task.completed_at, period.start, period.end);

      if (completedInPeriod && task.completed_at) {
        stats.completed += 1;
        if (wasOnTime(task.due_at, task.completed_at)) {
          stats.completedOnTime += 1;
        }
        const created = new Date(task.created_at).getTime();
        const completed = new Date(task.completed_at).getTime();
        if (completed >= created) {
          cycleMs.push(completed - created);
        }
        const bKey = bucketKeyForInstant(task.completed_at, period);
        const idx = bucketIndex.get(bKey);
        if (idx != null) buckets[idx]!.completed += 1;
        pushDetail({
          id: task.id,
          title: task.title,
          workspaceName: workspaceName.get(task.workspace_id) ?? null,
          status: task.status,
          dueAt: task.due_at,
          completedAt: task.completed_at,
          blockedReason: task.blocked_reason,
          kind: "completed",
        });
      }

      // Missed: due in period and not completed on time.
      if (
        task.due_at &&
        inRange(task.due_at, period.start, period.end) &&
        !wasOnTime(task.due_at, task.completed_at)
      ) {
        stats.missed += 1;
        const bKey = bucketKeyForInstant(task.due_at, period);
        const idx = bucketIndex.get(bKey);
        if (idx != null) buckets[idx]!.missed += 1;
        pushDetail({
          id: task.id,
          title: task.title,
          workspaceName: workspaceName.get(task.workspace_id) ?? null,
          status: task.status,
          dueAt: task.due_at,
          completedAt: task.completed_at,
          blockedReason: task.blocked_reason,
          kind: "missed",
        });
      }

      // Still overdue at period end: open + due before end.
      if (
        !task.archived_at &&
        isOpenStatus(task.status) &&
        task.due_at &&
        new Date(task.due_at).getTime() < period.end.getTime()
      ) {
        stats.overdue += 1;
        pushDetail({
          id: task.id,
          title: task.title,
          workspaceName: workspaceName.get(task.workspace_id) ?? null,
          status: task.status,
          dueAt: task.due_at,
          completedAt: task.completed_at,
          blockedReason: task.blocked_reason,
          kind: "overdue",
        });
      }

      if (!task.archived_at && task.status === "blocked") {
        stats.blocked += 1;
        pushDetail({
          id: task.id,
          title: task.title,
          workspaceName: workspaceName.get(task.workspace_id) ?? null,
          status: task.status,
          dueAt: task.due_at,
          completedAt: task.completed_at,
          blockedReason: task.blocked_reason,
          kind: "blocked",
        });
      }
    }

    if (cycleMs.length > 0) {
      const avg =
        cycleMs.reduce((sum, value) => sum + value, 0) / cycleMs.length;
      stats.avgCycleHours = Math.round((avg / (1000 * 60 * 60)) * 10) / 10;
    }

    const denom = stats.completedOnTime + stats.missed;
    stats.onTimeRate =
      denom === 0 ? null : Math.round((stats.completedOnTime / denom) * 100);

    stats.details.sort((a, b) => a.title.localeCompare(b.title));
    return stats;
  });

  staff.sort((a, b) => {
    const left = a.fullName ?? a.email ?? a.userId;
    const right = b.fullName ?? b.email ?? b.userId;
    return left.localeCompare(right);
  });

  const summary = summarizeStaff(staff);

  return {
    period,
    scope: "org",
    summary,
    staff,
    buckets,
  };
}

function summarizeStaff(staff: StaffPeriodStats[]): PeriodReportSummary {
  let completed = 0;
  let missed = 0;
  let overdue = 0;
  let blocked = 0;
  let minutesLogged = 0;
  let onTime = 0;
  let onTimeDenom = 0;

  for (const row of staff) {
    completed += row.completed;
    missed += row.missed;
    overdue += row.overdue;
    blocked += row.blocked;
    minutesLogged += row.minutesLogged;
    onTime += row.completedOnTime;
    onTimeDenom += row.completedOnTime + row.missed;
  }

  return {
    staffCount: staff.length,
    completed,
    missed,
    overdue,
    blocked,
    minutesLogged,
    onTimeRate:
      onTimeDenom === 0 ? null : Math.round((onTime / onTimeDenom) * 100),
  };
}

async function loadReportPeople(
  profile: NestFlowProfile,
): Promise<{ people: PersonRow[]; scope: "org" | "team" }> {
  const isOrgWide =
    profile.roles.includes("admin") || profile.roles.includes("hr");

  if (isOrgWide) {
    const directory = await listDirectoryUsers();
    return {
      scope: "org",
      people: directory
        .filter((user) => user.isActive)
        .map((user) => ({
          userId: user.userId,
          fullName: user.fullName,
          nestId: user.nestId,
          email: user.email,
          department: user.department,
        })),
    };
  }

  const memberIds = await listManagedTeamMemberIds(profile.userId, false);
  const directory = await listDirectoryUsers();
  const allowed = new Set(memberIds ?? []);
  return {
    scope: "team",
    people: directory
      .filter((user) => user.isActive && allowed.has(user.userId))
      .map((user) => ({
        userId: user.userId,
        fullName: user.fullName,
        nestId: user.nestId,
        email: user.email,
        department: user.department,
      })),
  };
}

async function fetchReportRawData(
  userIds: string[],
  period: PeriodBounds,
  system: boolean,
): Promise<{
  tasks: TaskRow[];
  assignees: AssigneeRow[];
  timeEntries: TimeRow[];
  workspaces: WorkspaceRow[];
}> {
  if (userIds.length === 0) {
    return { tasks: [], assignees: [], timeEntries: [], workspaces: [] };
  }

  if (system) {
    const admin = createAdminClient();
    if (!admin) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for system reports.");
    }

    const { data: assigneeRows, error: assigneeError } = await admin
      .schema("nestflow")
      .from("task_assignees")
      .select("task_id, user_id")
      .in("user_id", userIds);
    if (assigneeError) throw new Error(assigneeError.message);

    const assignees = (assigneeRows ?? []) as AssigneeRow[];
    const taskIds = [...new Set(assignees.map((row) => row.task_id))];
    if (taskIds.length === 0) {
      const { data: timeRows } = await admin
        .schema("nestflow")
        .from("time_entries")
        .select("user_id, minutes, logged_at")
        .in("user_id", userIds)
        .gte("logged_at", period.start.toISOString())
        .lt("logged_at", period.end.toISOString());
      return {
        tasks: [],
        assignees: [],
        timeEntries: (timeRows ?? []) as TimeRow[],
        workspaces: [],
      };
    }

    const [{ data: taskRows, error: taskError }, { data: timeRows }, { data: wsRows }] =
      await Promise.all([
        admin
          .schema("nestflow")
          .from("tasks")
          .select(
            "id, workspace_id, title, status, due_at, blocked_reason, completed_at, archived_at, created_at, updated_at",
          )
          .in("id", taskIds),
        admin
          .schema("nestflow")
          .from("time_entries")
          .select("user_id, minutes, logged_at")
          .in("user_id", userIds)
          .gte("logged_at", period.start.toISOString())
          .lt("logged_at", period.end.toISOString()),
        admin.schema("nestflow").from("workspaces").select("id, name"),
      ]);

    if (taskError) throw new Error(taskError.message);

    return {
      tasks: (taskRows ?? []) as TaskRow[],
      assignees,
      timeEntries: (timeRows ?? []) as TimeRow[],
      workspaces: (wsRows ?? []) as WorkspaceRow[],
    };
  }

  const supabase = await createClient();
  const { data: assigneeRows, error: assigneeError } = await supabase
    .from("nf_task_assignees")
    .select("task_id, user_id")
    .in("user_id", userIds);
  if (assigneeError) throw new Error(assigneeError.message);

  const assignees = (assigneeRows ?? []) as AssigneeRow[];
  const taskIds = [...new Set(assignees.map((row) => row.task_id))];

  if (taskIds.length === 0) {
    const { data: timeRows } = await supabase
      .from("nf_time_entries")
      .select("user_id, minutes, logged_at")
      .in("user_id", userIds)
      .gte("logged_at", period.start.toISOString())
      .lt("logged_at", period.end.toISOString());
    return {
      tasks: [],
      assignees: [],
      timeEntries: (timeRows ?? []) as TimeRow[],
      workspaces: [],
    };
  }

  const [{ data: taskRows, error: taskError }, { data: timeRows }, { data: wsRows }] =
    await Promise.all([
      supabase
        .from("nf_tasks")
        .select(
          "id, workspace_id, title, status, due_at, blocked_reason, completed_at, archived_at, created_at, updated_at",
        )
        .in("id", taskIds),
      supabase
        .from("nf_time_entries")
        .select("user_id, minutes, logged_at")
        .in("user_id", userIds)
        .gte("logged_at", period.start.toISOString())
        .lt("logged_at", period.end.toISOString()),
      supabase.from("nf_workspaces").select("id, name"),
    ]);

  if (taskError) throw new Error(taskError.message);

  return {
    tasks: (taskRows ?? []) as TaskRow[],
    assignees,
    timeEntries: (timeRows ?? []) as TimeRow[],
    workspaces: (wsRows ?? []) as WorkspaceRow[],
  };
}

async function fetchManagerAssignmentData(
  managerIds: string[],
  period: PeriodBounds,
  system: boolean,
): Promise<{
  assignments: AssigneeMetaRow[];
  tasks: TaskRow[];
  workspaces: WorkspaceRow[];
}> {
  if (managerIds.length === 0) {
    return { assignments: [], tasks: [], workspaces: [] };
  }

  if (system) {
    const admin = createAdminClient();
    if (!admin) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for system reports.");
    }

    const { data: rows, error } = await admin
      .schema("nestflow")
      .from("task_assignees")
      .select("task_id, user_id, assigned_at, assigned_by")
      .in("assigned_by", managerIds)
      .gte("assigned_at", period.start.toISOString())
      .lt("assigned_at", period.end.toISOString());
    if (error) throw new Error(error.message);

    const assignments = (rows ?? []) as AssigneeMetaRow[];
    const taskIds = [...new Set(assignments.map((row) => row.task_id))];
    if (taskIds.length === 0) {
      return { assignments, tasks: [], workspaces: [] };
    }

    const [{ data: taskRows, error: taskError }, { data: wsRows }] =
      await Promise.all([
        admin
          .schema("nestflow")
          .from("tasks")
          .select(
            "id, workspace_id, title, status, due_at, blocked_reason, completed_at, archived_at, created_at, updated_at",
          )
          .in("id", taskIds),
        admin.schema("nestflow").from("workspaces").select("id, name"),
      ]);
    if (taskError) throw new Error(taskError.message);

    return {
      assignments,
      tasks: (taskRows ?? []) as TaskRow[],
      workspaces: (wsRows ?? []) as WorkspaceRow[],
    };
  }

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("nf_task_assignees")
    .select("task_id, user_id, assigned_at, assigned_by")
    .in("assigned_by", managerIds)
    .gte("assigned_at", period.start.toISOString())
    .lt("assigned_at", period.end.toISOString());
  if (error) throw new Error(error.message);

  const assignments = (rows ?? []) as AssigneeMetaRow[];
  const taskIds = [...new Set(assignments.map((row) => row.task_id))];
  if (taskIds.length === 0) {
    return { assignments, tasks: [], workspaces: [] };
  }

  const [{ data: taskRows, error: taskError }, { data: wsRows }] =
    await Promise.all([
      supabase
        .from("nf_tasks")
        .select(
          "id, workspace_id, title, status, due_at, blocked_reason, completed_at, archived_at, created_at, updated_at",
        )
        .in("id", taskIds),
      supabase.from("nf_workspaces").select("id, name"),
    ]);
  if (taskError) throw new Error(taskError.message);

  return {
    assignments,
    tasks: (taskRows ?? []) as TaskRow[],
    workspaces: (wsRows ?? []) as WorkspaceRow[],
  };
}

/**
 * Line-manager rows in period reports: instead of the person's own delivery,
 * report the outcomes of tasks they assigned in the period (assigned,
 * completed, missed, overdue, blocked).
 */
export function aggregateManagerPeriodRows(params: {
  period: PeriodBounds;
  managers: PersonRow[];
  assignments: AssigneeMetaRow[];
  tasks: TaskRow[];
  workspaces: WorkspaceRow[];
}): StaffPeriodStats[] {
  const { period, managers, assignments, tasks, workspaces } = params;
  const workspaceName = new Map(workspaces.map((w) => [w.id, w.name]));
  const tasksById = new Map(tasks.map((t) => [t.id, t]));

  const taskIdsByManager = new Map<string, Set<string>>();
  for (const row of assignments) {
    if (!row.assigned_by) continue;
    const set = taskIdsByManager.get(row.assigned_by) ?? new Set<string>();
    set.add(row.task_id);
    taskIdsByManager.set(row.assigned_by, set);
  }

  return managers.map((person) => {
    const stats = emptyStats(person);
    stats.reportKind = "line_manager";
    const detailKeys = new Set<string>();

    const pushDetail = (detail: ReportTaskDetail) => {
      const key = `${detail.kind}:${detail.id}`;
      if (detailKeys.has(key)) return;
      detailKeys.add(key);
      stats.details.push(detail);
    };

    const toDetail = (
      task: TaskRow,
      kind: ReportTaskDetail["kind"],
    ): ReportTaskDetail => ({
      id: task.id,
      title: task.title,
      workspaceName: workspaceName.get(task.workspace_id) ?? null,
      status: task.status,
      dueAt: task.due_at,
      completedAt: task.completed_at,
      blockedReason: task.blocked_reason,
      kind,
    });

    for (const taskId of taskIdsByManager.get(person.userId) ?? []) {
      const task = tasksById.get(taskId);
      if (!task) continue;
      stats.assigned += 1;

      if (
        task.status === "completed" &&
        task.completed_at &&
        inRange(task.completed_at, period.start, period.end)
      ) {
        stats.completed += 1;
        if (wasOnTime(task.due_at, task.completed_at)) {
          stats.completedOnTime += 1;
        }
        pushDetail(toDetail(task, "completed"));
      }

      if (
        task.due_at &&
        inRange(task.due_at, period.start, period.end) &&
        !wasOnTime(task.due_at, task.completed_at)
      ) {
        stats.missed += 1;
        pushDetail(toDetail(task, "missed"));
      }

      if (
        !task.archived_at &&
        isOpenStatus(task.status) &&
        task.due_at &&
        new Date(task.due_at).getTime() < period.end.getTime()
      ) {
        stats.overdue += 1;
        pushDetail(toDetail(task, "overdue"));
      }

      if (!task.archived_at && task.status === "blocked") {
        stats.blocked += 1;
        pushDetail(toDetail(task, "blocked"));
      }
    }

    stats.details.sort((a, b) => a.title.localeCompare(b.title));
    return stats;
  });
}

function normalizeDepartmentName(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function filterPeopleByDepartment(
  people: PersonRow[],
  department: string | null | undefined,
): PersonRow[] {
  const needle = normalizeDepartmentName(department);
  if (!needle || needle === "all") return people;
  return people.filter(
    (person) => normalizeDepartmentName(person.department) === needle,
  );
}

export function listReportDepartments(people: PersonRow[]): string[] {
  const names = new Set<string>();
  for (const person of people) {
    const name = person.department?.trim();
    if (name) names.add(name);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

export async function buildPeriodReportForProfile(
  profile: NestFlowProfile,
  kind: ReportPeriodKind,
  options?: { endingDate?: string; department?: string | null },
): Promise<PeriodReport> {
  const period = resolvePeriodBounds(kind, {
    endingDate: options?.endingDate,
  });
  const { people: allPeople, scope } = await loadReportPeople(profile);
  // Org-wide viewers (Admin and HR) pick a department first.
  const requireDepartment = scope === "org";
  const departmentParam = options?.department?.trim() || null;
  // HR without the admin role cannot read org-wide task data under RLS,
  // so their report uses the service-role client (read-only aggregates).
  const useSystemClient = scope === "org" && !profile.roles.includes("admin");

  const catalogNames = requireDepartment
    ? (await listDepartments()).map((row) => row.name)
    : [];
  const departments = [
    ...new Set([...catalogNames, ...listReportDepartments(allPeople)]),
  ].sort((a, b) => a.localeCompare(b));

  // Org-wide viewers pick a department first; the full dump is opt-in via "all".
  const effectiveDepartment =
    requireDepartment && !departmentParam ? null : departmentParam;

  const people =
    requireDepartment && effectiveDepartment == null
      ? []
      : filterPeopleByDepartment(allPeople, effectiveDepartment);

  // Line managers are reported on the tasks they assigned, not their own
  // delivery, so split them out of the staff aggregation.
  const lmIds = await listUserIdsWithRoles(["line_manager"]);
  const managerPeople = people.filter((person) => lmIds.has(person.userId));
  const staffPeople = people.filter((person) => !lmIds.has(person.userId));

  const [raw, managerData] = await Promise.all([
    fetchReportRawData(
      staffPeople.map((p) => p.userId),
      period,
      useSystemClient,
    ),
    fetchManagerAssignmentData(
      managerPeople.map((p) => p.userId),
      period,
      useSystemClient,
    ),
  ]);
  const report = aggregateStaffPeriod({
    period,
    people: staffPeople,
    ...raw,
  });
  const managerRows = aggregateManagerPeriodRows({
    period,
    managers: managerPeople,
    ...managerData,
  });

  const staff = [...report.staff, ...managerRows].sort((a, b) => {
    const left = a.fullName ?? a.email ?? a.userId;
    const right = b.fullName ?? b.email ?? b.userId;
    return left.localeCompare(right);
  });

  return {
    ...report,
    staff,
    summary: { ...report.summary, staffCount: staff.length },
    scope,
    departments,
    department: effectiveDepartment,
    requireDepartment,
  };
}

export async function buildPeriodReportForUserIds(params: {
  userIds: string[];
  people: PersonRow[];
  kind: ReportPeriodKind;
  endingDate?: string;
  scope: "org" | "team";
}): Promise<PeriodReport> {
  const period = resolvePeriodBounds(params.kind, {
    endingDate: params.endingDate,
  });
  const raw = await fetchReportRawData(params.userIds, period, true);
  const report = aggregateStaffPeriod({
    period,
    people: params.people,
    ...raw,
  });
  return { ...report, scope: params.scope };
}

type AssigneeMetaRow = {
  task_id: string;
  user_id: string;
  assigned_at: string;
  assigned_by: string | null;
};

function emptyLmStats(person: PersonRow): LineManagerWeeklyStats {
  return {
    userId: person.userId,
    fullName: person.fullName,
    nestId: person.nestId,
    email: person.email,
    assigned: 0,
    completed: 0,
    failed: 0,
    unrest: 0,
    blockList: [],
  };
}

/**
 * Admin-only weekly rollup per line manager: assignments they made,
 * completions, missed deadlines (failed), open unrest, and block list.
 */
export async function buildLineManagerWeeklyReport(options?: {
  endingDate?: string;
}): Promise<LineManagerWeeklyReport> {
  const period = resolvePeriodBounds("weekly", {
    endingDate: options?.endingDate,
  });

  const lmIds = await listUserIdsWithRoles(["line_manager"]);
  const directory = await listDirectoryUsers();
  const managers: PersonRow[] = directory
    .filter((user) => user.isActive && lmIds.has(user.userId))
    .map((user) => ({
      userId: user.userId,
      fullName: user.fullName,
      nestId: user.nestId,
      email: user.email,
      department: user.department,
    }));

  if (managers.length === 0) {
    return { period, managers: [] };
  }

  const managerIdList = managers.map((m) => m.userId);
  const supabase = await createClient();

  const { data: assigneeRows, error: assigneeError } = await supabase
    .from("nf_task_assignees")
    .select("task_id, user_id, assigned_at, assigned_by")
    .in("assigned_by", managerIdList)
    .gte("assigned_at", period.start.toISOString())
    .lt("assigned_at", period.end.toISOString());

  if (assigneeError) throw new Error(assigneeError.message);

  const assignments = (assigneeRows ?? []) as AssigneeMetaRow[];
  const taskIds = [...new Set(assignments.map((row) => row.task_id))];

  let tasks: TaskRow[] = [];
  if (taskIds.length > 0) {
    const { data: taskRows, error: taskError } = await supabase
      .from("nf_tasks")
      .select(
        "id, workspace_id, title, status, due_at, blocked_reason, completed_at, archived_at, created_at, updated_at",
      )
      .in("id", taskIds);
    if (taskError) throw new Error(taskError.message);
    tasks = (taskRows ?? []) as TaskRow[];
  }

  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const personLabelById = new Map(
    directory.map((user) => [
      user.userId,
      user.fullName ?? user.nestId ?? user.email ?? user.userId,
    ]),
  );

  // Current assignees for block-list labels (may include people outside period).
  let currentAssignees: AssigneeRow[] = [];
  if (taskIds.length > 0) {
    const { data: currentRows } = await supabase
      .from("nf_task_assignees")
      .select("task_id, user_id")
      .in("task_id", taskIds);
    currentAssignees = (currentRows ?? []) as AssigneeRow[];
  }
  const assigneesByTask = new Map<string, string[]>();
  for (const row of currentAssignees) {
    const list = assigneesByTask.get(row.task_id) ?? [];
    list.push(row.user_id);
    assigneesByTask.set(row.task_id, list);
  }

  const byManager = new Map<string, LineManagerWeeklyStats>();
  for (const manager of managers) {
    byManager.set(manager.userId, emptyLmStats(manager));
  }

  // Count unique task assignments per LM in period.
  const seenAssign = new Set<string>();
  for (const row of assignments) {
    const managerId = row.assigned_by;
    if (!managerId) continue;
    const stats = byManager.get(managerId);
    if (!stats) continue;
    const key = `${managerId}:${row.task_id}`;
    if (seenAssign.has(key)) continue;
    seenAssign.add(key);
    stats.assigned += 1;

    const task = tasksById.get(row.task_id);
    if (!task) continue;

    if (
      task.status === "completed" &&
      inRange(task.completed_at, period.start, period.end)
    ) {
      stats.completed += 1;
    }

    if (
      task.due_at &&
      inRange(task.due_at, period.start, period.end) &&
      !wasOnTime(task.due_at, task.completed_at)
    ) {
      stats.failed += 1;
    }

    if (!task.archived_at && isOpenStatus(task.status)) {
      stats.unrest += 1;
    }

    if (!task.archived_at && task.status === "blocked") {
      const item: LmBlockListItem = {
        taskId: task.id,
        title: task.title,
        blockedReason: task.blocked_reason,
        assigneeNames: (assigneesByTask.get(task.id) ?? []).map(
          (id) => personLabelById.get(id) ?? id,
        ),
      };
      if (!stats.blockList.some((entry) => entry.taskId === item.taskId)) {
        stats.blockList.push(item);
      }
    }
  }

  const result = [...byManager.values()].sort((a, b) => {
    const left = a.fullName ?? a.email ?? a.userId;
    const right = b.fullName ?? b.email ?? b.userId;
    return left.localeCompare(right);
  });

  return { period, managers: result };
}

/** Active profiles that hold admin, hr, or line_manager (digest recipients). */
export async function listDigestRecipientIds(): Promise<string[]> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for digest delivery.");
  }

  const roles: AppRole[] = ["admin", "hr", "line_manager"];
  const { data, error } = await admin
    .schema("nestflow")
    .from("user_roles")
    .select("user_id, role")
    .in("role", roles);
  if (error) throw new Error(error.message);

  return [...new Set((data ?? []).map((row) => row.user_id as string))];
}

export async function loadDigestScopeForUser(userId: string): Promise<{
  roles: AppRole[];
  people: PersonRow[];
  scope: "org" | "team";
} | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    admin
      .schema("nestflow")
      .from("user_roles")
      .select("role")
      .eq("user_id", userId),
    admin
      .from("profiles")
      .select("id, nest_id, email, full_name, department, status, deleted_at")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (!profile || profile.deleted_at || (profile.status ?? "Active") !== "Active") {
    return null;
  }

  const roles = (roleRows ?? [])
    .map((row) => row.role as AppRole)
    .filter((role) =>
      role === "admin" || role === "hr" || role === "line_manager" || role === "staff",
    );

  const isOrgWide = roles.includes("admin") || roles.includes("hr");

  if (isOrgWide) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, nest_id, email, full_name, department, status, deleted_at")
      .is("deleted_at", null);
    const people: PersonRow[] = (profiles ?? [])
      .filter((row) => (row.status ?? "Active") === "Active")
      .map((row) => ({
        userId: row.id as string,
        fullName: row.full_name as string | null,
        nestId: row.nest_id as string | null,
        email: row.email as string | null,
        department: row.department as string | null,
      }));
    return { roles, people, scope: "org" };
  }

  if (!roles.includes("line_manager")) {
    return null;
  }

  const { data: managed } = await admin
    .schema("nestflow")
    .from("team_memberships")
    .select("team_id")
    .eq("user_id", userId)
    .eq("is_manager", true);
  const teamIds = (managed ?? []).map((row) => row.team_id as string);
  if (teamIds.length === 0) {
    return { roles, people: [], scope: "team" };
  }

  const { data: members } = await admin
    .schema("nestflow")
    .from("team_memberships")
    .select("user_id")
    .in("team_id", teamIds);
  const memberIds = [
    ...new Set((members ?? []).map((row) => row.user_id as string)),
  ];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, nest_id, email, full_name, department, status, deleted_at")
    .in("id", memberIds)
    .is("deleted_at", null);

  const people: PersonRow[] = (profiles ?? [])
    .filter((row) => (row.status ?? "Active") === "Active")
    .map((row) => ({
      userId: row.id as string,
      fullName: row.full_name as string | null,
      nestId: row.nest_id as string | null,
      email: row.email as string | null,
      department: row.department as string | null,
    }));

  return { roles, people, scope: "team" };
}
