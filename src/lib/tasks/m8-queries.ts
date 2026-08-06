import { createClient } from "@/lib/supabase/server";
import {
  isApprovalStatus,
  isRecurrenceRule,
  type AutomationActionType,
  type AutomationRule,
  type AutomationTrigger,
  type TaskDependency,
  type TaskM8Extras,
  type TaskTemplate,
  type TimeEntry,
} from "@/lib/tasks/m8-types";
import {
  isTaskPriority,
  isTaskStatus,
  type NestFlowTask,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";

type ProfileRow = {
  id: string;
  full_name: string | null;
  nest_id: string | null;
};

function parseChecklistTitles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mapM8TaskFields(row: Record<string, unknown>): Pick<
  NestFlowTask,
  | "recurrenceRule"
  | "recurrenceInterval"
  | "recurrenceEndsAt"
  | "recurrenceParentId"
  | "approvalStatus"
  | "approvalNote"
  | "approvalRequestedBy"
  | "approvalRequestedAt"
  | "approvalDecidedBy"
  | "approvalDecidedAt"
  | "gearRef"
  | "gearUrl"
> {
  const rule = row.recurrence_rule;
  const approval = row.approval_status;

  return {
    recurrenceRule:
      typeof rule === "string" && isRecurrenceRule(rule) ? rule : null,
    recurrenceInterval:
      typeof row.recurrence_interval === "number" ? row.recurrence_interval : 1,
    recurrenceEndsAt:
      typeof row.recurrence_ends_at === "string" ? row.recurrence_ends_at : null,
    recurrenceParentId:
      typeof row.recurrence_parent_id === "string"
        ? row.recurrence_parent_id
        : null,
    approvalStatus:
      typeof approval === "string" && isApprovalStatus(approval)
        ? approval
        : "none",
    approvalNote:
      typeof row.approval_note === "string" ? row.approval_note : null,
    approvalRequestedBy:
      typeof row.approval_requested_by === "string"
        ? row.approval_requested_by
        : null,
    approvalRequestedAt:
      typeof row.approval_requested_at === "string"
        ? row.approval_requested_at
        : null,
    approvalDecidedBy:
      typeof row.approval_decided_by === "string"
        ? row.approval_decided_by
        : null,
    approvalDecidedAt:
      typeof row.approval_decided_at === "string"
        ? row.approval_decided_at
        : null,
    gearRef: typeof row.gear_ref === "string" ? row.gear_ref : null,
    gearUrl: typeof row.gear_url === "string" ? row.gear_url : null,
  };
}

export async function getTaskM8Extras(taskId: string): Promise<TaskM8Extras> {
  const supabase = await createClient();

  const [
    { data: depRows, error: depError },
    { data: blockerRows, error: blockerError },
    { data: timeRows, error: timeError },
    { data: taskRows, error: taskError },
  ] = await Promise.all([
    supabase
      .from("nf_task_dependencies")
      .select("id, task_id, depends_on_task_id, created_at")
      .eq("task_id", taskId),
    supabase
      .from("nf_task_dependencies")
      .select("id, task_id, depends_on_task_id, created_at")
      .eq("depends_on_task_id", taskId),
    supabase
      .from("nf_time_entries")
      .select("id, task_id, user_id, minutes, note, logged_at, created_at")
      .eq("task_id", taskId)
      .order("logged_at", { ascending: false }),
    supabase
      .from("nf_tasks")
      .select("id, title, status")
      .is("archived_at", null)
      .neq("id", taskId)
      .order("updated_at", { ascending: false })
      .limit(80),
  ]);

  if (depError) throw new Error(depError.message);
  if (blockerError) throw new Error(blockerError.message);
  if (timeError) throw new Error(timeError.message);
  if (taskError) throw new Error(taskError.message);

  const relatedIds = [
    ...new Set([
      ...(depRows ?? []).map((row) => row.depends_on_task_id as string),
      ...(blockerRows ?? []).map((row) => row.task_id as string),
    ]),
  ];

  let relatedById = new Map<string, { title: string; status: TaskStatus }>();
  if (relatedIds.length > 0) {
    const { data: related, error } = await supabase
      .from("nf_tasks")
      .select("id, title, status")
      .in("id", relatedIds);
    if (error) throw new Error(error.message);
    relatedById = new Map(
      (related ?? []).map((row) => [
        row.id as string,
        {
          title: (row.title as string) ?? "Task",
          status: isTaskStatus(row.status as string)
            ? (row.status as TaskStatus)
            : "backlog",
        },
      ]),
    );
  }

  const mapDep = (
    row: {
      id: string;
      task_id: string;
      depends_on_task_id: string;
      created_at: string;
    },
    titleKey: "depends_on_task_id" | "task_id",
  ): TaskDependency => {
    const relatedId =
      titleKey === "depends_on_task_id"
        ? row.depends_on_task_id
        : row.task_id;
    const related = relatedById.get(relatedId);
    return {
      id: row.id,
      taskId: row.task_id,
      dependsOnTaskId: row.depends_on_task_id,
      dependsOnTitle: related?.title ?? "Task",
      dependsOnStatus: related?.status ?? "backlog",
      createdAt: row.created_at,
    };
  };

  const userIds = [
    ...new Set((timeRows ?? []).map((row) => row.user_id as string)),
  ];
  let profiles = new Map<string, ProfileRow>();
  if (userIds.length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, nest_id")
      .in("id", userIds);
    if (error) throw new Error(error.message);
    profiles = new Map((data ?? []).map((row: ProfileRow) => [row.id, row]));
  }

  const timeEntries: TimeEntry[] = (timeRows ?? []).map((row) => {
    const profile = profiles.get(row.user_id as string);
    return {
      id: row.id as string,
      taskId: row.task_id as string,
      userId: row.user_id as string,
      userName: profile?.full_name ?? profile?.nest_id ?? null,
      minutes: row.minutes as number,
      note: (row.note as string) ?? "",
      loggedAt: row.logged_at as string,
      createdAt: row.created_at as string,
    };
  });

  return {
    dependencies: (depRows ?? []).map((row) =>
      mapDep(
        row as {
          id: string;
          task_id: string;
          depends_on_task_id: string;
          created_at: string;
        },
        "depends_on_task_id",
      ),
    ),
    blockersOf: (blockerRows ?? []).map((row) =>
      mapDep(
        row as {
          id: string;
          task_id: string;
          depends_on_task_id: string;
          created_at: string;
        },
        "task_id",
      ),
    ),
    timeEntries,
    totalMinutes: timeEntries.reduce((sum, entry) => sum + entry.minutes, 0),
    candidateTasks: (taskRows ?? []).map((row) => ({
      id: row.id as string,
      title: (row.title as string) ?? "Task",
      status: isTaskStatus(row.status as string)
        ? (row.status as TaskStatus)
        : "backlog",
    })),
  };
}

export async function listOpenDependencyTitles(
  taskId: string,
): Promise<string[]> {
  const supabase = await createClient();
  const { data: deps, error } = await supabase
    .from("nf_task_dependencies")
    .select("depends_on_task_id")
    .eq("task_id", taskId);

  if (error) throw new Error(error.message);
  if (!deps?.length) return [];

  const ids = deps.map((row) => row.depends_on_task_id as string);
  const { data: tasks, error: taskError } = await supabase
    .from("nf_tasks")
    .select("title, status")
    .in("id", ids);

  if (taskError) throw new Error(taskError.message);

  return (tasks ?? [])
    .filter((task) => task.status !== "completed")
    .map((task) => (task.title as string) ?? "Dependency");
}

export async function listTaskTemplates(options?: {
  workspaceKind?: "general" | "hr";
  activeOnly?: boolean;
}): Promise<TaskTemplate[]> {
  const supabase = await createClient();
  let query = supabase
    .from("nf_task_templates")
    .select("*")
    .order("name", { ascending: true });

  if (options?.workspaceKind) {
    query = query.eq("workspace_kind", options.workspaceKind);
  }
  if (options?.activeOnly !== false) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => mapTemplate(row as Record<string, unknown>));
}

function mapTemplate(row: Record<string, unknown>): TaskTemplate {
  const priority = row.default_priority;
  const status = row.default_status;
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? "",
    workspaceKind: row.workspace_kind === "hr" ? "hr" : "general",
    defaultPriority:
      typeof priority === "string" && isTaskPriority(priority)
        ? priority
        : "medium",
    defaultStatus:
      typeof status === "string" && isTaskStatus(status) ? status : "todo",
    checklistTitles: parseChecklistTitles(row.checklist_titles),
    tags: Array.isArray(row.tags)
      ? (row.tags as string[]).filter((t) => typeof t === "string")
      : [],
    isActive: Boolean(row.is_active),
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listAutomationRules(): Promise<AutomationRule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_automation_rules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => mapAutomationRule(row as Record<string, unknown>));
}

function mapAutomationRule(row: Record<string, unknown>): AutomationRule {
  const from = row.from_status;
  const to = row.to_status;
  return {
    id: row.id as string,
    name: row.name as string,
    isActive: Boolean(row.is_active),
    triggerType: row.trigger_type as AutomationTrigger,
    fromStatus:
      typeof from === "string" && isTaskStatus(from) ? from : null,
    toStatus: typeof to === "string" && isTaskStatus(to) ? to : null,
    actionType: row.action_type as AutomationActionType,
    actionValue: (row.action_value as string) ?? "",
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function sumTimeMinutesByUser(
  userIds: string[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (userIds.length === 0) return result;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_time_entries")
    .select("user_id, minutes")
    .in("user_id", userIds);

  if (error) {
    // Table may be empty or RLS-limited; fail soft for grids.
    console.error("sumTimeMinutesByUser", error.message);
    return result;
  }

  for (const row of data ?? []) {
    const userId = row.user_id as string;
    result.set(userId, (result.get(userId) ?? 0) + (row.minutes as number));
  }
  return result;
}

export async function getDeliveryReportExtras(tasks: NestFlowTask[]): Promise<{
  pendingApprovals: number;
  recurringOpen: number;
  totalMinutesLogged: number;
  approvedCompleted: number;
  completionRate30d: number | null;
}> {
  const supabase = await createClient();
  const pendingApprovals = tasks.filter(
    (task) =>
      task.approvalStatus === "pending" && task.status !== "completed",
  ).length;
  const recurringOpen = tasks.filter(
    (task) => task.recurrenceRule && task.status !== "completed",
  ).length;
  const approvedCompleted = tasks.filter(
    (task) =>
      task.status === "completed" && task.approvalStatus === "approved",
  ).length;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = tasks.filter(
    (task) => new Date(task.createdAt).getTime() >= thirtyDaysAgo,
  );
  const recentDone = recent.filter((task) => task.status === "completed");
  const completionRate30d =
    recent.length === 0
      ? null
      : Math.round((recentDone.length / recent.length) * 100);

  const { data: timeRows, error } = await supabase
    .from("nf_time_entries")
    .select("minutes");
  let totalMinutesLogged = 0;
  if (!error && timeRows) {
    totalMinutesLogged = timeRows.reduce(
      (sum, row) => sum + ((row.minutes as number) ?? 0),
      0,
    );
  }

  return {
    pendingApprovals,
    recurringOpen,
    totalMinutesLogged,
    approvedCompleted,
    completionRate30d,
  };
}

export type { TaskPriority };
