"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AssigneePicker } from "@/components/tasks/assignee-picker";
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
import { bulkUpdateTasksAction } from "@/lib/tasks/bulk-actions";
import {
  STATUS_LABELS,
  TASK_STATUSES,
  type TaskAssignee,
  type TaskStatus,
} from "@/lib/tasks/types";

const KEEP_STATUS = "__keep__";

export function BulkReassignBar({
  selectedIds,
  people,
  onClear,
}: {
  selectedIds: string[];
  people: TaskAssignee[];
  onClear: () => void;
}) {
  const router = useRouter();
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState("");
  const [clearDue, setClearDue] = useState(false);
  const [status, setStatus] = useState<typeof KEEP_STATUS | TaskStatus>(
    KEEP_STATUS,
  );
  const [pending, startTransition] = useTransition();

  if (selectedIds.length === 0) {
    return null;
  }

  function apply() {
    startTransition(async () => {
      const nextStatus = status === KEEP_STATUS ? undefined : status;
      let blockedReason: string | null | undefined;
      if (nextStatus === "blocked") {
        const reason = window.prompt("Blocked reason for selected tasks");
        if (reason === null) return;
        blockedReason = reason.trim();
        if (!blockedReason) {
          toast.error("Blocked tasks need a reason.");
          return;
        }
      }

      const result = await bulkUpdateTasksAction({
        taskIds: selectedIds,
        assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
        dueAt: clearDue ? null : dueAt ? dueAt : undefined,
        status: nextStatus,
        blockedReason,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not update tasks.");
        return;
      }
      toast.success(`Updated ${selectedIds.length} tasks.`);
      onClear();
      setAssigneeIds([]);
      setDueAt("");
      setClearDue(false);
      setStatus(KEEP_STATUS);
      router.refresh();
    });
  }

  return (
    <div className="sticky bottom-4 z-20 rounded-xl border border-border bg-background/95 p-3 backdrop-blur-md">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_auto]">
        <div className="space-y-2">
          <p className="text-sm font-medium">{selectedIds.length} selected</p>
          <AssigneePicker
            people={people}
            value={assigneeIds}
            onChange={setAssigneeIds}
            disabled={pending}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bulk-due">Due date</Label>
            <Input
              id="bulk-due"
              type="date"
              value={dueAt}
              disabled={pending || clearDue}
              onChange={(event) => setDueAt(event.target.value)}
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="size-3.5 accent-primary"
                checked={clearDue}
                onChange={(event) => setClearDue(event.target.checked)}
              />
              Clear due date
            </label>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as typeof KEEP_STATUS | TaskStatus)
              }
              disabled={pending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Keep current" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={KEEP_STATUS}>Keep current</SelectItem>
                {TASK_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <Button type="button" variant="outline" onClick={onClear} disabled={pending}>
            Clear
          </Button>
          <Button type="button" onClick={apply} disabled={pending}>
            {pending ? "Saving…" : "Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
