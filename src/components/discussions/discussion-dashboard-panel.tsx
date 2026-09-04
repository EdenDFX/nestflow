import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { ArrowUpRightIcon } from "@/components/icons/arrow-up-right";

import { StatusBadge } from "@/components/tasks/status-badge";
import {
  involvementLabel,
  type DiscussionThread,
} from "@/lib/tasks/discussion-shared";

export function DiscussionDashboardPanel({
  threads,
  unreadMentionCount = 0,
  limit = 5,
  embedded = false,
}: {
  threads: DiscussionThread[];
  unreadMentionCount?: number;
  limit?: number;
  embedded?: boolean;
}) {
  const sorted = [...threads].sort((left, right) => {
    const leftMention =
      left.involvement === "mentioned" || left.involvement === "both" ? 0 : 1;
    const rightMention =
      right.involvement === "mentioned" || right.involvement === "both" ? 0 : 1;
    if (leftMention !== rightMention) {
      return leftMention - rightMention;
    }
    return (
      new Date(right.latestCommentAt).getTime() -
      new Date(left.latestCommentAt).getTime()
    );
  });

  const visible = sorted.slice(0, limit);

  return (
    <section
      className={
        embedded
          ? "space-y-3"
          : "rounded-2xl border border-border/80 bg-card"
      }
    >
      {embedded ? (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/notifications?filter=mentions"
            className="inline-flex h-8 items-center rounded-full bg-background/70 px-3 text-xs font-medium transition-colors hover:bg-background"
          >
            Mention inbox
          </Link>
          <Link
            href="/app/discussions"
            className="inline-flex h-8 items-center gap-1 rounded-full bg-background/70 px-3 text-xs font-medium transition-colors hover:bg-background"
          >
            All discussions
            <ArrowRightIcon className="inline-flex" size={12} />
          </Link>
        </div>
      ) : (
      <header className="flex flex-col gap-3 border-b border-border/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg font-semibold">
              Mentions & discussions
            </h2>
            {unreadMentionCount > 0 ? (
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                {unreadMentionCount} unread mention
                {unreadMentionCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Task threads where you were @mentioned or joined the chat.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/notifications?filter=mentions"
            className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            Mention inbox
          </Link>
          <Link
            href="/app/discussions"
            className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            All discussions
            <ArrowRightIcon className="inline-flex" size={12} />
          </Link>
        </div>
      </header>
      )}

      {visible.length === 0 ? (
        <p className={embedded ? "text-sm text-muted-foreground" : "px-5 py-8 text-sm text-muted-foreground"}>
          No mentions or discussion threads yet. When someone @mentions you on a
          task, it appears here.
        </p>
      ) : (
        <ul className={embedded ? "space-y-2" : "divide-y divide-border/70"}>
          {visible.map((thread) => (
            <li key={thread.taskId}>
              <Link
                href={`/app/tasks/${thread.taskId}`}
                className={
                  embedded
                    ? "group flex items-start justify-between gap-3 rounded-2xl bg-background/70 px-4 py-3 transition-colors hover:bg-background"
                    : "group flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40"
                }
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={thread.taskStatus} />
                    <span className="rounded-full border border-border/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {involvementLabel(thread)}
                    </span>
                  </div>
                  <p className="truncate font-medium group-hover:text-primary">
                    {thread.taskTitle}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {thread.latestCommentBody}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {thread.latestAuthorName ??
                      thread.latestAuthorNestId ??
                      "Someone"}{" "}
                    · {new Date(thread.latestCommentAt).toLocaleString()}
                  </p>
                </div>
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-foreground">
                  <ArrowUpRightIcon className="inline-flex" size={14} aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
