"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminReportSnapshot } from "@/lib/admin/types";

type AdminDeliveryPanelProps = {
  report: AdminReportSnapshot;
};

export function AdminDeliveryPanel({ report }: AdminDeliveryPanelProps) {
  const [showDetails, setShowDetails] = useState(false);
  const maxStatus = Math.max(1, ...report.byStatus.map((row) => row.count));
  const hoursLogged = Math.round((report.totalMinutesLogged / 60) * 10) / 10;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Delivery
          </h2>
          <p className="text-sm text-muted-foreground">
            Snapshot for the last 7 days and current open load.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowDetails((current) => !current)}
        >
          {showDetails ? "Hide charts" : "View details"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ReportStat label="Open tasks" value={report.openTasks} />
        <ReportStat
          label="Overdue"
          value={report.overdue}
          tone={report.overdue > 0 ? "warn" : "default"}
        />
        <ReportStat
          label="Blocked"
          value={report.blocked}
          tone={report.blocked > 0 ? "warn" : "default"}
        />
        <ReportStat label="Unassigned open" value={report.unassignedOpen} />
        <ReportStat label="Created (7 days)" value={report.createdLast7Days} />
        <ReportStat
          label="Completed (7 days)"
          value={report.completedLast7Days}
        />
        <ReportStat label="Updated (7 days)" value={report.updatedLast7Days} />
        <ReportStat label="All tasks" value={report.totalTasks} />
        <ReportStat
          label="Pending approvals"
          value={report.pendingApprovals}
          tone={report.pendingApprovals > 0 ? "warn" : "default"}
        />
        <ReportStat label="Recurring open" value={report.recurringOpen} />
        <ReportStat label="Hours logged" value={hoursLogged} />
        <ReportStat
          label="30d completion %"
          value={
            report.completionRate30d === null ? "—" : report.completionRate30d
          }
        />
      </div>

      {showDetails ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-border/70 bg-card">
              <header className="border-b border-border/70 px-5 py-4">
                <h3 className="font-heading text-base font-semibold">By status</h3>
              </header>
              <ul className="space-y-4 p-5">
                {report.byStatus.map((row) => (
                  <li key={row.status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span>{row.label}</span>
                      <span className="tabular-nums font-medium">{row.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full w-full origin-left rounded-full bg-primary motion-safe:transition-transform"
                        style={{
                          transform: `scaleX(${row.count / maxStatus})`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card">
              <header className="border-b border-border/70 px-5 py-4">
                <h3 className="font-heading text-base font-semibold">
                  Workspaces
                </h3>
              </header>
              {report.byWorkspace.length === 0 ? (
                <p className="px-5 py-10 text-sm text-muted-foreground">
                  No workspaces with tasks yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border/60 text-[11px] tracking-wide text-muted-foreground uppercase">
                      <tr>
                        <th className="px-5 py-3 font-medium">Workspace</th>
                        <th className="px-3 py-3 font-medium">Open</th>
                        <th className="px-3 py-3 font-medium">Overdue</th>
                        <th className="px-3 py-3 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byWorkspace.map((row) => (
                        <tr
                          key={row.name}
                          className="border-b border-border/40 last:border-0"
                        >
                          <td className="px-5 py-3.5 font-medium">{row.name}</td>
                          <td className="px-3 py-3.5 tabular-nums">{row.open}</td>
                          <td
                            className={cn(
                              "px-3 py-3.5 tabular-nums",
                              row.overdue > 0 && "font-medium text-destructive",
                            )}
                          >
                            {row.overdue}
                          </td>
                          <td className="px-3 py-3.5 tabular-nums text-muted-foreground">
                            {row.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card">
            <header className="border-b border-border/70 px-5 py-4">
              <h3 className="font-heading text-base font-semibold">
                Top creators
              </h3>
              <p className="text-xs text-muted-foreground">
                People who opened the most tasks (currently unarchived)
              </p>
            </header>
            {report.topCreators.length === 0 ? (
              <p className="px-5 py-10 text-sm text-muted-foreground">
                No creators yet.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {report.topCreators.map((row, index) => (
                  <li
                    key={row.name}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="truncate font-medium">{row.name}</span>
                    </div>
                    <span className="tabular-nums text-muted-foreground">
                      {row.count} task{row.count === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function ReportStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "warn";
}) {
  const numeric = typeof value === "number" ? value : null;
  return (
    <div className="rounded-2xl border border-border/70 bg-card px-4 py-3.5">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-heading text-3xl font-semibold tabular-nums tracking-tight",
          tone === "warn" && numeric !== null && numeric > 0 && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}
