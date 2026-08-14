"use server";

import { z } from "zod";

import { requireActiveProfile } from "@/lib/auth/session";
import {
  changeTaskStatusAction,
  reassignTasksAction,
  updateTaskAction,
  type ActionResult,
} from "@/lib/tasks/actions";
import { TASK_STATUSES } from "@/lib/tasks/types";
import { pgUuid } from "@/lib/validation/ids";

const bulkUpdateSchema = z.object({
  taskIds: z.array(pgUuid).min(1).max(50),
  assigneeIds: z.array(pgUuid).max(20).optional(),
  dueAt: z.string().nullable().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  blockedReason: z.string().trim().optional().nullable(),
});

export async function bulkUpdateTasksAction(
  input: z.infer<typeof bulkUpdateSchema>,
): Promise<ActionResult> {
  await requireActiveProfile();
  const parsed = bulkUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: parsed.error.issues[0]?.message ?? "Invalid bulk update.",
    };
  }

  const { taskIds, assigneeIds, dueAt, status, blockedReason } = parsed.data;
  if (
    assigneeIds === undefined &&
    dueAt === undefined &&
    status === undefined
  ) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: "Choose assignees, a due date, or a status.",
    };
  }

  if (assigneeIds !== undefined) {
    const result = await reassignTasksAction({ taskIds, assigneeIds });
    if (!result.ok) return result;
  }

  for (const taskId of taskIds) {
    if (status !== undefined) {
      const result = await changeTaskStatusAction({
        taskId,
        status,
        blockedReason: status === "blocked" ? blockedReason : null,
      });
      if (!result.ok) return result;
    }
    if (dueAt !== undefined) {
      const result = await updateTaskAction({
        taskId,
        dueAt,
      });
      if (!result.ok) return result;
    }
  }

  return { ok: true };
}
