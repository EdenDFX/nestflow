"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AssigneePicker } from "@/components/tasks/assignee-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setProfileStatusAction } from "@/lib/admin/actions";
import type { DirectoryUser } from "@/lib/admin/types";
import { personLabel } from "@/lib/people/label";
import { reassignTasksAction } from "@/lib/tasks/actions";
import type { NestFlowTask, TaskAssignee } from "@/lib/tasks/types";

export function DeactivateUserButton({
  user,
  openTasks,
  people,
}: {
  user: DirectoryUser;
  openTasks: NestFlowTask[];
  people: TaskAssignee[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [successorIds, setSuccessorIds] = useState<string[]>([]);

  const successors = people.filter((person) => person.userId !== user.userId);

  function activate() {
    startTransition(async () => {
      const result = await setProfileStatusAction({
        userId: user.userId,
        status: "Active",
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not update status.");
        return;
      }
      toast.success("Employee activated.");
      router.refresh();
    });
  }

  function deactivate() {
    startTransition(async () => {
      if (openTasks.length === 0 && user.openTaskCount > 0) {
        toast.error(
          "This person has open work outside your visibility. An administrator must reassign it first.",
        );
        return;
      }
      if (openTasks.length > 0) {
        if (successorIds.length === 0) {
          toast.error("Pick someone to take the open work first.");
          return;
        }
        const result = await reassignTasksAction({
          taskIds: openTasks.map((task) => task.id),
          assigneeIds: successorIds,
        });
        if (!result.ok) {
          toast.error(result.error ?? "Could not reassign open work.");
          return;
        }
      }

      const statusResult = await setProfileStatusAction({
        userId: user.userId,
        status: "Inactive",
      });
      if (!statusResult.ok) {
        toast.error(statusResult.error ?? "Could not deactivate.");
        return;
      }
      toast.success(
        openTasks.length > 0
          ? "Open work reassigned and account deactivated."
          : "Employee deactivated.",
      );
      setOpen(false);
      setSuccessorIds([]);
      router.refresh();
    });
  }

  if (!user.isActive) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={activate}
      >
        Activate
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        Deactivate
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate {personLabel(user)}</DialogTitle>
            <DialogDescription>
              {openTasks.length > 0
                ? `${openTasks.length} open task${openTasks.length === 1 ? "" : "s"} must move to someone else before this account locks.`
                : user.openTaskCount > 0
                  ? "This person has open work outside your visibility. An administrator must reassign it first."
                  : "They will not be able to sign in. Task history stays attributed to them."}
            </DialogDescription>
          </DialogHeader>
          {openTasks.length > 0 ? (
            <div className="space-y-3">
              <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-border p-2 text-sm">
                {openTasks.map((task) => (
                  <li key={task.id} className="truncate">
                    {task.title}
                  </li>
                ))}
              </ul>
              <AssigneePicker
                people={successors}
                value={successorIds}
                onChange={setSuccessorIds}
                disabled={pending}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={deactivate}
              disabled={
                pending ||
                (openTasks.length > 0 && successorIds.length === 0) ||
                (openTasks.length === 0 && user.openTaskCount > 0)
              }
            >
              {pending ? "Saving…" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
