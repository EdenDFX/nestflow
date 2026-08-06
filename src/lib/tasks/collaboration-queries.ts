import { createClient } from "@/lib/supabase/server";
import type {
  ActivityEvent,
  ChecklistItem,
  TaskAttachment,
  TaskCollaboration,
  TaskComment,
} from "@/lib/tasks/collaboration-types";

type ProfileRow = {
  id: string;
  full_name: string | null;
  nest_id: string | null;
};

async function loadProfiles(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, ProfileRow>();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, nest_id")
    .in("id", userIds);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row: ProfileRow) => [row.id, row]));
}

export async function getTaskCollaboration(
  taskId: string,
): Promise<TaskCollaboration> {
  const supabase = await createClient();

  const [
    { data: checklistRows, error: checklistError },
    { data: commentRows, error: commentError },
    { data: attachmentRows, error: attachmentError },
    { data: activityRows, error: activityError },
  ] = await Promise.all([
    supabase
      .from("nf_checklist_items")
      .select("*")
      .eq("task_id", taskId)
      .order("position", { ascending: true }),
    supabase
      .from("nf_comments")
      .select("*")
      .eq("task_id", taskId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("nf_attachments")
      .select("*")
      .eq("task_id", taskId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("nf_activity_events")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (checklistError) throw new Error(checklistError.message);
  if (commentError) throw new Error(commentError.message);
  if (attachmentError) throw new Error(attachmentError.message);
  if (activityError) throw new Error(activityError.message);

  const userIds = [
    ...new Set([
      ...(commentRows ?? []).map((row) => row.author_id as string),
      ...(attachmentRows ?? []).map((row) => row.uploaded_by as string),
      ...(activityRows ?? [])
        .map((row) => row.actor_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ]),
  ];

  const profiles = await loadProfiles(userIds);

  const checklist: ChecklistItem[] = (checklistRows ?? []).map((row) => ({
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    isDone: row.is_done,
    position: row.position,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const comments: TaskComment[] = (commentRows ?? []).map((row) => {
    const profile = profiles.get(row.author_id);
    return {
      id: row.id,
      taskId: row.task_id,
      authorId: row.author_id,
      authorName: profile?.full_name ?? null,
      authorNestId: profile?.nest_id ?? null,
      body: row.body,
      mentionedUserIds: row.mentioned_user_ids ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  const attachments: TaskAttachment[] = (attachmentRows ?? []).map((row) => {
    const profile = profiles.get(row.uploaded_by);
    return {
      id: row.id,
      taskId: row.task_id,
      uploadedBy: row.uploaded_by,
      uploaderName: profile?.full_name ?? null,
      objectKey: row.object_key,
      fileName: row.file_name,
      mimeType: row.mime_type,
      sizeBytes: Number(row.size_bytes),
      createdAt: row.created_at,
    };
  });

  const activity: ActivityEvent[] = (activityRows ?? []).map((row) => {
    const profile = row.actor_id ? profiles.get(row.actor_id) : null;
    return {
      id: row.id,
      taskId: row.task_id,
      actorId: row.actor_id,
      actorName: profile?.full_name ?? null,
      eventType: row.event_type,
      summary: row.summary,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      createdAt: row.created_at,
    };
  });

  return { checklist, comments, attachments, activity };
}
