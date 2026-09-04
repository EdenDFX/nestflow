"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { listMentionablePeopleForTask } from "@/lib/admin/queries";
import { requireActiveProfile } from "@/lib/auth/session";
import { notifyMany } from "@/lib/notifications/notify";
import {
  assertAllowedAttachment,
  buildObjectKey,
  createDownloadUrl,
  createUploadUrl,
  deleteObject,
  getAttachmentLimits,
  isR2Configured,
} from "@/lib/storage/r2";
import { createClient } from "@/lib/supabase/server";
import { recordActivity } from "@/lib/tasks/activity";
import { parseMentions } from "@/lib/tasks/collaboration-types";

export type CollabActionResult = {
  ok: boolean;
  error?: string;
  code?: string;
  uploadUrl?: string;
  downloadUrl?: string;
  attachmentId?: string;
  objectKey?: string;
};

function revalidateTask(taskId: string) {
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath("/app");
  revalidatePath("/app/my-tasks");
  revalidatePath("/app/board");
  revalidatePath("/app/list");
  revalidatePath("/app/work");
  revalidatePath("/app/discussions");
  revalidatePath("/app/notifications");
}

export async function addChecklistItemAction(input: {
  taskId: string;
  title: string;
}): Promise<CollabActionResult> {
  const profile = await requireActiveProfile();
  const parsed = z
    .object({
      taskId: z.string().uuid(),
      title: z.string().trim().min(1).max(200),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid checklist item." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("nf_checklist_items")
    .select("position")
    .eq("task_id", parsed.data.taskId)
    .order("position", { ascending: false })
    .limit(1);

  const position = (existing?.[0]?.position ?? -1) + 1;

  const { error } = await supabase.from("nf_checklist_items").insert({
    task_id: parsed.data.taskId,
    title: parsed.data.title,
    position,
    created_by: profile.userId,
  });

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordActivity({
    taskId: parsed.data.taskId,
    actorId: profile.userId,
    eventType: "checklist_added",
    summary: `Added checklist item "${parsed.data.title}"`,
  });

  revalidateTask(parsed.data.taskId);
  return { ok: true };
}

export async function toggleChecklistItemAction(input: {
  itemId: string;
  taskId: string;
  isDone: boolean;
}): Promise<CollabActionResult> {
  const profile = await requireActiveProfile();
  const parsed = z
    .object({
      itemId: z.string().uuid(),
      taskId: z.string().uuid(),
      isDone: z.boolean(),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid checklist update." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("nf_checklist_items")
    .update({
      is_done: parsed.data.isDone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.itemId)
    .eq("task_id", parsed.data.taskId);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordActivity({
    taskId: parsed.data.taskId,
    actorId: profile.userId,
    eventType: "checklist_toggled",
    summary: parsed.data.isDone
      ? "Completed a checklist item"
      : "Reopened a checklist item",
  });

  revalidateTask(parsed.data.taskId);
  return { ok: true };
}

export async function removeChecklistItemAction(input: {
  itemId: string;
  taskId: string;
}): Promise<CollabActionResult> {
  const profile = await requireActiveProfile();
  const parsed = z
    .object({
      itemId: z.string().uuid(),
      taskId: z.string().uuid(),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid checklist item." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("nf_checklist_items")
    .delete()
    .eq("id", parsed.data.itemId)
    .eq("task_id", parsed.data.taskId);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordActivity({
    taskId: parsed.data.taskId,
    actorId: profile.userId,
    eventType: "checklist_removed",
    summary: "Removed a checklist item",
  });

  revalidateTask(parsed.data.taskId);
  return { ok: true };
}

export async function addCommentAction(input: {
  taskId: string;
  body: string;
}): Promise<CollabActionResult> {
  const profile = await requireActiveProfile();
  const parsed = z
    .object({
      taskId: z.string().uuid(),
      body: z.string().trim().min(1).max(5000),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Comment cannot be empty." };
  }

  const people = await listMentionablePeopleForTask(parsed.data.taskId, profile);
  const mentionedUserIds = parseMentions(parsed.data.body, people);

  const supabase = await createClient();
  const { error } = await supabase.from("nf_comments").insert({
    task_id: parsed.data.taskId,
    author_id: profile.userId,
    body: parsed.data.body,
    mentioned_user_ids: mentionedUserIds,
  });

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordActivity({
    taskId: parsed.data.taskId,
    actorId: profile.userId,
    eventType: "comment_added",
    summary:
      mentionedUserIds.length > 0
        ? `Commented and mentioned ${mentionedUserIds.length} people`
        : "Added a comment",
    metadata: { mentionedUserIds },
  });

  if (mentionedUserIds.length > 0) {
    const { data: taskRow } = await supabase
      .from("nf_tasks")
      .select("title")
      .eq("id", parsed.data.taskId)
      .maybeSingle();

    const actorLabel = profile.fullName ?? profile.nestId ?? "Someone";
    await notifyMany(mentionedUserIds, {
      eventType: "task_mentioned",
      title: `${actorLabel} mentioned you`,
        body: taskRow?.title
        ? `On "${taskRow.title}": ${parsed.data.body.slice(0, 140)}`
        : parsed.data.body.slice(0, 140),
      taskId: parsed.data.taskId,
      href: `/app/tasks/${parsed.data.taskId}`,
      metadata: { mentionedBy: profile.userId },
    });
  }

  revalidateTask(parsed.data.taskId);
  return { ok: true };
}

export async function createAttachmentUploadUrlAction(input: {
  taskId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<CollabActionResult> {
  const profile = await requireActiveProfile();

  if (!isR2Configured()) {
    return {
      ok: false,
      code: "INTERNAL",
      error: "Cloudflare R2 is not configured yet. Add R2 env vars to enable uploads.",
    };
  }

  const parsed = z
    .object({
      taskId: z.string().uuid(),
      fileName: z.string().trim().min(1).max(200),
      mimeType: z.string().trim().min(1),
      sizeBytes: z.number().int().positive(),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid attachment." };
  }

  try {
    assertAllowedAttachment(parsed.data.mimeType, parsed.data.sizeBytes);
  } catch (error) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: error instanceof Error ? error.message : "Invalid attachment.",
    };
  }

  const attachmentId = randomUUID();
  const objectKey = buildObjectKey({
    taskId: parsed.data.taskId,
    attachmentId,
    fileName: parsed.data.fileName,
  });

  const supabase = await createClient();
  const { error } = await supabase.from("nf_attachments").insert({
    id: attachmentId,
    task_id: parsed.data.taskId,
    uploaded_by: profile.userId,
    object_key: objectKey,
    file_name: parsed.data.fileName,
    mime_type: parsed.data.mimeType,
    size_bytes: parsed.data.sizeBytes,
  });

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  try {
    const uploadUrl = await createUploadUrl({
      objectKey,
      mimeType: parsed.data.mimeType,
    });

    await recordActivity({
      taskId: parsed.data.taskId,
      actorId: profile.userId,
      eventType: "attachment_added",
      summary: `Attached "${parsed.data.fileName}"`,
      metadata: { attachmentId, sizeBytes: parsed.data.sizeBytes },
    });

    revalidateTask(parsed.data.taskId);
    return { ok: true, uploadUrl, attachmentId, objectKey };
  } catch (error) {
    await supabase.from("nf_attachments").delete().eq("id", attachmentId);
    return {
      ok: false,
      code: "INTERNAL",
      error: error instanceof Error ? error.message : "Could not create upload URL.",
    };
  }
}

export async function createAttachmentDownloadUrlAction(input: {
  attachmentId: string;
}): Promise<CollabActionResult> {
  await requireActiveProfile();

  if (!isR2Configured()) {
    return {
      ok: false,
      code: "INTERNAL",
      error: "Cloudflare R2 is not configured yet.",
    };
  }

  const parsed = z.object({ attachmentId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid attachment." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_attachments")
    .select("object_key, file_name, deleted_at")
    .eq("id", parsed.data.attachmentId)
    .maybeSingle();

  if (error || !data || data.deleted_at) {
    return { ok: false, code: "NOT_FOUND", error: "Attachment not found." };
  }

  try {
    const downloadUrl = await createDownloadUrl({
      objectKey: data.object_key,
      fileName: data.file_name,
    });
    return { ok: true, downloadUrl };
  } catch (error) {
    return {
      ok: false,
      code: "INTERNAL",
      error: error instanceof Error ? error.message : "Could not create download URL.",
    };
  }
}

export async function removeAttachmentAction(input: {
  attachmentId: string;
  taskId: string;
}): Promise<CollabActionResult> {
  const profile = await requireActiveProfile();
  const parsed = z
    .object({
      attachmentId: z.string().uuid(),
      taskId: z.string().uuid(),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid attachment." };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("nf_attachments")
    .select("object_key, file_name")
    .eq("id", parsed.data.attachmentId)
    .eq("task_id", parsed.data.taskId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError || !existing) {
    return {
      ok: false,
      code: "NOT_FOUND",
      error: fetchError?.message ?? "Attachment not found.",
    };
  }

  const { error } = await supabase
    .from("nf_attachments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.attachmentId)
    .eq("task_id", parsed.data.taskId)
    .is("deleted_at", null);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  try {
    await deleteObject(existing.object_key);
  } catch (error) {
    console.error("R2 delete failed; metadata soft-deleted", error);
  }

  await recordActivity({
    taskId: parsed.data.taskId,
    actorId: profile.userId,
    eventType: "attachment_removed",
    summary: `Removed attachment "${existing.file_name}"`,
  });

  revalidateTask(parsed.data.taskId);
  return { ok: true };
}

export async function getAttachmentConfigAction() {
  await requireActiveProfile();
  return {
    configured: isR2Configured(),
    ...getAttachmentLimits(),
  };
}
