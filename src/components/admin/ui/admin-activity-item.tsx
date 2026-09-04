import { cn } from "@/lib/utils";

import { formatActivitySummary, formatWhenTime } from "../admin-shared";

type AdminActivityItemProps = {
  actorName: string | null;
  summary: string | null;
  occurredAt: string;
  taskTitle?: string | null;
  className?: string;
};

/** Timeline row for admin activity feed. */
export function AdminActivityItem({
  actorName,
  summary,
  occurredAt,
  taskTitle,
  className,
}: AdminActivityItemProps) {
  return (
    <div
      className={cn(
        "relative flex gap-3 border-l border-border/70 py-3 pl-4",
        className,
      )}
    >
      <span
        className="absolute -left-[5px] top-4 size-2 rounded-full bg-primary"
        aria-hidden
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm">
          <span className="font-medium">{actorName ?? "System"}</span>
          <span className="text-muted-foreground">
            {" "}
            · {formatActivitySummary(summary)}
          </span>
        </p>
        {taskTitle ? (
          <p className="truncate text-xs text-muted-foreground">{taskTitle}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {formatWhenTime(occurredAt)}
        </p>
      </div>
    </div>
  );
}
