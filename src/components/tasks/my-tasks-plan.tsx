"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { MentionField } from "@/components/tasks/mention-field";
import { PriorityBadge, StatusBadge } from "@/components/tasks/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { personLabel } from "@/lib/people/label";
import { changeTaskStatusAction } from "@/lib/tasks/actions";
import { addCommentAction, toggleChecklistItemAction } from "@/lib/tasks/collaboration-actions";
import type { ChecklistItem } from "@/lib/tasks/collaboration-types";
import {
  MY_TASK_BUCKETS,
  MY_TASK_BUCKET_LABELS,
  groupMyTasks,
  type MyTaskBucket,
} from "@/lib/tasks/my-tasks-groups";
import {
  STATUS_LABELS,
  TASK_STATUSES,
  canTransition,
  type NestFlowTask,
  type TaskAssignee,
  type TaskStatus,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

function promptBlockedReason(): string | null {
  const reason = window.prompt("Blocked reason");
  if (reason === null) return null;
  const trimmed = reason.trim();
  if (!trimmed) {
    toast.error("Blocked tasks need a reason.");
    return null;
  }
  return trimmed;
}

export function MyTasksPlan({
  tasks,
  checklists = {},
  people = [],
}: {
  tasks: NestFlowTask[];
  checklists?: Record<string, ChecklistItem[]>;
  people?: TaskAssignee[];
}) {
  const grouped = useMemo(() => groupMyTasks(tasks), [tasks]);
  const [completedOpen, setCompletedOpen] = useState(false);

  return (
    <div className="space-y-8">
      {MY_TASK_BUCKETS.map((bucket) => {
        const items = grouped[bucket];
        if (bucket === "completed") {
          return (
            <section key={bucket} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-heading text-lg font-semibold">
                  {MY_TASK_BUCKET_LABELS[bucket]}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {items.length}
                  </span>
                </h2>
                {items.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setCompletedOpen((open) => !open)}
                  >
                    {completedOpen ? "Hide" : "Show"}
                  </Button>
                ) : null}
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet.</p>
              ) : completedOpen ? (
                <ul className="divide-y divide-border/80 overflow-hidden rounded-xl border border-border/80">
                  {items.map((task) => (
                    <MyTaskRow
                      key={task.id}
                      task={task}
                      bucket={bucket}
                      checklist={checklists[task.id] ?? []}
                      people={people}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Completed work is hidden. Show it when you need the record.
                </p>
              )}
            </section>
          );
        }

        return (
          <section key={bucket} className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">
              {MY_TASK_BUCKET_LABELS[bucket]}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {items.length}
              </span>
            </h2>
            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/80 px-4 py-6 text-sm text-muted-foreground">
                {emptyCopy(bucket)}
              </p>
            ) : (
              <ul className="divide-y divide-border/80 overflow-hidden rounded-xl border border-border/80">
                {items.map((task) => (
                  <MyTaskRow
                    key={task.id}
                    task={task}
                    bucket={bucket}
                    checklist={checklists[task.id] ?? []}
                    people={people}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function emptyCopy(bucket: MyTaskBucket): string {
  switch (bucket) {
    case "overdue":
      return "Nothing overdue.";
    case "today":
      return "No tasks due today.";
    case "upcoming":
      return "No upcoming due dates.";
    case "later":
      return "Tasks without a due date land here.";
    case "completed":
      return "None yet.";
    default: {
      const _exhaustive: never = bucket;
      return _exhaustive;
    }
  }
}

function MyTaskRow({
  task,
  bucket,
  checklist,
  people,
}: {
  task: NestFlowTask;
  bucket: MyTaskBucket;
  checklist: ChecklistItem[];
  people: TaskAssignee[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const openChecklist = checklist.filter((item) => !item.isDone).slice(0, 3);
  const doneCount = checklist.filter((item) => item.isDone).length;

  function onStatus(next: TaskStatus) {
    if (!canTransition(task.status, next)) {
      toast.error(
        `Cannot move from ${STATUS_LABELS[task.status]} to ${STATUS_LABELS[next]}.`,
      );
      return;
    }

    let blockedReason: string | null = null;
    if (next === "blocked") {
      blockedReason = promptBlockedReason();
      if (blockedReason === null) return;
    }

    startTransition(async () => {
      const result = await changeTaskStatusAction({
        taskId: task.id,
        status: next,
        blockedReason,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not update status.");
        return;
      }
      toast.success("Status updated.");
      router.refresh();
    });
  }

  function toggleItem(item: ChecklistItem) {
    startTransition(async () => {
      const result = await toggleChecklistItemAction({
        itemId: item.id,
        taskId: task.id,
        isDone: !item.isDone,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not update checklist.");
        return;
      }
      router.refresh();
    });
  }

  function sendComment() {
    if (!comment.trim()) return;
    startTransition(async () => {
      const result = await addCommentAction({
        taskId: task.id,
        body: comment.trim(),
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not add comment.");
        return;
      }
      setComment("");
      toast.success("Comment posted.");
      router.refresh();
    });
  }

  return (
    <li
      className={cn(
        "space-y-3 px-4 py-3",
        bucket === "overdue" && "bg-destructive/5",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 space-y-1">
          <Link
            href={`/app/tasks/${task.id}`}
            className="font-medium hover:text-primary"
          >
            {task.title}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <span className="text-xs text-muted-foreground">
              {task.assignees.length > 0
                ? task.assignees.map((person) => personLabel(person)).join(", ")
                : "Unassigned"}
            </span>
            {task.dueAt ? (
              <span className="text-xs text-muted-foreground">
                Due {new Date(task.dueAt).toLocaleDateString()}
              </span>
            ) : null}
            {checklist.length > 0 ? (
              <span className="text-xs text-muted-foreground">
                {doneCount}/{checklist.length} checklist
              </span>
            ) : null}
          </div>
        </div>
        {bucket !== "completed" ? (
          <div className="w-full shrink-0 sm:w-44">
            <Select
              value={task.status}
              disabled={pending}
              onValueChange={(value) => onStatus(value as TaskStatus)}
            >
              <SelectTrigger aria-label={`Status for ${task.title}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    disabled={!canTransition(task.status, status)}
                  >
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {bucket !== "completed" && openChecklist.length > 0 ? (
        <ul className="space-y-1">
          {openChecklist.map((item) => (
            <li key={item.id}>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-3.5 accent-primary"
                  checked={item.isDone}
                  disabled={pending}
                  onChange={() => toggleItem(item)}
                />
                <span className="min-w-0">{item.title}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}

      {bucket !== "completed" ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <MentionField
              people={people}
              value={comment}
              onChange={setComment}
              placeholder="One-line update. Use @NestID."
              disabled={pending}
              singleLine
              id={`comment-${task.id}`}
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || !comment.trim()}
            onClick={sendComment}
          >
            Comment
          </Button>
        </div>
      ) : null}
    </li>
  );
}
