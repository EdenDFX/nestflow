import Link from "next/link";

import { ArrowUpRightIcon } from "@/components/icons/arrow-up-right";

import { StatusBadge } from "@/components/tasks/status-badge";
import {
  involvementLabel,
  type DiscussionThread,
} from "@/lib/tasks/discussion-shared";

export function DiscussionInbox({ threads }: { threads: DiscussionThread[] }) {
  if (threads.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-border/80 p-10 text-center">
        <p className="font-heading text-lg font-semibold">No discussions yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          When someone @mentions you or you comment on a task you are not
          assigned to, the thread appears here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {threads.map((thread) => (
        <li key={thread.taskId}>
          <Link
            href={`/app/tasks/${thread.taskId}`}
            className="group flex flex-col gap-3 rounded-[1.75rem] border border-border/80 bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/20 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={thread.taskStatus} />
                <span className="rounded-full border border-border/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {involvementLabel(thread)}
                </span>
                {thread.isAssignee ? (
                  <span className="rounded-full border border-primary/40 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    Also assigned
                  </span>
                ) : (
                  <span className="rounded-full border border-border/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Discussion access
                  </span>
                )}
              </div>

              <p className="font-heading text-xl font-semibold tracking-tight group-hover:underline">
                {thread.taskTitle}
              </p>

              <p className="line-clamp-2 text-sm text-muted-foreground">
                {thread.latestCommentBody}
              </p>

              <p className="text-xs text-muted-foreground">
                {thread.latestAuthorName ?? thread.latestAuthorNestId ?? "Someone"}{" "}
                · {new Date(thread.latestCommentAt).toLocaleString()}
              </p>
            </div>

            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-foreground">
              <ArrowUpRightIcon className="inline-flex" size={16} aria-hidden />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
