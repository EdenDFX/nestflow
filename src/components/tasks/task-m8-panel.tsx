"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/tasks/status-badge";
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
import {
  addTaskDependencyAction,
  decideTaskApprovalAction,
  deleteTimeEntryAction,
  logTimeEntryAction,
  removeTaskDependencyAction,
  requestTaskApprovalAction,
  updateTaskM8FieldsAction,
} from "@/lib/tasks/m8-actions";
import {
  APPROVAL_LABELS,
  RECURRENCE_LABELS,
  RECURRENCE_RULES,
  resolveGearHref,
  type RecurrenceRule,
  type TaskM8Extras,
} from "@/lib/tasks/m8-types";
import type { NestFlowTask } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

function formatMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function TaskM8Panel({
  task,
  extras,
  canDecideApproval,
}: {
  task: NestFlowTask;
  extras: TaskM8Extras;
  canDecideApproval: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [recurrenceRule, setRecurrenceRule] = useState<string>(
    task.recurrenceRule ?? "none",
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState(
    String(task.recurrenceInterval || 1),
  );
  const [recurrenceEndsAt, setRecurrenceEndsAt] = useState(
    task.recurrenceEndsAt ? task.recurrenceEndsAt.slice(0, 10) : "",
  );
  const [gearRef, setGearRef] = useState(task.gearRef ?? "");
  const [gearUrl, setGearUrl] = useState(task.gearUrl ?? "");
  const [dependsOnId, setDependsOnId] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [timeNote, setTimeNote] = useState("");
  const [approvalNote, setApprovalNote] = useState(task.approvalNote ?? "");

  const gearHref = useMemo(
    () =>
      resolveGearHref({
        gearRef: task.gearRef,
        gearUrl: task.gearUrl,
      }),
    [task.gearRef, task.gearUrl],
  );

  const existingDepIds = useMemo(
    () => new Set(extras.dependencies.map((d) => d.dependsOnTaskId)),
    [extras.dependencies],
  );

  const candidates = extras.candidateTasks.filter(
    (candidate) => !existingDepIds.has(candidate.id),
  );

  function refresh() {
    router.refresh();
  }

  function saveRecurrenceAndGear() {
    startTransition(async () => {
      const result = await updateTaskM8FieldsAction({
        taskId: task.id,
        recurrenceRule:
          recurrenceRule === "none"
            ? null
            : (recurrenceRule as RecurrenceRule),
        recurrenceInterval: Math.max(
          1,
          Number.parseInt(recurrenceInterval, 10) || 1,
        ),
        recurrenceEndsAt: recurrenceEndsAt || null,
        gearRef: gearRef || null,
        gearUrl: gearUrl || null,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not save.");
        return;
      }
      toast.success("Saved recurrence and gear link.");
      refresh();
    });
  }

  function addDependency() {
    if (!dependsOnId) {
      toast.error("Choose a task this depends on.");
      return;
    }
    startTransition(async () => {
      const result = await addTaskDependencyAction({
        taskId: task.id,
        dependsOnTaskId: dependsOnId,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not add dependency.");
        return;
      }
      toast.success("Dependency added.");
      setDependsOnId("");
      refresh();
    });
  }

  function logTime() {
    const value = Number.parseInt(minutes, 10);
    if (!Number.isFinite(value) || value < 1) {
      toast.error("Enter minutes greater than zero.");
      return;
    }
    startTransition(async () => {
      const result = await logTimeEntryAction({
        taskId: task.id,
        minutes: value,
        note: timeNote,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not log time.");
        return;
      }
      toast.success(`Logged ${value} minutes.`);
      setTimeNote("");
      refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3 rounded-2xl border border-border/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-base font-semibold">Approval</h2>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              task.approvalStatus === "pending" && "bg-primary/15 text-primary",
              task.approvalStatus === "approved" && "bg-success/15 text-success",
              task.approvalStatus === "rejected" &&
                "bg-destructive/15 text-destructive",
              (task.approvalStatus === "none" || !task.approvalStatus) &&
                "bg-muted text-muted-foreground",
            )}
          >
            {APPROVAL_LABELS[task.approvalStatus ?? "none"]}
          </span>
        </div>
        <Input
          value={approvalNote}
          onChange={(event) => setApprovalNote(event.target.value)}
          placeholder="Note for approvers"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await requestTaskApprovalAction({
                  taskId: task.id,
                  note: approvalNote,
                });
                if (!result.ok) {
                  toast.error(result.error ?? "Request failed.");
                  return;
                }
                toast.success("Approval requested.");
                refresh();
              });
            }}
          >
            Request approval
          </Button>
          {canDecideApproval && task.approvalStatus === "pending" ? (
            <>
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await decideTaskApprovalAction({
                      taskId: task.id,
                      decision: "approved",
                      note: approvalNote,
                    });
                    if (!result.ok) {
                      toast.error(result.error ?? "Could not approve.");
                      return;
                    }
                    toast.success("Approved and completed.");
                    refresh();
                  });
                }}
              >
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await decideTaskApprovalAction({
                      taskId: task.id,
                      decision: "rejected",
                      note: approvalNote,
                    });
                    if (!result.ok) {
                      toast.error(result.error ?? "Could not reject.");
                      return;
                    }
                    toast.success("Approval rejected.");
                    refresh();
                  });
                }}
              >
                Reject
              </Button>
            </>
          ) : null}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border/80 p-4">
        <h2 className="font-heading text-base font-semibold">Recurring</h2>
        <p className="text-xs text-muted-foreground">
          When this task is completed, NestFlow creates the next instance if a
          rule is set.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Rule</Label>
            <Select value={recurrenceRule} onValueChange={setRecurrenceRule}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                {RECURRENCE_RULES.map((rule) => (
                  <SelectItem key={rule} value={rule}>
                    {RECURRENCE_LABELS[rule]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="interval">Every</Label>
            <Input
              id="interval"
              type="number"
              min={1}
              max={365}
              value={recurrenceInterval}
              onChange={(event) => setRecurrenceInterval(event.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ends">Ends on (optional)</Label>
            <Input
              id="ends"
              type="date"
              value={recurrenceEndsAt}
              onChange={(event) => setRecurrenceEndsAt(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border/80 p-4">
        <h2 className="font-heading text-base font-semibold">Dependencies</h2>
        {extras.dependencies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No blockers. Completing this task is free of dependency checks.
          </p>
        ) : (
          <ul className="space-y-2">
            {extras.dependencies.map((dep) => (
              <li
                key={dep.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/app/tasks/${dep.dependsOnTaskId}`}
                    className="font-medium hover:underline"
                  >
                    {dep.dependsOnTitle}
                  </Link>
                  <div className="mt-1">
                    <StatusBadge status={dep.dependsOnStatus} />
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await removeTaskDependencyAction(
                        dep.id,
                        task.id,
                      );
                      if (!result.ok) {
                        toast.error(result.error ?? "Could not remove.");
                        return;
                      }
                      toast.success("Dependency removed.");
                      refresh();
                    });
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        {extras.blockersOf.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Blocks{" "}
            {extras.blockersOf
              .map((dep) => dep.dependsOnTitle)
              .slice(0, 4)
              .join(", ")}
            {extras.blockersOf.length > 4 ? "…" : ""}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={dependsOnId} onValueChange={setDependsOnId}>
            <SelectTrigger className="sm:flex-1">
              <SelectValue placeholder="Depends on…" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  {candidate.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || candidates.length === 0}
            onClick={addDependency}
          >
            Add dependency
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border/80 p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-heading text-base font-semibold">Time tracking</h2>
          <p className="text-sm tabular-nums text-muted-foreground">
            Total {formatMinutes(extras.totalMinutes)}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[100px_1fr_auto]">
          <Input
            type="number"
            min={1}
            max={1440}
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            aria-label="Minutes"
          />
          <Input
            value={timeNote}
            onChange={(event) => setTimeNote(event.target.value)}
            placeholder="What did you work on?"
          />
          <Button type="button" size="sm" disabled={pending} onClick={logTime}>
            Log time
          </Button>
        </div>
        {extras.timeEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No time logged yet.</p>
        ) : (
          <ul className="max-h-48 space-y-1.5 overflow-y-auto">
            {extras.timeEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start justify-between gap-2 text-sm"
              >
                <div>
                  <p className="font-medium tabular-nums">
                    {formatMinutes(entry.minutes)}
                    {entry.userName ? (
                      <span className="ml-2 font-normal text-muted-foreground">
                        · {entry.userName}
                      </span>
                    ) : null}
                  </p>
                  {entry.note ? (
                    <p className="text-xs text-muted-foreground">{entry.note}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await deleteTimeEntryAction({
                        entryId: entry.id,
                        taskId: task.id,
                      });
                      if (!result.ok) {
                        toast.error(result.error ?? "Could not delete.");
                        return;
                      }
                      refresh();
                    });
                  }}
                >
                  Undo
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-border/80 p-4">
        <h2 className="font-heading text-base font-semibold">Gear link</h2>
        <p className="text-xs text-muted-foreground">
          Optional reference to NestByEden gear. Set a full URL, or a gear id
          with <code className="text-[11px]">NEXT_PUBLIC_GEAR_APP_URL</code>.
        </p>
        <div className="space-y-2">
          <Label htmlFor="gearRef">Gear id / ref</Label>
          <Input
            id="gearRef"
            value={gearRef}
            onChange={(event) => setGearRef(event.target.value)}
            placeholder="e.g. CAM-12"
          />
          <Label htmlFor="gearUrl">Or full URL</Label>
          <Input
            id="gearUrl"
            value={gearUrl}
            onChange={(event) => setGearUrl(event.target.value)}
            placeholder="https://…"
          />
          {gearHref ? (
            <a
              href={gearHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-medium text-primary hover:underline"
            >
              Open gear link
            </a>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={saveRecurrenceAndGear}
        >
          Save recurrence and gear
        </Button>
      </section>
    </div>
  );
}
