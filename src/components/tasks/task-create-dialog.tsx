"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { createTaskAction } from "@/lib/tasks/actions";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type NestFlowWorkspace,
  type TaskAssignee,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";

type TaskCreateDialogProps = {
  workspaces: NestFlowWorkspace[];
  people: TaskAssignee[];
  canAssign: boolean;
  defaultAssigneeId?: string;
  triggerLabel?: string;
};

export function TaskCreateDialog({
  workspaces,
  people,
  canAssign,
  defaultAssigneeId,
  triggerLabel = "New Task",
}: TaskCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueAt, setDueAt] = useState("");
  const [blockedReason, setBlockedReason] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    defaultAssigneeId ? [defaultAssigneeId] : [],
  );
  const [tagsInput, setTagsInput] = useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setWorkspaceId(workspaces[0]?.id ?? "");
    setStatus("todo");
    setPriority("medium");
    setDueAt("");
    setBlockedReason("");
    setAssigneeIds(defaultAssigneeId ? [defaultAssigneeId] : []);
    setTagsInput("");
  }

  function toggleAssignee(userId: string) {
    setAssigneeIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!workspaceId) {
      toast.error("Create a workspace before adding tasks.");
      return;
    }

    startTransition(async () => {
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const result = await createTaskAction({
        workspaceId,
        title,
        description,
        status,
        priority,
        dueAt: dueAt || null,
        blockedReason: status === "blocked" ? blockedReason : null,
        assigneeIds: canAssign ? assigneeIds : [],
        tags,
      });

      if (!result.ok) {
        toast.error(result.error ?? "Could not create task.");
        return;
      }

      toast.success("Task created.");
      setOpen(false);
      reset();
      router.refresh();
      if (result.taskId) {
        router.push(`/app/tasks/${result.taskId}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={200}
              placeholder="What needs to be done?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Optional details"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Workspace</Label>
              <Select value={workspaceId} onValueChange={setWorkspaceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            </div>

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
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueAt">Due date</Label>
              <Input
                id="dueAt"
                type="date"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </div>
          </div>

          {status === "blocked" ? (
            <div className="space-y-2">
              <Label htmlFor="blockedReason">Blocked reason</Label>
              <Input
                id="blockedReason"
                value={blockedReason}
                onChange={(event) => setBlockedReason(event.target.value)}
                required
                placeholder="What is blocking this?"
              />
            </div>
          ) : null}

          {canAssign ? (
            <div className="space-y-2">
              <Label>Assignees</Label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {people.map((person) => {
                  const checked = assigneeIds.includes(person.userId);
                  return (
                    <label
                      key={person.userId}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAssignee(person.userId)}
                      />
                      <span>
                        {person.fullName ?? person.nestId ?? person.email}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="design, ops, urgent"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated labels
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending ? "Creating…" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
