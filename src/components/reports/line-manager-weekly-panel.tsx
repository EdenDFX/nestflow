"use client";

import Link from "next/link";
import { useState } from "react";

import type { LineManagerWeeklyReport } from "@/lib/reports/types";
import { cn } from "@/lib/utils";

export function LineManagerWeeklyPanel({
  report,
}: {
  report: LineManagerWeeklyReport;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Line manager weekly
        </h2>
        <p className="text-sm text-muted-foreground">
          {report.period.label}. Assignments made by each line manager, with
          completions, missed deadlines (failed), open unrest, and block list.
        </p>
      </div>

      {report.managers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
          No line managers found.
        </p>
      ) : (
        <ul className="space-y-3">
          {report.managers.map((manager) => {
            const label =
              manager.fullName ?? manager.nestId ?? manager.email ?? "Manager";
            const expanded = openId === manager.userId;
            return (
              <li
                key={manager.userId}
                className="rounded-2xl border border-border/70 bg-card"
              >
                <button
                  type="button"
                  className="flex w-full flex-col gap-3 px-4 py-4 text-left sm:flex-row sm:items-center sm:justify-between"
                  onClick={() =>
                    setOpenId(expanded ? null : manager.userId)
                  }
                >
                  <div>
                    <p className="font-medium">{label}</p>
                    {manager.nestId ? (
                      <p className="text-xs text-muted-foreground">
                        Nest ID {manager.nestId}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <Metric label="Assigned" value={manager.assigned} />
                    <Metric label="Completed" value={manager.completed} />
                    <Metric
                      label="Failed"
                      value={manager.failed}
                      warn={manager.failed > 0}
                    />
                    <Metric
                      label="Unrest"
                      value={manager.unrest}
                      warn={manager.unrest > 0}
                    />
                  </div>
                </button>

                {expanded ? (
                  <div className="border-t border-border/70 px-4 py-4">
                    <h3 className="text-sm font-medium">Block list</h3>
                    {manager.blockList.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No blocked tasks from this manager&apos;s weekly
                        assignments.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {manager.blockList.map((item) => (
                          <li
                            key={item.taskId}
                            className="rounded-xl bg-muted/50 px-3 py-2 text-sm"
                          >
                            <Link
                              href={`/app/tasks/${item.taskId}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {item.title}
                            </Link>
                            <p className="mt-1 text-muted-foreground">
                              {item.blockedReason?.trim() || "No reason given"}
                            </p>
                            {item.assigneeNames.length > 0 ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Assignees: {item.assigneeNames.join(", ")}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "tabular-nums font-semibold",
          warn ? "text-destructive" : null,
        )}
      >
        {value}
      </p>
    </div>
  );
}
