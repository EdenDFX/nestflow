import { createClient } from "@/lib/supabase/server";
import { listNotifications } from "@/lib/notifications/queries";
import type { DiscussionThread } from "@/lib/tasks/discussion-shared";
import {
  isTaskStatus,
} from "@/lib/tasks/types";

export type { DiscussionThread } from "@/lib/tasks/discussion-shared";
export { involvementLabel, taskStatusLabel } from "@/lib/tasks/discussion-shared";

type CommentRow = {
  task_id: string;
  body: string;
  created_at: string;
  author_id: string;
  mentioned_user_ids: string[] | null;
};

type TaskRow = {
  id: string;
  title: string;
  status: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  nest_id: string | null;
};

export async function listDiscussionThreads(
  userId: string,
): Promise<DiscussionThread[]> {
  const supabase = await createClient();

  const { data: commentRows, error: commentError } = await supabase
    .from("nf_comments")
    .select("task_id, body, created_at, author_id, mentioned_user_ids")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (commentError) {
    throw new Error(commentError.message);
  }

  const involvedComments = (commentRows ?? []).filter((row: CommentRow) => {
    const mentioned = row.mentioned_user_ids ?? [];
    return row.author_id === userId || mentioned.includes(userId);
  });

  if (involvedComments.length === 0) {
    return [];
  }

  const latestByTask = new Map<
    string,
    {
      comment: CommentRow;
      mentioned: boolean;
      commented: boolean;
    }
  >();

  for (const comment of involvedComments) {
    const existing = latestByTask.get(comment.task_id);
    const mentioned = (comment.mentioned_user_ids ?? []).includes(userId);
    const commented = comment.author_id === userId;

    if (!existing) {
      latestByTask.set(comment.task_id, {
        comment,
        mentioned,
        commented,
      });
      continue;
    }

    latestByTask.set(comment.task_id, {
      comment: existing.comment,
      mentioned: existing.mentioned || mentioned,
      commented: existing.commented || commented,
    });
  }

  const taskIds = [...latestByTask.keys()];

  const [{ data: taskRows, error: taskError }, { data: assigneeRows, error: assigneeError }] =
    await Promise.all([
      supabase
        .from("nf_tasks")
        .select("id, title, status")
        .in("id", taskIds)
        .is("archived_at", null),
      supabase
        .from("nf_task_assignees")
        .select("task_id, user_id")
        .in("task_id", taskIds)
        .eq("user_id", userId),
    ]);

  if (taskError) {
    throw new Error(taskError.message);
  }

  if (assigneeError) {
    throw new Error(assigneeError.message);
  }

  const tasksById = new Map(
    (taskRows ?? []).map((row: TaskRow) => [row.id, row]),
  );
  const assigneeTaskIds = new Set(
    (assigneeRows ?? []).map((row) => row.task_id as string),
  );

  const authorIds = [
    ...new Set(
      [...latestByTask.values()].map(({ comment }) => comment.author_id),
    ),
  ];

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, nest_id")
    .in("id", authorIds);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profilesById = new Map(
    (profileRows ?? []).map((row: ProfileRow) => [row.id, row]),
  );

  const threads: DiscussionThread[] = [];

  for (const [taskId, entry] of latestByTask) {
    const task = tasksById.get(taskId);
    if (!task || !isTaskStatus(task.status)) {
      continue;
    }

    const author = profilesById.get(entry.comment.author_id);
    const involvement =
      entry.mentioned && entry.commented
        ? "both"
        : entry.mentioned
          ? "mentioned"
          : "commented";

    threads.push({
      taskId,
      taskTitle: task.title,
      taskStatus: task.status,
      latestCommentBody: entry.comment.body,
      latestCommentAt: entry.comment.created_at,
      latestAuthorName: author?.full_name ?? null,
      latestAuthorNestId: author?.nest_id ?? null,
      isAssignee: assigneeTaskIds.has(taskId),
      involvement,
    });
  }

  threads.sort(
    (left, right) =>
      new Date(right.latestCommentAt).getTime() -
      new Date(left.latestCommentAt).getTime(),
  );

  return threads;
}

export async function getDashboardDiscussionSummary(userId: string): Promise<{
  discussionThreads: DiscussionThread[];
  unreadMentionCount: number;
}> {
  const [discussionThreads, notifications] = await Promise.all([
    listDiscussionThreads(userId),
    listNotifications(40),
  ]);

  const unreadMentionCount = notifications.items.filter(
    (item) => item.eventType === "task_mentioned" && item.readAt === null,
  ).length;

  return { discussionThreads, unreadMentionCount };
}
