import { Badge } from "@/components/ui/badge";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

const statusClass: Record<TaskStatus, string> = {
  backlog: "bg-muted text-muted-foreground",
  todo: "bg-secondary text-secondary-foreground",
  in_progress: "bg-primary/15 text-primary",
  blocked: "bg-red-500/15 text-red-600 dark:text-red-300",
  review: "bg-amber-400/20 text-amber-800 dark:text-amber-200",
  completed: "bg-success/15 text-success dark:text-success",
};

const priorityClass: Record<TaskPriority, string> = {
  low: "border-border text-muted-foreground",
  medium: "border-border text-foreground",
  high: "border-orange-500/40 text-orange-600 dark:text-orange-300",
  urgent: "border-red-500/40 text-red-600 dark:text-red-300",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge className={cn("rounded-full border-0", statusClass[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full", priorityClass[priority])}
    >
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
