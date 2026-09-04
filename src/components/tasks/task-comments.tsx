"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { toast } from "sonner";

import { MentionField } from "@/components/tasks/mention-field";
import { Button } from "@/components/ui/button";
import { addCommentAction } from "@/lib/tasks/collaboration-actions";
import type { TaskComment } from "@/lib/tasks/collaboration-types";
import type { TaskAssignee } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

function authorInitials(name: string | null, nestId: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return (nestId ?? "?").slice(0, 2).toUpperCase();
}

function formatMessageTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function CommentBody({
  body,
  people,
}: {
  body: string;
  people: TaskAssignee[];
}) {
  const nestByToken = useMemo(() => {
    const map = new Map<string, TaskAssignee>();
    for (const person of people) {
      if (person.nestId) {
        map.set(person.nestId.toLowerCase(), person);
      }
    }
    return map;
  }, [people]);

  const parts = body.split(/(@[A-Za-z0-9._-]+)/g);

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
      {parts.map((part, index) => {
        if (!part.startsWith("@")) {
          return <span key={index}>{part}</span>;
        }
        const token = part.slice(1).toLowerCase();
        const person = nestByToken.get(token);
        return (
          <span
            key={index}
            className="rounded-sm bg-primary/10 px-0.5 font-medium text-primary"
          >
            @{person?.nestId ?? part.slice(1)}
          </span>
        );
      })}
    </p>
  );
}

function CommentBubble({
  comment,
  people,
  onReply,
}: {
  comment: TaskComment;
  people: TaskAssignee[];
  onReply: (comment: TaskComment) => void;
}) {
  const author = comment.authorName ?? comment.authorNestId ?? "NestFlow user";
  const subtitle = comment.authorNestId ?? comment.authorName ?? null;

  return (
    <article className="group flex gap-3">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
        aria-hidden
      >
        {authorInitials(comment.authorName, comment.authorNestId)}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-sm font-semibold">{author}</p>
          {subtitle && subtitle !== author ? (
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          ) : null}
          <time
            className="text-[11px] text-muted-foreground"
            dateTime={comment.createdAt}
          >
            {formatMessageTime(comment.createdAt)}
          </time>
        </div>
        <div className="rounded-2xl rounded-tl-md border border-border/60 bg-muted/40 px-3 py-2.5">
          <CommentBody body={comment.body} people={people} />
        </div>
        <button
          type="button"
          className="text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary focus-visible:opacity-100"
          onClick={() => onReply(comment)}
        >
          Reply
        </button>
      </div>
    </article>
  );
}

export function TaskComments({
  taskId,
  comments,
  people = [],
  variant = "default",
}: {
  taskId: string;
  comments: TaskComment[];
  people?: TaskAssignee[];
  variant?: "default" | "pane";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const pane = variant === "pane";

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [comments.length]);

  function replyTo(comment: TaskComment) {
    const nest = comment.authorNestId;
    if (!nest) {
      composerRef.current?.focus();
      return;
    }
    const prefix = `@${nest} `;
    setBody((current) => {
      if (current.includes(prefix)) return current;
      return current.trim() ? `${current.trim()} ${prefix}` : prefix;
    });
    composerRef.current?.focus();
  }

  function submit(event?: React.FormEvent) {
    event?.preventDefault();
    if (!body.trim() || pending) return;
    startTransition(async () => {
      const result = await addCommentAction({ taskId, body });
      if (!result.ok) {
        toast.error(result.error ?? "Could not add comment.");
        return;
      }
      setBody("");
      toast.success("Message sent.");
      router.refresh();
    });
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  }

  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border border-border/80 bg-card",
        pane && "overflow-hidden shadow-sm",
      )}
    >
      <div className="border-b border-border/70 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">Discussion</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {comments.length} message{comments.length === 1 ? "" : "s"}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Reply in the thread below. Type @ to mention someone by Nest ID.
        </p>
      </div>

      <div
        ref={listRef}
        className={cn(
          "space-y-4 overflow-y-auto px-4 py-4",
          pane ? "max-h-[min(36dvh,300px)]" : "max-h-96",
        )}
      >
        {comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center">
            <p className="text-sm font-medium">No messages yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start the conversation or reply to a mention using the box below.
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentBubble
              key={comment.id}
              comment={comment}
              people={people}
              onReply={replyTo}
            />
          ))
        )}
      </div>

      <form
        onSubmit={submit}
        className={cn(
          "relative z-10 space-y-3 border-t border-border/70 bg-card px-4 py-4",
          pane &&
            "sticky bottom-0 shadow-[0_-10px_30px_-16px_rgba(0,0,0,0.35)]",
        )}
      >
        <div className="space-y-1.5">
          <label
            htmlFor={`task-comment-${taskId}`}
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            Your reply
          </label>
          <MentionField
            people={people}
            taskId={taskId}
            value={body}
            onChange={setBody}
            rows={pane ? 3 : 2}
            id={`task-comment-${taskId}`}
            placeholder="Write a reply… Use @NestID to mention someone."
            disabled={pending}
            textareaRef={composerRef}
            onKeyDown={onComposerKeyDown}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            {pane ? "⌘/Ctrl + Enter to send" : "Press Send when ready"}
          </p>
          <Button type="submit" disabled={pending || !body.trim()} size="sm">
            {pending ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </form>
    </section>
  );
}
