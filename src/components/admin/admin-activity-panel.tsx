"use client";

import Link from "next/link";

import { AdminActivityItem } from "@/components/admin/ui/admin-activity-item";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OversightLogEntry } from "@/lib/admin/types";

type AdminActivityPanelProps = {
  entries: OversightLogEntry[];
  query: string;
  onQueryChange: (value: string) => void;
};

export function AdminActivityPanel({
  entries,
  query,
  onQueryChange,
}: AdminActivityPanelProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Activity
          </h2>
          <p className="text-sm text-muted-foreground">
            Task updates and admin actions, newest first.
          </p>
        </div>
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Filter activity…"
          className="h-11 w-full max-w-sm rounded-xl"
          aria-label="Filter activity log"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card px-5 py-2">
        {entries.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted-foreground">
            No activity matches.
          </p>
        ) : (
          <ul>
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-2 border-b border-border/50 py-1 last:border-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <AdminActivityItem
                  actorName={entry.actorName}
                  summary={entry.summary}
                  occurredAt={entry.at}
                  taskTitle={entry.taskTitle}
                  className="flex-1 border-l-0 pl-0"
                />
                {entry.taskId ? (
                  <Link
                    href={`/app/tasks/${entry.taskId}`}
                    className={cn(
                      "mb-3 shrink-0 self-start rounded-lg border border-border/80 px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary sm:mt-3",
                    )}
                  >
                    Open task
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
