"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AdminDrawerWizard,
  type AdminWizardStep,
} from "@/components/admin/ui/admin-drawer-wizard";
import { AssigneePicker } from "@/components/tasks/assignee-picker";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from "@/components/ui/drawer";
import { setProfileStatusAction } from "@/lib/admin/actions";
import type { DirectoryUser } from "@/lib/admin/types";
import { personLabel } from "@/lib/people/label";
import { reassignTasksAction } from "@/lib/tasks/actions";
import type { NestFlowTask, TaskAssignee } from "@/lib/tasks/types";

const STEPS: AdminWizardStep[] = [
  { id: "review", label: "Review" },
  { id: "successor", label: "Successor" },
  { id: "confirm", label: "Confirm" },
];

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
  const [step, setStep] = useState<(typeof STEPS)[number]["id"]>("review");
  const [pending, startTransition] = useTransition();
  const [successorIds, setSuccessorIds] = useState<string[]>([]);

  const successors = people.filter((person) => person.userId !== user.userId);
  const needsSuccessor = openTasks.length > 0;
  const blockedByHiddenTasks =
    openTasks.length === 0 && user.openTaskCount > 0;

  function resetWizard() {
    setStep("review");
    setSuccessorIds([]);
  }

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
      if (blockedByHiddenTasks) {
        toast.error(
          "This person has open work outside your visibility. An administrator must reassign it first.",
        );
        return;
      }
      if (needsSuccessor) {
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
      resetWizard();
      router.refresh();
    });
  }

  function goNext() {
    if (step === "review") {
      if (blockedByHiddenTasks) return;
      setStep(needsSuccessor ? "successor" : "confirm");
      return;
    }
    if (step === "successor") {
      if (needsSuccessor && successorIds.length === 0) {
        toast.error("Pick someone to take the open work first.");
        return;
      }
      setStep("confirm");
    }
  }

  function goBack() {
    if (step === "confirm") {
      setStep(needsSuccessor ? "successor" : "review");
      return;
    }
    if (step === "successor") {
      setStep("review");
    }
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
        onClick={() => {
          resetWizard();
          setOpen(true);
        }}
      >
        Deactivate
      </Button>
      <Drawer
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetWizard();
        }}
        position="right"
      >
        <DrawerPopup showCloseButton className="flex max-h-[100dvh] w-full max-w-lg flex-col">
          <DrawerHeader className="border-b border-border/70">
            <DrawerTitle>Deactivate {personLabel(user)}</DrawerTitle>
          </DrawerHeader>
          <DrawerPanel className="flex min-h-0 flex-1 flex-col p-4">
            <AdminDrawerWizard
              steps={STEPS.filter(
                (item) => needsSuccessor || item.id !== "successor",
              )}
              currentStep={step}
              title="Deactivate account"
              description="They will not be able to sign in. Task history stays attributed to them."
              footer={
                <>
                  {step !== "review" ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending}
                      onClick={goBack}
                    >
                      Back
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending}
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                  )}
                  {step === "confirm" ? (
                    <Button type="button" disabled={pending} onClick={deactivate}>
                      {pending ? "Saving…" : "Deactivate"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={pending || blockedByHiddenTasks}
                      onClick={goNext}
                    >
                      Continue
                    </Button>
                  )}
                </>
              }
            >
              {step === "review" ? (
                <div className="space-y-3 text-sm">
                  {blockedByHiddenTasks ? (
                    <p className="text-destructive">
                      This person has open work outside your visibility. An
                      administrator must reassign it first.
                    </p>
                  ) : needsSuccessor ? (
                    <>
                      <p>
                        {openTasks.length} open task
                        {openTasks.length === 1 ? "" : "s"} must move to
                        someone else before this account locks.
                      </p>
                      <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                        {openTasks.map((task) => (
                          <li key={task.id} className="truncate">
                            {task.title}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p>No open tasks need reassignment.</p>
                  )}
                </div>
              ) : null}

              {step === "successor" && needsSuccessor ? (
                <AssigneePicker
                  people={successors}
                  value={successorIds}
                  onChange={setSuccessorIds}
                  disabled={pending}
                />
              ) : null}

              {step === "confirm" ? (
                <div className="space-y-2 text-sm">
                  <p>
                    Confirm deactivation for{" "}
                    <span className="font-medium">{personLabel(user)}</span>.
                  </p>
                  {needsSuccessor ? (
                    <p className="text-muted-foreground">
                      Open work will move to the selected successor before the
                      account locks.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </AdminDrawerWizard>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>
    </>
  );
}
