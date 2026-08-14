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
  AUTOMATION_ACTIONS,
  AUTOMATION_TRIGGERS,
  RECURRENCE_RULES,
  advanceDueDate,
  isRecurrenceRule,
  type AutomationRule,
  type RecurrenceRule,
} from "@/lib/tasks/m8-types";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  isTaskPriority,
  isTaskStatus,
  type TaskStatus,
} from "@/lib/tasks/types";
import { pgUuid } from "@/lib/validation/ids";

export type M8ActionResult = {
  ok: boolean;
  error?: string;
  code?: string;
  taskId?: string;
  templateId?: string;
  ruleId?: string;
};

function revalidateTask(taskId: string) {
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath("/app");
  revalidatePath("/app/my-tasks");
  revalidatePath("/app/board");
  revalidatePath("/app/list");
  revalidatePath("/app/work");
  revalidatePath("/app/calendar");
  revalidatePath("/app/team");
  revalidatePath("/app/people");
  revalidatePath("/app/admin");
}

async function loadActiveRules(): Promise<AutomationRule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_automation_rules")
    .select("*")
    .eq("is_active", true);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    isActive: Boolean(row.is_active),
    triggerType: row.trigger_type as AutomationRule["triggerType"],
    fromStatus:
      typeof row.from_status === "string" && isTaskStatus(row.from_status)
        ? row.from_status
        : null,
    toStatus:
      typeof row.to_status === "string" && isTaskStatus(row.to_status)
        ? row.to_status
        : null,
    actionType: row.action_type as AutomationRule["actionType"],
    actionValue: (row.action_value as string) ?? "",
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function runAutomationsForTask(params: {
  taskId: string;
  actorId: string;
  trigger: AutomationRule["triggerType"];
  fromStatus?: TaskStatus | null;
  toStatus?: TaskStatus | null;
}) {
  const rules = await loadActiveRules();
  const matching = rules.filter((rule) => {
    if (rule.triggerType !== params.trigger) return false;
    if (
      rule.triggerType === "status_changed" ||
      rule.triggerType === "task_completed"
    ) {
      if (rule.fromStatus && rule.fromStatus !== params.fromStatus) return false;
      if (rule.toStatus && rule.toStatus !== params.toStatus) return false;
    }
    return true;
  });

  if (matching.length === 0) return;

  const supabase = await createClient();

  for (const rule of matching) {
    switch (rule.actionType) {
      case "set_priority": {
        if (!isTaskPriority(rule.actionValue)) break;
        await supabase
          .from("nf_tasks")
          .update({
            priority: rule.actionValue,
            updated_at: new Date().toISOString(),
          })
          .eq("id", params.taskId);
        await recordActivity({
          taskId: params.taskId,
          actorId: params.actorId,
          eventType: "automation",
          summary: `Automation “${rule.name}” set priority to ${rule.actionValue}`,
          metadata: { ruleId: rule.id },
        });
        break;
      }
      case "request_approval": {
        await supabase
          .from("nf_tasks")
          .update({
            approval_status: "pending",
            approval_requested_by: params.actorId,
            approval_requested_at: new Date().toISOString(),
            approval_note: rule.actionValue || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", params.taskId);
        await recordActivity({
          taskId: params.taskId,
          actorId: params.actorId,
          eventType: "automation",
          summary: `Automation “${rule.name}” requested approval`,
          metadata: { ruleId: rule.id },
        });
        break;
      }
      case "add_checklist_item": {
        const title = rule.actionValue.trim() || "Automation checklist item";
        const { data: existing } = await supabase
          .from("nf_checklist_items")
          .select("position")
          .eq("task_id", params.taskId)
          .order("position", { ascending: false })
          .limit(1);
        const position = (existing?.[0]?.position ?? -1) + 1;
        await supabase.from("nf_checklist_items").insert({
          task_id: params.taskId,
          title,
          position,
          created_by: params.actorId,
        });
        await recordActivity({
          taskId: params.taskId,
          actorId: params.actorId,
          eventType: "automation",
          summary: `Automation “${rule.name}” added checklist item`,
          metadata: { ruleId: rule.id, title },
        });
        break;
      }
      case "notify_managers": {
        const { data: task } = await supabase
          .from("nf_tasks")
          .select("title, workspace_id")
          .eq("id", params.taskId)
          .maybeSingle();
        if (!task) break;

        const { data: workspace } = await supabase
          .from("nf_workspaces")
          .select("team_id")
          .eq("id", task.workspace_id)
          .maybeSingle();

        let managerIds: string[] = [];
        if (workspace?.team_id) {
          const { data: memberships } = await supabase
            .from("nf_team_memberships")
            .select("user_id")
            .eq("team_id", workspace.team_id)
            .eq("is_manager", true);
          managerIds = (memberships ?? []).map((row) => row.user_id as string);
        }

        const recipients = managerIds.filter((id) => id !== params.actorId);
        if (recipients.length > 0) {
          await notifyMany(recipients, {
            eventType: "task_status_changed",
            title: rule.actionValue.trim() || "Automation alert",
            body: (task.title as string) ?? "A task needs attention",
            taskId: params.taskId,
            href: `/app/tasks/${params.taskId}`,
            metadata: { ruleId: rule.id, automation: true },
            idempotencyKey: `auto:${rule.id}:${params.taskId}:${Date.now()}`,
          });
        }
        await recordActivity({
          taskId: params.taskId,
          actorId: params.actorId,
          eventType: "automation",
          summary: `Automation “${rule.name}” notified managers`,
          metadata: { ruleId: rule.id, count: recipients.length },
        });
        break;
      }
      default: {
        const _exhaustive: never = rule.actionType;
        void _exhaustive;
      }
    }
  }
}

export async function spawnRecurringInstanceIfNeeded(params: {
  taskId: string;
  actorId: string;
}): Promise<string | null> {
  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("nf_tasks")
    .select("*")
    .eq("id", params.taskId)
    .maybeSingle();

  if (error || !task) return null;

  const ruleRaw = task.recurrence_rule as string | null;
  if (!ruleRaw || !isRecurrenceRule(ruleRaw)) return null;

  const rule: RecurrenceRule = ruleRaw;
  const interval =
    typeof task.recurrence_interval === "number" && task.recurrence_interval > 0
      ? task.recurrence_interval
      : 1;
  const endsAt = task.recurrence_ends_at
    ? new Date(task.recurrence_ends_at as string)
    : null;

  const baseDue = task.due_at
    ? new Date(task.due_at as string)
    : new Date();
  const nextDue = advanceDueDate(baseDue, rule, interval);
  if (endsAt && nextDue.getTime() > endsAt.getTime()) {
    return null;
  }

  const { data: assignees } = await supabase
    .from("nf_task_assignees")
    .select("user_id")
    .eq("task_id", params.taskId);

  const { data: created, error: createError } = await supabase
    .from("nf_tasks")
    .insert({
      workspace_id: task.workspace_id,
      title: task.title,
      description: task.description ?? "",
      status: "todo",
      priority: task.priority,
      due_at: nextDue.toISOString(),
      created_by: params.actorId,
      recurrence_rule: rule,
      recurrence_interval: interval,
      recurrence_ends_at: task.recurrence_ends_at,
      recurrence_parent_id: (task.recurrence_parent_id as string) ?? params.taskId,
      gear_ref: task.gear_ref,
      gear_url: task.gear_url,
      approval_status: "none",
    })
    .select("id")
    .single();

  if (createError || !created) {
    console.error("spawnRecurringInstanceIfNeeded", createError);
    return null;
  }

  const nextId = created.id as string;
  if (assignees && assignees.length > 0) {
    await supabase.from("nf_task_assignees").insert(
      assignees.map((row) => ({
        task_id: nextId,
        user_id: row.user_id,
        assigned_by: params.actorId,
      })),
    );
  }

  await recordActivity({
    taskId: nextId,
    actorId: params.actorId,
    eventType: "recurrence_spawned",
    summary: `Created recurring instance from completed task`,
    metadata: { parentId: params.taskId, rule, interval },
  });

  await recordActivity({
    taskId: params.taskId,
    actorId: params.actorId,
    eventType: "recurrence_spawned",
    summary: `Spawned next recurring task`,
    metadata: { nextId, rule, interval },
  });

  return nextId;
}

export async function updateTaskM8FieldsAction(input: {
  taskId: string;
  recurrenceRule?: RecurrenceRule | null;
  recurrenceInterval?: number;
  recurrenceEndsAt?: string | null;
  gearRef?: string | null;
  gearUrl?: string | null;
}): Promise<M8ActionResult> {
  const profile = await requireActiveProfile();
  const parsed = z
    .object({
      taskId: pgUuid,
      recurrenceRule: z.enum(RECURRENCE_RULES).nullable().optional(),
      recurrenceInterval: z.number().int().min(1).max(365).optional(),
      recurrenceEndsAt: z.string().nullable().optional(),
      gearRef: z.string().trim().max(120).nullable().optional(),
      gearUrl: z
        .string()
        .trim()
        .max(500)
        .nullable()
        .optional()
        .refine(
          (value) =>
            value == null ||
            value === "" ||
            value.startsWith("http://") ||
            value.startsWith("https://"),
          "Gear URL must be http(s).",
        ),
    })
    .safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: parsed.error.issues[0]?.message ?? "Invalid M8 fields.",
    };
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.recurrenceRule !== undefined) {
    updates.recurrence_rule = parsed.data.recurrenceRule;
  }
  if (parsed.data.recurrenceInterval !== undefined) {
    updates.recurrence_interval = parsed.data.recurrenceInterval;
  }
  if (parsed.data.recurrenceEndsAt !== undefined) {
    updates.recurrence_ends_at = parsed.data.recurrenceEndsAt || null;
  }
  if (parsed.data.gearRef !== undefined) {
    updates.gear_ref = parsed.data.gearRef || null;
  }
  if (parsed.data.gearUrl !== undefined) {
    updates.gear_url = parsed.data.gearUrl || null;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("nf_tasks")
    .update(updates)
    .eq("id", parsed.data.taskId);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordActivity({
    taskId: parsed.data.taskId,
    actorId: profile.userId,
    eventType: "task_updated",
    summary: "Updated recurrence / gear fields",
  });

  revalidateTask(parsed.data.taskId);
  return { ok: true, taskId: parsed.data.taskId };
}

export async function addTaskDependencyAction(input: {
  taskId: string;
  dependsOnTaskId: string;
}): Promise<M8ActionResult> {
  const profile = await requireActiveProfile();
  const parsed = z
    .object({ taskId: pgUuid, dependsOnTaskId: pgUuid })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid dependency." };
  }
  if (parsed.data.taskId === parsed.data.dependsOnTaskId) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: "A task cannot depend on itself.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("nf_task_dependencies").insert({
    task_id: parsed.data.taskId,
    depends_on_task_id: parsed.data.dependsOnTaskId,
    created_by: profile.userId,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        code: "CONFLICT",
        error: "That dependency already exists.",
      };
    }
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordActivity({
    taskId: parsed.data.taskId,
    actorId: profile.userId,
    eventType: "dependency_added",
    summary: "Added a task dependency",
    metadata: { dependsOnTaskId: parsed.data.dependsOnTaskId },
  });

  revalidateTask(parsed.data.taskId);
  return { ok: true, taskId: parsed.data.taskId };
}

export async function removeTaskDependencyAction(
  dependencyId: string,
  taskId: string,
): Promise<M8ActionResult> {
  const profile = await requireActiveProfile();
  if (!pgUuid.safeParse(dependencyId).success || !pgUuid.safeParse(taskId).success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid id." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("nf_task_dependencies")
    .delete()
    .eq("id", dependencyId);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordActivity({
    taskId,
    actorId: profile.userId,
    eventType: "dependency_removed",
    summary: "Removed a task dependency",
    metadata: { dependencyId },
  });

  revalidateTask(taskId);
  return { ok: true, taskId };
}

export async function logTimeEntryAction(input: {
  taskId: string;
  minutes: number;
  note?: string;
}): Promise<M8ActionResult> {
  const profile = await requireActiveProfile();
  const parsed = z
    .object({
      taskId: pgUuid,
      minutes: z.number().int().min(1).max(24 * 60),
      note: z.string().trim().max(500).optional().default(""),
    })
    .safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: parsed.error.issues[0]?.message ?? "Invalid time entry.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("nf_time_entries").insert({
    task_id: parsed.data.taskId,
    user_id: profile.userId,
    minutes: parsed.data.minutes,
    note: parsed.data.note,
  });

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordActivity({
    taskId: parsed.data.taskId,
    actorId: profile.userId,
    eventType: "time_logged",
    summary: `Logged ${parsed.data.minutes} minutes`,
    metadata: { minutes: parsed.data.minutes },
  });

  revalidateTask(parsed.data.taskId);
  return { ok: true, taskId: parsed.data.taskId };
}

export async function deleteTimeEntryAction(input: {
  entryId: string;
  taskId: string;
}): Promise<M8ActionResult> {
  const profile = await requireActiveProfile();
  const parsed = z
    .object({ entryId: pgUuid, taskId: pgUuid })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid entry." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("nf_time_entries")
    .delete()
    .eq("id", parsed.data.entryId);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordActivity({
    taskId: parsed.data.taskId,
    actorId: profile.userId,
    eventType: "time_deleted",
    summary: "Removed a time entry",
    metadata: { entryId: parsed.data.entryId },
  });

  revalidateTask(parsed.data.taskId);
  return { ok: true, taskId: parsed.data.taskId };
}

export async function requestTaskApprovalAction(input: {
  taskId: string;
  note?: string;
}): Promise<M8ActionResult> {
  const profile = await requireActiveProfile();
  const parsed = z
    .object({
      taskId: pgUuid,
      note: z.string().trim().max(500).optional().default(""),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid approval request." };
  }

  const supabase = await createClient();
  const { data: task } = await supabase
    .from("nf_tasks")
    .select("status, title")
    .eq("id", parsed.data.taskId)
    .maybeSingle();

  if (!task) {
    return { ok: false, code: "NOT_FOUND", error: "Task not found." };
  }

  const { error } = await supabase
    .from("nf_tasks")
    .update({
      approval_status: "pending",
      approval_note: parsed.data.note || null,
      approval_requested_by: profile.userId,
      approval_requested_at: new Date().toISOString(),
      approval_decided_by: null,
      approval_decided_at: null,
      status: task.status === "review" ? "review" : "review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.taskId);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  const { data: managers } = await supabase
    .from("nf_user_roles")
    .select("user_id")
    .in("role", ["admin", "line_manager", "hr"]);
  const recipients = [
    ...new Set((managers ?? []).map((row) => row.user_id as string)),
  ].filter((id) => id !== profile.userId);
  if (recipients.length > 0) {
    await notifyMany(recipients, {
      eventType: "task_status_changed",
      title: "Approval requested",
      body: (task.title as string) ?? "A task needs approval",
      taskId: parsed.data.taskId,
      href: `/app/tasks/${parsed.data.taskId}`,
      metadata: { approval: "pending" },
      idempotencyKey: `approval-req:${parsed.data.taskId}:${Date.now()}`,
    });
  }

  await recordActivity({
    taskId: parsed.data.taskId,
    actorId: profile.userId,
    eventType: "approval_requested",
    summary: "Requested approval",
  });

  revalidateTask(parsed.data.taskId);
  return { ok: true, taskId: parsed.data.taskId };
}

export async function decideTaskApprovalAction(input: {
  taskId: string;
  decision: "approved" | "rejected";
  note?: string;
}): Promise<M8ActionResult> {
  const profile = await requireActiveProfile();
  if (
    !rolesAllow(
      profile.roles.filter(isAppRole),
      "assign_tasks",
    )
  ) {
    return {
      ok: false,
      code: "FORBIDDEN",
      error: "Only managers, HR, or admins can decide approvals.",
    };
  }

  const parsed = z
    .object({
      taskId: pgUuid,
      decision: z.enum(["approved", "rejected"]),
      note: z.string().trim().max(500).optional().default(""),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid decision." };
  }

  const supabase = await createClient();
  const approved = parsed.data.decision === "approved";
  const { error } = await supabase
    .from("nf_tasks")
    .update({
      approval_status: parsed.data.decision,
      approval_note: parsed.data.note || null,
      approval_decided_by: profile.userId,
      approval_decided_at: new Date().toISOString(),
      status: approved ? "completed" : "in_progress",
      completed_at: approved ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.taskId);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordActivity({
    taskId: parsed.data.taskId,
    actorId: profile.userId,
    eventType: approved ? "approval_approved" : "approval_rejected",
    summary: approved ? "Approved task" : "Rejected approval",
    metadata: { note: parsed.data.note },
  });

  if (approved) {
    await spawnRecurringInstanceIfNeeded({
      taskId: parsed.data.taskId,
      actorId: profile.userId,
    });
    await runAutomationsForTask({
      taskId: parsed.data.taskId,
      actorId: profile.userId,
      trigger: "task_completed",
      fromStatus: "review",
      toStatus: "completed",
    });
  }

  revalidateTask(parsed.data.taskId);
  return { ok: true, taskId: parsed.data.taskId };
}

export async function createTaskTemplateAction(input: {
  name: string;
  description?: string;
  workspaceKind?: "general" | "hr";
  defaultPriority?: (typeof TASK_PRIORITIES)[number];
  defaultStatus?: (typeof TASK_STATUSES)[number];
  checklistTitles?: string[];
  tags?: string[];
}): Promise<M8ActionResult> {
  const profile = await requireActiveProfile();
  if (!profile.roles.includes("admin") && !profile.roles.includes("hr")) {
    return {
      ok: false,
      code: "FORBIDDEN",
      error: "Only Admin or HR can manage templates.",
    };
  }

  const parsed = z
    .object({
      name: z.string().trim().min(1).max(120),
      description: z.string().trim().max(2000).optional().default(""),
      workspaceKind: z.enum(["general", "hr"]).optional().default("hr"),
      defaultPriority: z.enum(TASK_PRIORITIES).optional().default("medium"),
      defaultStatus: z.enum(TASK_STATUSES).optional().default("todo"),
      checklistTitles: z.array(z.string().trim().min(1).max(200)).max(30).optional().default([]),
      tags: z.array(z.string().trim().min(1).max(40)).max(10).optional().default([]),
    })
    .safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: parsed.error.issues[0]?.message ?? "Invalid template.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_task_templates")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description,
      workspace_kind: parsed.data.workspaceKind,
      default_priority: parsed.data.defaultPriority,
      default_status: parsed.data.defaultStatus,
      checklist_titles: parsed.data.checklistTitles,
      tags: parsed.data.tags,
      created_by: profile.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, code: "INTERNAL", error: error?.message ?? "Create failed." };
  }

  revalidatePath("/app/people");
  revalidatePath("/app/admin");
  return { ok: true, templateId: data.id as string };
}

export async function archiveTaskTemplateAction(
  templateId: string,
): Promise<M8ActionResult> {
  const profile = await requireActiveProfile();
  if (!profile.roles.includes("admin") && !profile.roles.includes("hr")) {
    return {
      ok: false,
      code: "FORBIDDEN",
      error: "Only Admin or HR can manage templates.",
    };
  }
  if (!pgUuid.safeParse(templateId).success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid template." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("nf_task_templates")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", templateId);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  revalidatePath("/app/people");
  return { ok: true, templateId };
}

export async function createTaskFromTemplateAction(input: {
  templateId: string;
  workspaceId: string;
  assigneeIds?: string[];
}): Promise<M8ActionResult> {
  const profile = await requireActiveProfile();
  const parsed = z
    .object({
      templateId: pgUuid,
      workspaceId: pgUuid,
      assigneeIds: z.array(pgUuid).optional().default([]),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid template create." };
  }

  const supabase = await createClient();
  const { data: template, error: templateError } = await supabase
    .from("nf_task_templates")
    .select("*")
    .eq("id", parsed.data.templateId)
    .eq("is_active", true)
    .maybeSingle();

  if (templateError || !template) {
    return { ok: false, code: "NOT_FOUND", error: "Template not found." };
  }

  const { data: task, error: createError } = await supabase
    .from("nf_tasks")
    .insert({
      workspace_id: parsed.data.workspaceId,
      title: template.name as string,
      description: (template.description as string) ?? "",
      status: template.default_status,
      priority: template.default_priority,
      created_by: profile.userId,
      approval_status: "none",
    })
    .select("id")
    .single();

  if (createError || !task) {
    return {
      ok: false,
      code: "INTERNAL",
      error: createError?.message ?? "Could not create task.",
    };
  }

  const taskId = task.id as string;
  const assignees =
    parsed.data.assigneeIds.length > 0
      ? parsed.data.assigneeIds
      : [profile.userId];

  await supabase.from("nf_task_assignees").insert(
    assignees.map((userId) => ({
      task_id: taskId,
      user_id: userId,
      assigned_by: profile.userId,
    })),
  );

  const checklist = Array.isArray(template.checklist_titles)
    ? (template.checklist_titles as unknown[])
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  if (checklist.length > 0) {
    await supabase.from("nf_checklist_items").insert(
      checklist.map((title, index) => ({
        task_id: taskId,
        title,
        position: index,
        created_by: profile.userId,
      })),
    );
  }

  await recordActivity({
    taskId,
    actorId: profile.userId,
    eventType: "template_spawned",
    summary: `Created from template “${template.name as string}”`,
    metadata: { templateId: parsed.data.templateId },
  });

  await runAutomationsForTask({
    taskId,
    actorId: profile.userId,
    trigger: "task_created",
  });

  revalidateTask(taskId);
  revalidatePath("/app/people");
  return { ok: true, taskId };
}

export async function createAutomationRuleAction(input: {
  name: string;
  triggerType: (typeof AUTOMATION_TRIGGERS)[number];
  fromStatus?: TaskStatus | null;
  toStatus?: TaskStatus | null;
  actionType: (typeof AUTOMATION_ACTIONS)[number];
  actionValue?: string;
}): Promise<M8ActionResult> {
  const profile = await requireActiveProfile();
  if (!profile.roles.includes("admin") && !profile.roles.includes("hr")) {
    return {
      ok: false,
      code: "FORBIDDEN",
      error: "Only Admin or HR can manage automation rules.",
    };
  }

  const parsed = z
    .object({
      name: z.string().trim().min(1).max(120),
      triggerType: z.enum(AUTOMATION_TRIGGERS),
      fromStatus: z.enum(TASK_STATUSES).nullable().optional(),
      toStatus: z.enum(TASK_STATUSES).nullable().optional(),
      actionType: z.enum(AUTOMATION_ACTIONS),
      actionValue: z.string().trim().max(500).optional().default(""),
    })
    .safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: parsed.error.issues[0]?.message ?? "Invalid rule.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_automation_rules")
    .insert({
      name: parsed.data.name,
      trigger_type: parsed.data.triggerType,
      from_status: parsed.data.fromStatus ?? null,
      to_status: parsed.data.toStatus ?? null,
      action_type: parsed.data.actionType,
      action_value: parsed.data.actionValue,
      created_by: profile.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, code: "INTERNAL", error: error?.message ?? "Create failed." };
  }

  revalidatePath("/app/people");
  revalidatePath("/app/admin");
  return { ok: true, ruleId: data.id as string };
}

export async function setAutomationRuleActiveAction(input: {
  ruleId: string;
  isActive: boolean;
}): Promise<M8ActionResult> {
  const profile = await requireActiveProfile();
  if (!profile.roles.includes("admin") && !profile.roles.includes("hr")) {
    return {
      ok: false,
      code: "FORBIDDEN",
      error: "Only Admin or HR can manage automation rules.",
    };
  }

  const parsed = z
    .object({ ruleId: pgUuid, isActive: z.boolean() })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid rule." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("nf_automation_rules")
    .update({
      is_active: parsed.data.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.ruleId);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  revalidatePath("/app/people");
  return { ok: true, ruleId: parsed.data.ruleId };
}
