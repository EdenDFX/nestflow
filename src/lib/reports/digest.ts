import { periodHref } from "@/lib/reports/period";
import type { PeriodReport, ReportPeriodKind } from "@/lib/reports/types";

const PERIOD_TITLE: Record<ReportPeriodKind, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function formatDigestTitle(kind: ReportPeriodKind): string {
  return `${PERIOD_TITLE[kind]} staff performance report`;
}

export function formatDigestBody(report: PeriodReport): string {
  const { summary, period, staff } = report;
  const onTime =
    summary.onTimeRate == null ? "—" : `${summary.onTimeRate}% on-time`;

  const topMissed = [...staff]
    .filter((row) => row.missed > 0)
    .sort((a, b) => b.missed - a.missed)
    .slice(0, 3)
    .map((row) => `${row.fullName ?? row.email ?? "Staff"} (${row.missed})`)
    .join(", ");

  const topBlocked = [...staff]
    .filter((row) => row.blocked > 0)
    .sort((a, b) => b.blocked - a.blocked)
    .slice(0, 3)
    .map((row) => `${row.fullName ?? row.email ?? "Staff"} (${row.blocked})`)
    .join(", ");

  const lines = [
    `${period.label} · ${summary.staffCount} people`,
    `Completed ${summary.completed} · Missed ${summary.missed} · Overdue ${summary.overdue} · Blocked ${summary.blocked} · ${onTime}`,
  ];

  if (topMissed) lines.push(`Top missed: ${topMissed}`);
  if (topBlocked) lines.push(`Top blocked: ${topBlocked}`);
  lines.push("Open NestFlow for charts and per-person detail.");

  return lines.join("\n");
}

export function digestHref(report: PeriodReport): string {
  return periodHref(report.period.kind, report.period.endingDate);
}
