"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { MentionField } from "@/components/tasks/mention-field";
import { Button } from "@/components/ui/button";
import {
  markNotificationReadAction,
} from "@/lib/notifications/actions";
import {
  INBOX_FILTER_LABELS,
  INBOX_FILTERS,
  matchesInboxFilter,
  type InboxFilter,
  type TaskInboxSummary,
} from "@/lib/notifications/inbox";
import { eventLabel, type NestFlowNotification } from "@/lib/notifications/types";
import { addCommentAction } from "@/lib/tasks/collaboration-actions";
import { changeTaskStatusAction } from "@/lib/tasks/actions";
import { canTransition, type TaskAssignee } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

export function NotificationInbox({
  items,
  filter,
  taskSummaries,
  people = [],
}: {
  items: NestFlowNotification[];
  filter: InboxFilter;
  taskSummaries: Record<string, TaskInboxSummary>;
  people?: TaskAssignee[];
}) {
  const visible = items.filter((item) => matchesInboxFilter(item, filter));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {INBOX_FILTERS.map((id) => (
          <Button key={id} type="button" size="sm" variant={filter === id ? "default" : "outline"} asChild>
            <Link href={id === "all" ? "/app/notifications" : `/app/notifications?filter=${id}`}>
              {INBOX_FILTER_LABELS[id]}
            </Link>
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
          {filter === "mentions"
            ? "No mentions yet."
            : filter === "unread"
              ? "You are caught up."
              : "No notifications in this filter."}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((item) => (
            <InboxRow
              key={item.id}
              item={item}
              summary={item.taskId ? taskSummaries[item.taskId] : undefined}
              people={people}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function InboxRow({
  item,
  summary,
  people,
}: {
  item: NestFlowNotification;
  summary?: TaskInboxSummary;
  people: TaskAssignee[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const [openComposer, setOpenComposer] = useState(false);
  const unread = !item.readAt;
  const href =
    item.href ?? (item.taskId ? `/app/tasks/${item.taskId}` : "/app/notifications");
  const canComplete =
    summary !== undefined && canTransition(summary.status, "completed");

  function markRead() {
    if (!unread) return;
    void markNotificationReadAction(item.id);
  }

  function complete() {
    if (!item.taskId) return;
    startTransition(async () => {
      const result = await changeTaskStatusAction({
        taskId: item.taskId!,
        status: "completed",
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not complete task.");
        return;
      }
      markRead();
      toast.success("Task completed.");
      router.refresh();
    });
  }

  function sendComment() {
    if (!item.taskId || !comment.trim()) return;
    startTransition(async () => {
      const result = await addCommentAction({
        taskId: item.taskId!,
        body: comment.trim(),
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not comment.");
        return;
      }
      markRead();
      setComment("");
      setOpenComposer(false);
      toast.success("Comment posted.");
      router.refresh();
    });
  }

  return (
    <li
      className={cn(
        "rounded-xl border border-border/80 px-3 py-3",
        unread && "bg-primary/5",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Link
          href={href}
          onClick={markRead}
          className="min-w-0 flex-1 space-y-0.5"
        >
          <p className="font-medium">{item.title}</p>
          {item.body ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {item.body}
            </p>
          ) : null}
          <p className="text-[11px] text-muted-foreground">
            {eventLabel(item.eventType)} ·{" "}
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            {summary ? ` · ${summary.title}` : ""}
          </p>
        </Link>
        <div className="flex flex-wrap gap-2">
          {item.taskId ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href={`/app/tasks/${item.taskId}`} onClick={markRead}>
                Open
              </Link>
            </Button>
          ) : null}
          {canComplete ? (
            <Button
              type="button"
              size="sm"
              onClick={complete}
              disabled={pending}
            >
              Complete
            </Button>
          ) : null}
          {item.taskId ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOpenComposer((open) => !open)}
            >
              Comment
            </Button>
          ) : null}
        </div>
      </div>
      {openComposer ? (
        <div className="mt-3 space-y-2">
          <MentionField
            people={people}
            value={comment}
            onChange={setComment}
            rows={3}
            placeholder="Write a comment. Type @ to mention a Nest ID."
            disabled={pending}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={sendComment}
              disabled={pending || !comment.trim()}
            >
              Post
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOpenComposer(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
