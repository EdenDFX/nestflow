"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { TaskActivity } from "@/components/tasks/task-activity";
import { TaskAttachments } from "@/components/tasks/task-attachments";
import { TaskChecklist } from "@/components/tasks/task-checklist";
import { TaskComments } from "@/components/tasks/task-comments";
import { PriorityBadge, StatusBadge } from "@/components/tasks/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveTaskAction,
  changeTaskStatusAction,
  updateTaskAction,
} from "@/lib/tasks/actions";
import type { TaskCollaboration } from "@/lib/tasks/collaboration-types";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  canTransition,
  type NestFlowTask,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";

export function TaskDetail({
  task,
  canAssign,
  collaboration,
  r2Configured,
}: {
  task: NestFlowTask;
  canAssign: boolean;
  collaboration: TaskCollaboration;
  r2Configured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueAt, setDueAt] = useState(
    task.dueAt ? task.dueAt.slice(0, 10) : "",
  );
  const [blockedReason, setBlockedReason] = useState(task.blockedReason ?? "");

  function saveDetails() {
    startTransition(async () => {
      const result = await updateTaskAction({
        taskId: task.id,
        title,
        description,
        priority,
        dueAt: dueAt || null,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not save task.");
        return;
      }
      toast.success("Task updated.");
      router.refresh();
    });
  }

  function saveStatus() {
    startTransition(async () => {
      if (!canTransition(task.status, status)) {
        toast.error(
          `Cannot move from ${STATUS_LABELS[task.status]} to ${STATUS_LABELS[status]}.`,
        );
        return;
      }
      const result = await changeTaskStatusAction({
        taskId: task.id,
        status,
        blockedReason: status === "blocked" ? blockedReason : null,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not change status.");
        return;
      }
      toast.success("Status updated.");
      router.refresh();
    });
  }

  function archive() {
    startTransition(async () => {
      const result = await archiveTaskAction(task.id);
      if (!result.ok) {
        toast.error(result.error ?? "Could not archive task.");
        return;
      }
      toast.success("Task archived.");
      router.push("/app/my-tasks");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-auto border-0 bg-transparent px-0 font-heading text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as TaskStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {status === "blocked" ? (
              <Input
                value={blockedReason}
                onChange={(event) => setBlockedReason(event.target.value)}
                placeholder="Blocked reason"
              />
            ) : null}
            <Button type="button" onClick={saveStatus} disabled={pending}>
              Update status
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as TaskPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {PRIORITY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="dueAt">Due date</Label>
            <Input
              id="dueAt"
              type="date"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={6}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Assignees</Label>
          <p className="text-sm text-muted-foreground">
            {task.assignees.length > 0
              ? task.assignees
                  .map(
                    (person) =>
                      person.fullName ?? person.nestId ?? person.email,
                  )
                  .join(", ")
              : "Unassigned"}
            {!canAssign
              ? " (managers, HR, and admins can reassign)"
              : " — reassignment UI expands in M5"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={saveDetails} disabled={pending}>
            Save details
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={archive}
            disabled={pending}
          >
            Archive
          </Button>
        </div>

        <TaskChecklist taskId={task.id} items={collaboration.checklist} />
        <TaskComments taskId={task.id} comments={collaboration.comments} />
      </div>

      <aside className="space-y-8 lg:sticky lg:top-20 lg:self-start">
        <TaskAttachments
          taskId={task.id}
          attachments={collaboration.attachments}
          r2Configured={r2Configured}
        />
        <TaskActivity events={collaboration.activity} />
      </aside>
    </div>
  );
}
