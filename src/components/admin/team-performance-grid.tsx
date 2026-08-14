"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CircleCheckIcon } from "@/components/icons/circle-check";
import { CircleDashedIcon } from "@/components/icons/circle-dashed";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WorkloadRow } from "@/lib/admin/types";
import {
  STATUS_LABELS,
  isTaskStatus,
  type TaskStatus,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

export const TEAM_LOAD_CAP = 5;

type LoadTone = "healthy" | "balanced" | "warning" | "over";

function initials(name: string | null, fallback: string | null) {
  const source = (name ?? fallback ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function departmentLabel(value: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "No department";
}

export function getLoadMetrics(row: WorkloadRow, loadCap = TEAM_LOAD_CAP) {
  const rawPercent = Math.round((row.openCount / loadCap) * 100);
  const fillPercent = Math.min(100, rawPercent);
  const overCapacity = row.openCount > loadCap;

  let tone: LoadTone = "healthy";
  if (overCapacity) {
    tone = "over";
  } else if (row.blockedCount > 0 || row.overdueCount > 0) {
    tone = "warning";
  } else if (rawPercent >= 60) {
    tone = "balanced";
  }

  return {
    loadCap,
    rawPercent,
    fillPercent,
    overCapacity,
    tone,
    label: `${row.openCount}/${loadCap} open`,
  };
}

const toneBarClass: Record<LoadTone, string> = {
  healthy: "bg-success",
  balanced: "bg-sky-500",
  warning: "bg-warning",
  over: "bg-destructive",
};

const toneTextClass: Record<LoadTone, string> = {
  healthy: "text-success",
  balanced: "text-sky-600 dark:text-sky-300",
  warning: "text-warning-foreground dark:text-warning",
  over: "text-destructive",
};

function FocusIcon({ status }: { status: string | null | undefined }) {
  if (status === "completed") {
    return <CircleCheckIcon className="inline-flex shrink-0 text-success" size={14} aria-hidden />;
  }
  if (status === "in_progress") {
    return (
      <CircleDashedIcon className="inline-flex shrink-0 text-primary" size={14} aria-hidden />
    );
  }
  return (
    <span
      className="mt-0.5 size-2 shrink-0 rounded-full bg-muted-foreground/50"
      aria-hidden
    />
  );
}

function PerformanceCard({
  row,
  index,
}: {
  row: WorkloadRow;
  index: number;
}) {
  const load = getLoadMetrics(row);
  const role = row.isManager ? "Line manager" : "Staff";
  const focusStatus = row.focusTaskStatus;
  const statusLabel =
    focusStatus && isTaskStatus(focusStatus)
      ? STATUS_LABELS[focusStatus as TaskStatus]
      : null;

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-4",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300",
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        <Link href={`/app/team?person=${row.userId}`} className="shrink-0">
          <Avatar size="lg" className="bg-muted">
            <AvatarFallback className="font-heading text-sm font-semibold">
              {initials(row.fullName, row.nestId ?? row.email)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/app/team?person=${row.userId}`}
            className="truncate font-heading text-base font-semibold tracking-tight hover:text-primary"
          >
            {row.fullName ?? "Unnamed"}
          </Link>
          <p className="truncate text-sm text-muted-foreground">{role}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="tabular-nums text-muted-foreground">{load.label}</span>
          <span
            className={cn(
              "tabular-nums font-medium",
              toneTextClass[load.tone],
            )}
          >
            {load.rawPercent}%
          </span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={load.fillPercent}
          aria-label={`Open task load ${load.rawPercent} percent of capacity ${load.loadCap}`}
        >
          <div
            className={cn(
              "h-full w-full origin-left rounded-full motion-safe:transition-transform duration-300",
              toneBarClass[load.tone],
            )}
            style={{ transform: `scaleX(${load.fillPercent / 100})` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {load.overCapacity
            ? "Over capacity"
            : load.tone === "warning"
              ? "Attention: blocked or overdue work"
              : load.tone === "balanced"
                ? "Near capacity"
                : "Healthy load"}
        </p>
      </div>

      <dl className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded-lg bg-muted/50 px-2 py-2">
          <dt className="text-muted-foreground">Blocked</dt>
          <dd className="mt-0.5 tabular-nums font-semibold">
            {row.blockedCount}
          </dd>
        </div>
        <div className="rounded-lg bg-muted/50 px-2 py-2">
          <dt className="text-muted-foreground">Overdue</dt>
          <dd className="mt-0.5 tabular-nums font-semibold">
            {row.overdueCount}
          </dd>
        </div>
        <div className="rounded-lg bg-muted/50 px-2 py-2">
          <dt className="text-muted-foreground">Done</dt>
          <dd className="mt-0.5 tabular-nums font-semibold">
            {row.completedCount}
          </dd>
        </div>
        <div className="rounded-lg bg-muted/50 px-2 py-2">
          <dt className="text-muted-foreground">Time</dt>
          <dd className="mt-0.5 tabular-nums font-semibold">
            {row.minutesLogged >= 60
              ? `${Math.round((row.minutesLogged / 60) * 10) / 10}h`
              : `${row.minutesLogged}m`}
          </dd>
        </div>
      </dl>

      <div className="mt-auto border-t border-border/60 pt-3">
        {row.focusTaskId && row.focusTaskTitle ? (
          <Link
            href={`/app/tasks/${row.focusTaskId}`}
            className="flex items-start gap-2 text-sm transition-colors hover:text-primary"
          >
            <FocusIcon status={focusStatus} />
            <span className="min-w-0">
              <span className="line-clamp-1 font-medium">
                {row.focusTaskTitle}
              </span>
              {statusLabel ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {statusLabel}
                </span>
              ) : null}
            </span>
          </Link>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <FocusIcon status={null} />
            No open focus task
          </p>
        )}
      </div>
    </article>
  );
}

export function TeamPerformanceGrid({ workload }: { workload: WorkloadRow[] }) {
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | "all">(
    "all",
  );

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const row of workload) {
      set.add(departmentLabel(row.department));
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [workload]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workload.filter((row) => {
      const dept = departmentLabel(row.department);
      if (departmentFilter !== "all" && dept !== departmentFilter) {
        return false;
      }
      if (!q) return true;
      return [row.fullName, row.nestId, row.email, row.department]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q));
    });
  }, [workload, query, departmentFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, WorkloadRow[]>();
    for (const row of filtered) {
      const key = departmentLabel(row.department);
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  if (workload.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
        No people on this roster yet. HR or Admin can place members on your
        team.
      </p>
    );
  }

  let cardIndex = 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people…"
          className="max-w-sm"
          aria-label="Search team members"
        />
        {departments.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={departmentFilter === "all" ? "default" : "outline"}
              onClick={() => setDepartmentFilter("all")}
            >
              All
            </Button>
            {departments.map((dept) => (
              <Button
                key={dept}
                type="button"
                size="sm"
                variant={departmentFilter === dept ? "default" : "outline"}
                onClick={() => setDepartmentFilter(dept)}
              >
                {dept}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-sm text-muted-foreground">
          No people match this search.
        </p>
      ) : (
        groups.map(([dept, rows]) => (
          <section key={dept} className="space-y-3">
            <h2 className="font-heading text-sm font-semibold tracking-tight text-muted-foreground">
              {dept}{" "}
              <span className="tabular-nums font-normal">({rows.length})</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((row) => {
                const index = cardIndex++;
                return (
                  <PerformanceCard key={row.userId} row={row} index={index} />
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
