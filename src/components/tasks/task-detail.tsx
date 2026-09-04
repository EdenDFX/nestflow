"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/lib/sounds/toast";

import { AssigneePicker } from "@/components/tasks/assignee-picker";
import { TaskActivity } from "@/components/tasks/task-activity";
import { TaskAttachments } from "@/components/tasks/task-attachments";
import { TaskChecklist } from "@/components/tasks/task-checklist";
import { TaskComments } from "@/components/tasks/task-comments";
import { TaskM8Panel } from "@/components/tasks/task-m8-panel";
import { PriorityBadge, StatusBadge } from "@/components/tasks/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { personLabel } from "@/lib/people/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AppRole } from "@/lib/auth/types";
import {
  archiveTaskAction,
  changeTaskStatusAction,
  updateTaskAction,
} from "@/lib/tasks/actions";
import type { TaskCollaboration } from "@/lib/tasks/collaboration-types";
import { composeDueAt, formatDueAtLabel, splitDueAt } from "@/lib/tasks/due-at";
import type { TaskM8Extras } from "@/lib/tasks/m8-types";
import { canRoleTransition } from "@/lib/tasks/status-policy";
import type { TaskInteractionMode } from "@/lib/tasks/interaction-mode";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type NestFlowTask,
  type TaskAssignee,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";

export type { TaskInteractionMode };

export function TaskDetail({
  task,
  canAssign,
  canDecideApproval,
  collaboration,
  m8,
  r2Configured,
  assignablePeople = [],
  mentionablePeople,
  variant = "page",
  interactionMode = "full_edit",
  roles = ["staff"],
}: {
  task: NestFlowTask;
  canAssign: boolean;
  canDecideApproval: boolean;
  collaboration: TaskCollaboration;
  m8: TaskM8Extras;
  r2Configured: boolean;
  assignablePeople?: TaskAssignee[];
  mentionablePeople?: TaskAssignee[];
  variant?: "page" | "pane";
  interactionMode?: TaskInteractionMode;
  roles?: AppRole[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const mentionPeople = mentionablePeople ?? assignablePeople;
  const initialDue = splitDueAt(task.dueAt);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState(initialDue.date);
  const [dueTime, setDueTime] = useState(initialDue.time);
  const [blockedReason, setBlockedReason] = useState(task.blockedReason ?? "");
  const [assigneeIds, setAssigneeIds] = useState(
    task.assignees.map((person) => person.userId),
  );
  const pane = variant === "pane";
  const discussionOnly = interactionMode === "discussion";
  const progressOnly = interactionMode === "progress";
  const canUpdateWork = !discussionOnly;
  const statusOptions = TASK_STATUSES.filter(
    (value) => value === task.status || canRoleTransition(roles, task.status, value),
  );

  function saveDetails() {
    startTransition(async () => {
      const result = await updateTaskAction({
        taskId: task.id,
        title,
        description,
        priority,
        dueAt: composeDueAt(dueDate, dueTime),
        ...(canAssign ? { assigneeIds } : {}),
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
      if (!canRoleTransition(roles, task.status, status)) {
        toast.error(
          `Cannot move from ${STATUS_LABELS[task.status]} to ${STATUS_LABELS[status]} with your role.`,
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
      if (pane) {
        router.back();
      } else {
        router.push("/app/my-tasks");
      }
      router.refresh();
    });
  }

  const discussion = (
    <TaskComments
      taskId={task.id}
      comments={collaboration.comments}
      people={mentionPeople}
      variant={pane ? "pane" : "default"}
    />
  );

  return (
    <div
      className={
        pane
          ? "grid gap-6 pb-2"
          : "mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      }
    >
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {progressOnly ? (
              <span className="rounded-full border border-border/80 px-2.5 py-0.5 text-xs text-muted-foreground">
                Progress view
              </span>
            ) : null}
            {discussionOnly ? (
              <span className="rounded-full border border-border/80 px-2.5 py-0.5 text-xs text-muted-foreground">
                Discussion view
              </span>
            ) : null}
          </div>
          {progressOnly || discussionOnly ? (
            <h1
              className={
                pane
                  ? "font-heading text-xl font-semibold tracking-tight"
                  : "font-heading text-3xl font-semibold tracking-tight"
              }
            >
              {task.title}
            </h1>
          ) : (
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={
                pane
                  ? "h-auto border-0 bg-transparent px-0 font-heading text-xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
                  : "h-auto border-0 bg-transparent px-0 font-heading text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
              }
            />
          )}
        </div>

        {pane ? discussion : null}

        {(progressOnly || discussionOnly) ? (
          <div className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Priority
                </dt>
                <dd className="mt-1 text-sm">{PRIORITY_LABELS[task.priority]}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Due
                </dt>
                <dd className="mt-1 text-sm">{formatDueAtLabel(task.dueAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Assignees
                </dt>
                <dd className="mt-1 text-sm">
                  {task.assignees.length > 0
                    ? task.assignees.map((person) => personLabel(person)).join(", ")
                    : "Unassigned"}
                </dd>
              </div>
            </dl>
            {task.description.trim() ? (
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Description
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{task.description}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {canUpdateWork ? (
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
                {statusOptions.map((value) => (
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

          {progressOnly ? null : (
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
              <Label htmlFor="dueDate">Due date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(event) => {
                  const next = event.target.value;
                  setDueDate(next);
                  if (!next) setDueTime("");
                }}
              />
              <Label htmlFor="dueTime">Submit by (time)</Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(event) => setDueTime(event.target.value)}
                disabled={!dueDate}
              />
            </div>
          )}
          </div>
        ) : null}

        {canUpdateWork && !progressOnly ? (
          <>
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
              {canAssign ? (
                <AssigneePicker
                  people={assignablePeople}
                  value={assigneeIds}
                  onChange={setAssigneeIds}
                  disabled={pending}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {task.assignees.length > 0
                    ? task.assignees
                        .map((person) => personLabel(person))
                        .join(", ")
                    : "Unassigned"}{" "}
                  (managers and HR can reassign)
                </p>
              )}
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
          </>
        ) : null}

        {canUpdateWork ? (
          <TaskChecklist taskId={task.id} items={collaboration.checklist} />
        ) : null}
        {!pane ? discussion : null}
        {canUpdateWork && !progressOnly ? (
          <TaskM8Panel
            task={task}
            extras={m8}
            canDecideApproval={canDecideApproval}
          />
        ) : null}
      </div>

      <aside className="space-y-8 lg:sticky lg:top-20 lg:self-start">
        <TaskAttachments
          taskId={task.id}
          attachments={collaboration.attachments}
          r2Configured={r2Configured}
          readOnly={discussionOnly}
        />
        {canUpdateWork && !progressOnly ? (
          <TaskActivity events={collaboration.activity} />
        ) : null}
      </aside>
    </div>
  );
}
