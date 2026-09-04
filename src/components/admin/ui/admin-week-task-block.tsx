import Link from "next/link";

import { cn } from "@/lib/utils";
import type { OversightTaskRow } from "@/lib/admin/types";
import { isTaskStatus, STATUS_LABELS } from "@/lib/tasks/types";

import {
  calendarTaskToneClass,
  formatDueTime,
  isOverdue,
  personInitials,
  taskCalendarDate,
} from "../admin-shared";

type AdminWeekTaskBlockProps = {
  task: OversightTaskRow;
  href: string;
  compact?: boolean;
  focused?: boolean;
};

/** Minimal calendar task card. */
export function AdminWeekTaskBlock({
  task,
  href,
  compact = false,
  focused = false,
}: AdminWeekTaskBlockProps) {
  const status = isTaskStatus(task.status) ? task.status : "backlog";
  const completed = status === "completed";
  const overdue = isOverdue(task);
  const assignee = task.assigneeNames[0] ?? null;
  const calendarDate = taskCalendarDate(task);
  const dueTime = formatDueTime(calendarDate ? calendarDate.toISOString() : null);

  return (
    <Link
      href={href}
      id={`admin-calendar-task-${task.id}`}
      data-admin-task-id={task.id}
      title={`${task.title}${assignee ? ` · ${assignee}` : ""}${dueTime ? ` · ${dueTime}` : ""}`}
      className={cn(
        "admin-dashboard__task-block",
        calendarTaskToneClass(status, overdue),
        focused && "is-focused",
        compact && "is-compact",
      )}
    >
      <div className="admin-dashboard__task-block-top">
        <p
          className={cn(
            "admin-dashboard__task-block-title",
            completed && "is-done",
          )}
        >
          {task.title}
        </p>
        {dueTime ? (
          <span className="admin-dashboard__task-block-time">{dueTime}</span>
        ) : null}
      </div>

      <div className="admin-dashboard__task-block-meta">
        <span className="admin-dashboard__task-block-status">
          {overdue && !completed ? "Overdue" : STATUS_LABELS[status]}
        </span>
        {assignee ? (
          <span className="admin-dashboard__task-block-person">
            <span aria-hidden>{personInitials(assignee)}</span>
            <span className="admin-dashboard__task-block-person-name">
              {assignee}
            </span>
          </span>
        ) : (
          <span className="admin-dashboard__task-block-unassigned">Unassigned</span>
        )}
      </div>
    </Link>
  );
}
