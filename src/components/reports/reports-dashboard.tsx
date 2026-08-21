"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { periodHref, shiftEndingDate } from "@/lib/reports/period";
import type {
  PeriodReport,
  ReportPeriodKind,
  StaffPeriodStats,
} from "@/lib/reports/types";
import { REPORT_PERIOD_KINDS } from "@/lib/reports/types";
import { cn } from "@/lib/utils";

const PERIOD_LABELS: Record<ReportPeriodKind, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const MIX_COLORS = {
  completed: "var(--color-primary, #FF6300)",
  missed: "var(--color-destructive, #dc2626)",
  overdue: "var(--color-warning, #d97706)",
  blocked: "var(--color-muted-foreground, #737373)",
};

const ALL_DEPARTMENTS = "all";

function hoursFromMinutes(minutes: number) {
  return Math.round((minutes / 60) * 10) / 10;
}

function reportsHref(
  kind: ReportPeriodKind,
  endingDate: string | null,
  department: string | null,
) {
  const params = new URLSearchParams({ period: kind });
  if (endingDate) params.set("ending", endingDate);
  if (department) params.set("department", department);
  return `/app/reports?${params.toString()}`;
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card px-4 py-3">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-heading text-2xl font-semibold tabular-nums tracking-tight",
          tone === "warn" && "text-warning-foreground dark:text-warning",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function StaffDetail({ row }: { row: StaffPeriodStats }) {
  const [open, setOpen] = useState(false);
  const name = row.fullName ?? row.email ?? row.nestId ?? "Staff";

  return (
    <article className="rounded-3xl border border-border/70 bg-card">
      <button
        type="button"
        className="flex w-full flex-col gap-3 px-4 py-4 text-left sm:flex-row sm:items-center sm:justify-between"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[row.department, row.nestId, row.email].filter(Boolean).join(" · ") ||
              "No profile extras"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-5 sm:text-sm">
          <Metric label="Done" value={row.completed} />
          <Metric label="Missed" value={row.missed} warn={row.missed > 0} />
          <Metric label="Overdue" value={row.overdue} warn={row.overdue > 0} />
          <Metric label="Blocked" value={row.blocked} warn={row.blocked > 0} />
          <Metric
            label="On-time"
            value={row.onTimeRate == null ? "—" : `${row.onTimeRate}%`}
          />
        </div>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border/70 px-4 py-4">
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>{hoursFromMinutes(row.minutesLogged)}h logged</span>
            <span>
              Avg cycle{" "}
              {row.avgCycleHours == null ? "—" : `${row.avgCycleHours}h`}
            </span>
            <span>
              Created {row.created} · Updated {row.updated}
            </span>
          </div>
          {row.details.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No task-level events in this period.
            </p>
          ) : (
            <ul className="space-y-2">
              {row.details.map((detail) => (
                <li
                  key={`${detail.kind}-${detail.id}`}
                  className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link
                      href={`/app/tasks/${detail.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {detail.title}
                    </Link>
                    <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
                      {detail.kind}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[
                      detail.workspaceName,
                      detail.dueAt
                        ? `Due ${new Date(detail.dueAt).toLocaleString()}`
                        : null,
                      detail.completedAt
                        ? `Done ${new Date(detail.completedAt).toLocaleString()}`
                        : null,
                      detail.blockedReason,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </article>
  );
}

function Metric({
  label,
  value,
  warn,
}: {
  label: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "tabular-nums font-semibold",
          warn && "text-warning-foreground dark:text-warning",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function ReportsDashboard({ report }: { report: PeriodReport }) {
  const router = useRouter();
  const kind = report.period.kind;
  const ending = report.period.endingDate;
  const departments = report.departments ?? [];
  const requireDepartment = report.requireDepartment === true;
  const selectedDepartment = report.department ?? "";
  const waitingForDepartment = requireDepartment && !selectedDepartment;

  const departmentOpt = selectedDepartment || null;

  const mixData = useMemo(
    () =>
      [
        { name: "Completed", key: "completed", value: report.summary.completed },
        { name: "Missed", key: "missed", value: report.summary.missed },
        { name: "Overdue", key: "overdue", value: report.summary.overdue },
        { name: "Blocked", key: "blocked", value: report.summary.blocked },
      ].filter((row) => row.value > 0),
    [report.summary],
  );

  const timeData = useMemo(
    () =>
      report.staff
        .filter((row) => row.minutesLogged > 0)
        .slice(0, 12)
        .map((row) => ({
          name: row.fullName?.split(" ")[0] ?? row.nestId ?? "Staff",
          hours: hoursFromMinutes(row.minutesLogged),
        })),
    [report.staff],
  );

  const onTimeData = useMemo(
    () =>
      report.staff
        .filter((row) => row.onTimeRate != null)
        .slice(0, 12)
        .map((row) => ({
          name: row.fullName?.split(" ")[0] ?? row.nestId ?? "Staff",
          rate: row.onTimeRate ?? 0,
        })),
    [report.staff],
  );

  const prevEnding = shiftEndingDate(kind, ending, -1);
  const nextEnding = shiftEndingDate(kind, ending, 1);

  function onDepartmentChange(value: string) {
    router.push(periodHref(kind, ending, { department: value }));
  }

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
            {report.scope === "org" ? "Organisation" : "Managed teams"}
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Staff performance
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Completed, missed, overdue, and blocked work with timeframes for
            each person in scope. Digests go out daily, weekly, and monthly.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {REPORT_PERIOD_KINDS.map((periodKind) => (
              <Button
                key={periodKind}
                asChild
                size="sm"
                variant={periodKind === kind ? "default" : "outline"}
              >
                <Link
                  href={
                    periodKind === kind
                      ? periodHref(periodKind, ending, {
                          department: departmentOpt,
                        })
                      : reportsHref(periodKind, null, departmentOpt)
                  }
                >
                  {PERIOD_LABELS[periodKind]}
                </Link>
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link
                href={periodHref(kind, prevEnding, {
                  department: departmentOpt,
                })}
              >
                Previous
              </Link>
            </Button>
            <p className="min-w-0 flex-1 text-center text-sm font-medium sm:flex-none">
              {report.period.label}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link
                href={periodHref(kind, nextEnding, {
                  department: departmentOpt,
                })}
              >
                Next
              </Link>
            </Button>
          </div>
        </div>

        {(requireDepartment || departments.length > 0) && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Department
              </p>
              <p className="text-sm text-muted-foreground">
                {requireDepartment
                  ? "Choose a department to load staff rows and charts."
                  : "Optionally narrow the report to one department."}
              </p>
            </div>
            <Select
              value={
                selectedDepartment ||
                (!requireDepartment ? ALL_DEPARTMENTS : undefined)
              }
              onValueChange={onDepartmentChange}
            >
              <SelectTrigger
                className="w-full sm:w-[240px]"
                aria-label="Department"
              >
                <SelectValue
                  placeholder={
                    requireDepartment
                      ? "Select department"
                      : "All departments"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_DEPARTMENTS}>All departments</SelectItem>
                {departments.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </header>

      {waitingForDepartment ? (
        <div className="rounded-3xl border border-dashed border-border/70 px-6 py-16 text-center">
          <p className="font-heading text-lg font-semibold">Pick a department</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Admin reports stay scoped by department so you are not dumped into
            the full organisation list by default. Select a department above,
            or choose All departments when you need the org view.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatCard label="People" value={report.summary.staffCount} />
            <StatCard label="Completed" value={report.summary.completed} />
            <StatCard
              label="Missed"
              value={report.summary.missed}
              tone={report.summary.missed > 0 ? "warn" : "default"}
            />
            <StatCard
              label="Overdue"
              value={report.summary.overdue}
              tone={report.summary.overdue > 0 ? "warn" : "default"}
            />
            <StatCard
              label="Blocked"
              value={report.summary.blocked}
              tone={report.summary.blocked > 0 ? "warn" : "default"}
            />
            <StatCard
              label="On-time %"
              value={
                report.summary.onTimeRate == null
                  ? "—"
                  : report.summary.onTimeRate
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
              <h2 className="font-heading text-base font-semibold">
                Outcome mix
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Totals for the selected period
              </p>
              <div className="h-64 w-full">
                {mixData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mixData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        {mixData.map((row) => (
                          <Cell
                            key={row.key}
                            fill={MIX_COLORS[row.key as keyof typeof MIX_COLORS]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
              <h2 className="font-heading text-base font-semibold">
                Completed vs missed
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Day buckets in Lagos time
              </p>
              <div className="h-64 w-full">
                {report.buckets.every(
                  (b) => b.completed === 0 && b.missed === 0,
                ) ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.buckets}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                      />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="completed"
                        name="Completed"
                        fill={MIX_COLORS.completed}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="missed"
                        name="Missed"
                        fill={MIX_COLORS.missed}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
              <h2 className="font-heading text-base font-semibold">
                Time logged
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Hours by person
              </p>
              <div className="h-64 w-full">
                {timeData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timeData}
                      layout="vertical"
                      margin={{ left: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                      />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={64}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="hours"
                        name="Hours"
                        fill={MIX_COLORS.completed}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
              <h2 className="font-heading text-base font-semibold">
                On-time rate
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Completed on time ÷ (on time + missed)
              </p>
              <div className="h-64 w-full">
                {onTimeData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={onTimeData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                      />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar
                        dataKey="rate"
                        name="On-time %"
                        fill={MIX_COLORS.overdue}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          </div>

          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-semibold">
                Each staff member
              </h2>
              <p className="text-sm text-muted-foreground">
                Expand a row for task-level completed, missed, overdue, and
                blocked detail.{" "}
                {hoursFromMinutes(report.summary.minutesLogged)}h logged in
                total.
              </p>
            </div>
            {report.staff.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                No active people in your report scope.
              </p>
            ) : (
              <div className="space-y-3">
                {report.staff.map((row) => (
                  <StaffDetail key={row.userId} row={row} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      No data in this period
    </div>
  );
}
