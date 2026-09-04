"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/lib/sounds/toast";

import { AssigneePicker } from "@/components/tasks/assignee-picker";
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
import { composeDueAt } from "@/lib/tasks/due-at";
import {
  PRIORITY_LABELS,
  TASK_PRIORITIES,
  type NestFlowWorkspace,
  type TaskAssignee,
  type TaskPriority,
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
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    defaultAssigneeId ? [defaultAssigneeId] : [],
  );
  const [tagsInput, setTagsInput] = useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setWorkspaceId(workspaces[0]?.id ?? "");
    setPriority("medium");
    setDueDate("");
    setDueTime("");
    setAssigneeIds(defaultAssigneeId ? [defaultAssigneeId] : []);
    setTagsInput("");
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
        status: "todo",
        priority,
        dueAt: composeDueAt(dueDate, dueTime),
        blockedReason: null,
        assigneeIds: canAssign ? assigneeIds : [],
        tags,
      });

      if (!result.ok) {
        toast.error(result.error ?? "Could not create task.");
        return;
      }

      toast.success("Task created in To Do.");
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
              <Label htmlFor="dueDate">Due date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                New tasks always start in To Do.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueTime">Submit by (time)</Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(event) => setDueTime(event.target.value)}
                disabled={!dueDate}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Requires a due date.
              </p>
            </div>
          </div>

          {canAssign ? (
            <div className="space-y-2">
              <Label>Assignees</Label>
              <AssigneePicker
                people={people}
                value={assigneeIds}
                onChange={setAssigneeIds}
                disabled={pending}
              />
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
