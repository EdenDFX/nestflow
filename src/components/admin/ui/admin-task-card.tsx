import Link from "next/link";

import { StatusBadge } from "@/components/tasks/status-badge";
import { cn } from "@/lib/utils";
import type { OversightTaskRow } from "@/lib/admin/types";
import { isTaskStatus } from "@/lib/tasks/types";

import {
  formatActivitySummary,
  formatWhen,
  isOverdue,
  personInitials,
  statusDotClass,
  taskRowSurfaceClass,
} from "../admin-shared";

type AdminTaskCardProps = {
  task: OversightTaskRow;
  href: string;
  className?: string;
};

/** Simplified task row for admin overview lists. */
export function AdminTaskCard({ task, href, className }: AdminTaskCardProps) {
  const overdue = isOverdue(task);
  const primaryAssignee = task.assigneeNames[0] ?? null;

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-2 rounded-2xl border border-border/60 px-4 py-3 transition-colors",
        taskRowSurfaceClass(
          isTaskStatus(task.status) ? task.status : "backlog",
          overdue,
        ),
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium leading-snug group-hover:text-primary">
            {task.title}
          </p>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {formatActivitySummary(task.lastUpdateSummary)}
          </p>
        </div>
        <StatusBadge
          status={isTaskStatus(task.status) ? task.status : "backlog"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              "size-2 rounded-full",
              statusDotClass(
                isTaskStatus(task.status) ? task.status : "backlog",
                overdue,
              ),
            )}
            aria-hidden
          />
          {overdue && task.status !== "completed" ? "Overdue" : "Due"}{" "}
          {formatWhen(task.dueAt)}
        </span>
        {primaryAssignee ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
              {personInitials(primaryAssignee)}
            </span>
            {primaryAssignee}
            {task.assigneeNames.length > 1
              ? ` +${task.assigneeNames.length - 1}`
              : ""}
          </span>
        ) : (
          <span className="text-warning">Unassigned</span>
        )}
        <span>{task.workspaceName}</span>
      </div>
    </Link>
  );
}
