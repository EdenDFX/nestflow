"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireActiveProfile } from "@/lib/auth/session";
import { isAppRole } from "@/lib/auth/types";
import { notifyMany } from "@/lib/notifications/notify";
import { rolesAllow } from "@/lib/security/authz";
import { createClient } from "@/lib/supabase/server";
import { recordActivity } from "@/lib/tasks/activity";
import {
  canTransition,
  isTaskStatus,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/tasks/types";

export type ActionResult = {
  ok: boolean;
  error?: string;
  code?: string;
  taskId?: string;
};

const createTaskSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().max(5000).optional().default(""),
  status: z.enum(TASK_STATUSES).default("todo"),
  priority: z.enum(TASK_PRIORITIES).default("medium"),
  dueAt: z.string().optional().nullable(),
  assigneeIds: z.array(z.string().uuid()).default([]),
  blockedReason: z.string().trim().optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
});

const updateTaskSchema = createTaskSchema
  .partial()
  .extend({
    taskId: z.string().uuid(),
    title: z.string().trim().min(1).max(200).optional(),
  });

const statusSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(TASK_STATUSES),
  blockedReason: z.string().trim().optional().nullable(),
});

function canAssign(roles: string[]) {
  return rolesAllow(roles.filter(isAppRole), "assign_tasks");
}

function revalidateTaskPaths(taskId?: string) {
  revalidatePath("/app");
  revalidatePath("/app/my-tasks");
  revalidatePath("/app/board");
  revalidatePath("/app/list");
  revalidatePath("/app/calendar");
  if (taskId) {
    revalidatePath(`/app/tasks/${taskId}`);
  }
}

export async function createTaskAction(
  input: z.infer<typeof createTaskSchema>,
): Promise<ActionResult> {
  const profile = await requireActiveProfile();
  const parsed = createTaskSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: parsed.error.issues[0]?.message ?? "Invalid task data.",
    };
  }

  if (
    parsed.data.status === "blocked" &&
    !parsed.data.blockedReason?.trim()
  ) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: "Blocked tasks need a reason.",
    };
  }

  if (parsed.data.assigneeIds.length > 0 && !canAssign(profile.roles)) {
    return {
      ok: false,
      code: "FORBIDDEN",
      error: "Only managers, HR, or admins can assign tasks.",
    };
  }

  const supabase = await createClient();
  const dueAt =
    parsed.data.dueAt && parsed.data.dueAt.length > 0
      ? new Date(parsed.data.dueAt).toISOString()
      : null;

  const { data: task, error } = await supabase
    .from("nf_tasks")
    .insert({
      workspace_id: parsed.data.workspaceId,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      priority: parsed.data.priority,
      due_at: dueAt,
      blocked_reason:
        parsed.data.status === "blocked" ? parsed.data.blockedReason : null,
      created_by: profile.userId,
      completed_at:
        parsed.data.status === "completed" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !task) {
    return {
      ok: false,
      code: "INTERNAL",
      error: error?.message ?? "Could not create task.",
    };
  }

  const assigneeIds =
    parsed.data.assigneeIds.length > 0
      ? parsed.data.assigneeIds
      : [profile.userId];

  const { error: assignError } = await supabase.from("nf_task_assignees").insert(
    assigneeIds.map((userId) => ({
      task_id: task.id,
      user_id: userId,
      assigned_by: profile.userId,
    })),
  );

  if (assignError) {
    return {
      ok: false,
      code: "INTERNAL",
      error: assignError.message,
    };
  }

  if (parsed.data.tags.length > 0) {
    for (const tagName of parsed.data.tags) {
      const { data: tagRow, error: tagError } = await supabase
        .from("nf_tags")
        .upsert(
          {
            workspace_id: parsed.data.workspaceId,
            name: tagName,
          },
          { onConflict: "workspace_id,name" },
        )
        .select("id")
        .single();

      if (tagError || !tagRow) {
        continue;
      }

      await supabase.from("nf_task_tags").upsert({
        task_id: task.id,
        tag_id: tagRow.id,
      });
    }
  }

  await recordActivity({
    taskId: task.id,
    actorId: profile.userId,
    eventType: "task_created",
    summary: `Created task "${parsed.data.title}"`,
  });

  const assignedOthers = assigneeIds.filter((id) => id !== profile.userId);
  if (assignedOthers.length > 0) {
    await notifyMany(assignedOthers, {
      eventType: "task_assigned",
      title: "You were assigned a task",
      body: parsed.data.title,
      taskId: task.id,
      href: `/app/tasks/${task.id}`,
      metadata: { assignedBy: profile.userId },
      idempotencyKey: `assign:${task.id}:${assignedOthers.sort().join(",")}`,
    });
  }

  revalidateTaskPaths(task.id);
  return { ok: true, taskId: task.id };
}

export async function updateTaskAction(
  input: z.infer<typeof updateTaskSchema>,
): Promise<ActionResult> {
  const profile = await requireActiveProfile();
  const parsed = updateTaskSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: parsed.error.issues[0]?.message ?? "Invalid task data.",
    };
  }

  const supabase = await createClient();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) {
    updates.description = parsed.data.description;
  }
  if (parsed.data.priority !== undefined) updates.priority = parsed.data.priority;
  if (parsed.data.dueAt !== undefined) {
    updates.due_at =
      parsed.data.dueAt && parsed.data.dueAt.length > 0
        ? new Date(parsed.data.dueAt).toISOString()
        : null;
  }
  if (parsed.data.status !== undefined) {
    if (
      parsed.data.status === "blocked" &&
      !parsed.data.blockedReason?.trim()
    ) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        error: "Blocked tasks need a reason.",
      };
    }
    updates.status = parsed.data.status;
    updates.blocked_reason =
      parsed.data.status === "blocked" ? parsed.data.blockedReason : null;
    updates.completed_at =
      parsed.data.status === "completed" ? new Date().toISOString() : null;
  }

  const { error } = await supabase
    .from("nf_tasks")
    .update(updates)
    .eq("id", parsed.data.taskId);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  let previousAssigneeIds: string[] = [];
  if (parsed.data.assigneeIds !== undefined) {
    if (!canAssign(profile.roles)) {
      return {
        ok: false,
        code: "FORBIDDEN",
        error: "Only managers, HR, or admins can reassign tasks.",
      };
    }

    const { data: existingAssignees } = await supabase
      .from("nf_task_assignees")
      .select("user_id")
      .eq("task_id", parsed.data.taskId);
    previousAssigneeIds = (existingAssignees ?? []).map(
      (row) => row.user_id as string,
    );

    await supabase
      .from("nf_task_assignees")
      .delete()
      .eq("task_id", parsed.data.taskId);

    if (parsed.data.assigneeIds.length > 0) {
      const { error: assignError } = await supabase
        .from("nf_task_assignees")
        .insert(
          parsed.data.assigneeIds.map((userId) => ({
            task_id: parsed.data.taskId,
            user_id: userId,
            assigned_by: profile.userId,
          })),
        );

      if (assignError) {
        return { ok: false, code: "INTERNAL", error: assignError.message };
      }
    }
  }

  await recordActivity({
    taskId: parsed.data.taskId,
    actorId: profile.userId,
    eventType: "task_updated",
    summary: "Updated task details",
  });

  if (parsed.data.assigneeIds !== undefined) {
    const previous = new Set(previousAssigneeIds);
    const newlyAssigned = parsed.data.assigneeIds.filter(
      (id) => !previous.has(id) && id !== profile.userId,
    );
    if (newlyAssigned.length > 0) {
      const { data: taskRow } = await supabase
        .from("nf_tasks")
        .select("title")
        .eq("id", parsed.data.taskId)
        .maybeSingle();

      await notifyMany(newlyAssigned, {
        eventType: "task_assigned",
        title: "You were assigned a task",
        body: taskRow?.title ?? "A task was assigned to you",
        taskId: parsed.data.taskId,
        href: `/app/tasks/${parsed.data.taskId}`,
        metadata: { assignedBy: profile.userId },
        idempotencyKey: `reassign:${parsed.data.taskId}:${newlyAssigned.sort().join(",")}:${Date.now()}`,
      });
    }
  }

  revalidateTaskPaths(parsed.data.taskId);
  return { ok: true, taskId: parsed.data.taskId };
}

export async function changeTaskStatusAction(
  input: z.infer<typeof statusSchema>,
): Promise<ActionResult> {
  const profile = await requireActiveProfile();
  const parsed = statusSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: parsed.error.issues[0]?.message ?? "Invalid status change.",
    };
  }

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("nf_tasks")
    .select("status")
    .eq("id", parsed.data.taskId)
    .maybeSingle();

  if (currentError || !current) {
    return {
      ok: false,
      code: "NOT_FOUND",
      error: "Task not found.",
    };
  }

  const from = current.status as TaskStatus;
  const to = parsed.data.status;

  if (!isTaskStatus(from) || !canTransition(from, to)) {
    return {
      ok: false,
      code: "CONFLICT",
      error: `Cannot move from ${from} to ${to}.`,
    };
  }

  if (to === "blocked" && !parsed.data.blockedReason?.trim()) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: "Blocked tasks need a reason.",
    };
  }

  const { error } = await supabase
    .from("nf_tasks")
    .update({
      status: to,
      blocked_reason: to === "blocked" ? parsed.data.blockedReason : null,
      completed_at: to === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.taskId);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordActivity({
    taskId: parsed.data.taskId,
    actorId: profile.userId,
    eventType: "status_changed",
    summary: `Moved status from ${from} to ${to}`,
    metadata: { from, to },
  });

  revalidateTaskPaths(parsed.data.taskId);
  return { ok: true, taskId: parsed.data.taskId };
}

export async function archiveTaskAction(taskId: string): Promise<ActionResult> {
  const profile = await requireActiveProfile();

  if (!z.string().uuid().safeParse(taskId).success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid task id." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("nf_tasks")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordActivity({
    taskId,
    actorId: profile.userId,
    eventType: "task_archived",
    summary: "Archived task",
  });

  revalidateTaskPaths(taskId);
  return { ok: true, taskId };
}
