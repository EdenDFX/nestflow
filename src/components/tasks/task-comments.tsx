"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addCommentAction } from "@/lib/tasks/collaboration-actions";
import type { TaskComment } from "@/lib/tasks/collaboration-types";

export function TaskComments({
  taskId,
  comments,
}: {
  taskId: string;
  comments: TaskComment[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await addCommentAction({ taskId, body });
      if (!result.ok) {
        toast.error(result.error ?? "Could not add comment.");
        return;
      }
      setBody("");
      toast.success("Comment added.");
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-semibold">Comments</h2>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No comments yet. Mention teammates with @NestID.
          </p>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-xl border border-border/80 bg-card p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {comment.authorName ??
                    comment.authorNestId ??
                    "NestFlow user"}
                </p>
                <time className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleString()}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{comment.body}</p>
              {comment.mentionedUserIds.length > 0 ? (
                <p className="mt-2 text-xs text-primary">
                  Mentions recorded for {comment.mentionedUserIds.length} people
                </p>
              ) : null}
            </article>
          ))
        )}
      </div>

      <form onSubmit={submit} className="space-y-2">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          placeholder="Write a comment. Use @GFX2 to mention someone."
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !body.trim()}>
          {pending ? "Posting…" : "Post comment"}
        </Button>
      </form>
    </section>
  );
}
