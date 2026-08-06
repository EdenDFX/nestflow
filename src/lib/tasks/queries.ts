import { createClient } from "@/lib/supabase/server";
import {
  isTaskPriority,
  isTaskStatus,
  type NestFlowTask,
  type NestFlowWorkspace,
  type TaskAssignee,
  type TaskCounters,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";

type TaskRow = {
  id: string;
  workspace_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_at: string | null;
  blocked_reason: string | null;
  created_by: string;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type AssigneeRow = {
  task_id: string;
  user_id: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  nest_id: string | null;
  email: string | null;
  avatar_url: string | null;
};

function mapTask(
  row: TaskRow,
  assignees: TaskAssignee[],
  tags: string[] = [],
): NestFlowTask {
  const status = isTaskStatus(row.status) ? row.status : "backlog";
  const priority = isTaskPriority(row.priority) ? row.priority : "medium";

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    description: row.description ?? "",
    status,
    priority,
    dueAt: row.due_at,
    blockedReason: row.blocked_reason,
    createdBy: row.created_by,
    completedAt: row.completed_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignees,
    tags,
  };
}

async function hydrateTasks(rows: TaskRow[]): Promise<NestFlowTask[]> {
  if (rows.length === 0) return [];

  const supabase = await createClient();
  const taskIds = rows.map((row) => row.id);

  const { data: assigneeRows, error: assigneeError } = await supabase
    .from("nf_task_assignees")
    .select("task_id, user_id")
    .in("task_id", taskIds);

  if (assigneeError) {
    throw new Error(assigneeError.message);
  }

  const userIds = [
    ...new Set((assigneeRows ?? []).map((row: AssigneeRow) => row.user_id)),
  ];

  let profilesById = new Map<string, ProfileRow>();
  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, nest_id, email, avatar_url")
      .in("id", userIds);

    if (profileError) {
      throw new Error(profileError.message);
    }

    profilesById = new Map(
      (profiles ?? []).map((profile: ProfileRow) => [profile.id, profile]),
    );
  }

  const assigneesByTask = new Map<string, TaskAssignee[]>();
  for (const row of (assigneeRows ?? []) as AssigneeRow[]) {
    const profile = profilesById.get(row.user_id);
    const list = assigneesByTask.get(row.task_id) ?? [];
    list.push({
      userId: row.user_id,
      fullName: profile?.full_name ?? null,
      nestId: profile?.nest_id ?? null,
      email: profile?.email ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    });
    assigneesByTask.set(row.task_id, list);
  }

  return rows.map((row) => mapTask(row, assigneesByTask.get(row.id) ?? []));
}

export async function listWorkspaces(options?: {
  includeHr?: boolean;
}): Promise<NestFlowWorkspace[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_workspaces")
    .select("id, team_id, name, is_archived, kind")
    .eq("is_archived", false)
    .order("name");

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => ({
      id: row.id as string,
      teamId: row.team_id as string,
      name: row.name as string,
      isArchived: Boolean(row.is_archived),
      kind: row.kind === "hr" ? ("hr" as const) : ("general" as const),
    }))
    .filter((workspace) => options?.includeHr || workspace.kind !== "hr");
}

export async function listAssignablePeople(): Promise<TaskAssignee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, nest_id, email, avatar_url")
    .is("deleted_at", null)
    .eq("status", "Active")
    .order("full_name");

  if (error) throw new Error(error.message);

  return (data ?? []).map((profile: ProfileRow) => ({
    userId: profile.id,
    fullName: profile.full_name,
    nestId: profile.nest_id,
    email: profile.email,
    avatarUrl: profile.avatar_url,
  }));
}

export async function listTasks(options?: {
  workspaceId?: string;
  /** When set, keep only tasks where this user is an assignee. Prefer omitting for RLS-scoped “my work” lists. */
  assigneeId?: string;
  /** When true with assigneeId false path, also include tasks the user created (collaboration scope). */
  includeCreatedBy?: string;
  status?: TaskStatus | TaskStatus[];
  includeArchived?: boolean;
}): Promise<NestFlowTask[]> {
  const supabase = await createClient();
  let query = supabase
    .from("nf_tasks")
    .select(
      "id, workspace_id, title, description, status, priority, due_at, blocked_reason, created_by, completed_at, archived_at, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (!options?.includeArchived) {
    query = query.is("archived_at", null);
  }
  if (options?.workspaceId) {
    query = query.eq("workspace_id", options.workspaceId);
  }
  if (options?.status) {
    if (Array.isArray(options.status)) {
      query = query.in("status", options.status);
    } else {
      query = query.eq("status", options.status);
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let tasks = await hydrateTasks((data ?? []) as TaskRow[]);

  if (options?.assigneeId || options?.includeCreatedBy) {
    const assigneeId = options.assigneeId;
    const creatorId = options.includeCreatedBy;
    tasks = tasks.filter((task) => {
      const isAssignee = assigneeId
        ? task.assignees.some((assignee) => assignee.userId === assigneeId)
        : false;
      const isCreator = creatorId ? task.createdBy === creatorId : false;
      if (assigneeId && creatorId) return isAssignee || isCreator;
      if (assigneeId) return isAssignee;
      return isCreator;
    });
  }

  return tasks;
}

export async function getTaskById(taskId: string): Promise<NestFlowTask | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_tasks")
    .select(
      "id, workspace_id, title, description, status, priority, due_at, blocked_reason, created_by, completed_at, archived_at, created_at, updated_at",
    )
    .eq("id", taskId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const [task] = await hydrateTasks([data as TaskRow]);
  return task ?? null;
}

/**
 * Counters for tasks the current session can already see (RLS).
 * Optional userId restricts further to assignee and/or creator participation.
 */
export async function getTaskCounters(options?: {
  userId?: string;
  /** Count only participation (assignee or creator). Default true when userId set. */
  participantOnly?: boolean;
}): Promise<TaskCounters> {
  const userId = options?.userId;
  const participantOnly =
    options?.participantOnly ?? Boolean(userId);

  const tasks = await listTasks(
    userId && participantOnly
      ? { assigneeId: userId, includeCreatedBy: userId }
      : undefined,
  );
  const now = Date.now();

  return {
    open: tasks.filter((task) => task.status !== "completed").length,
    inProgress: tasks.filter((task) => task.status === "in_progress").length,
    blocked: tasks.filter((task) => task.status === "blocked").length,
    overdue: tasks.filter(
      (task) =>
        task.status !== "completed" &&
        task.dueAt !== null &&
        new Date(task.dueAt).getTime() < now,
    ).length,
    completed: tasks.filter((task) => task.status === "completed").length,
  };
}

export type { TaskPriority, TaskStatus };
