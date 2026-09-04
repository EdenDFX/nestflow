"use client";

import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { AdminWeekCalendar } from "@/components/admin/ui/admin-week-calendar";
import { ChevronLeftIcon } from "@/components/icons/chevron-left";
import { ChevronRightIcon } from "@/components/icons/chevron-right";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OversightTaskRow } from "@/lib/admin/types";

import {
  getWeekInterval,
  pickCalendarFocusTask,
  QUICK_FILTERS,
  shiftWeek,
  taskCalendarDayKey,
  taskMatchesStatusFilter,
  type StatusFilter,
} from "./admin-shared";

type AdminTasksPanelProps = {
  tasks: OversightTaskRow[];
  total: number;
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  /** Bumped when a sidebar metric is clicked so the calendar can jump. */
  focusToken?: number;
};

function scrollToCalendarTarget(targetId: string | null) {
  const el = targetId
    ? document.getElementById(`admin-calendar-task-${targetId}`)
    : document.getElementById("admin-calendar-unscheduled");
  if (!el) return false;
  el.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });
  return true;
}

export function AdminTasksPanel({
  tasks,
  total,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  focusToken = 0,
}: AdminTasksPanelProps) {
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [focusedTaskIds, setFocusedTaskIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  const { start, end } = useMemo(
    () => getWeekInterval(weekAnchor),
    [weekAnchor],
  );

  const isCurrentWeek = useMemo(() => {
    const now = getWeekInterval(new Date());
    return start.getTime() === now.start.getTime();
  }, [start]);

  const hasActiveFilters = statusFilter !== "all" || query.trim().length > 0;

  useEffect(() => {
    if (focusToken <= 0) return;

    const focusTask = pickCalendarFocusTask(tasks, statusFilter);
    const matchingIds = new Set(
      tasks
        .filter((task) => taskMatchesStatusFilter(task, statusFilter))
        .map((task) => task.id),
    );
    setFocusedTaskIds(matchingIds);

    if (focusTask) {
      const dayKey = taskCalendarDayKey(focusTask);
      if (dayKey) {
        setWeekAnchor(new Date(`${dayKey}T12:00:00`));
      }
      setPendingScrollId(focusTask.id);
    } else if (matchingIds.size > 0) {
      setPendingScrollId([...matchingIds][0] ?? null);
    } else {
      setPendingScrollId(null);
      window.setTimeout(() => {
        scrollToCalendarTarget(null);
      }, 80);
    }

    const clear = window.setTimeout(() => {
      setFocusedTaskIds(new Set());
    }, 2800);

    return () => {
      window.clearTimeout(clear);
    };
  }, [focusToken, statusFilter, tasks]);

  useEffect(() => {
    if (focusToken <= 0 || !pendingScrollId) return;

    let attempts = 0;
    let timer = 0;

    const tryScroll = () => {
      attempts += 1;
      if (scrollToCalendarTarget(pendingScrollId)) {
        setPendingScrollId(null);
        return;
      }
      if (attempts < 8) {
        timer = window.setTimeout(tryScroll, 80);
      } else {
        scrollToCalendarTarget(null);
        setPendingScrollId(null);
      }
    };

    timer = window.setTimeout(tryScroll, 50);
    return () => {
      window.clearTimeout(timer);
    };
  }, [focusToken, pendingScrollId, weekAnchor, tasks]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {tasks.length === 0 ? (
            <>No matching tasks</>
          ) : (
            <>
              <span className="tabular-nums font-medium text-foreground">
                {tasks.length}
              </span>
              {tasks.length !== total ? (
                <>
                  {" "}
                  matching ·{" "}
                  <span className="tabular-nums font-medium text-foreground">
                    {total}
                  </span>{" "}
                  loaded
                </>
              ) : (
                " tasks"
              )}
            </>
          )}
        </p>

        <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="rounded-full"
              aria-label="Previous week"
              onClick={() => setWeekAnchor((current) => shiftWeek(current, -1))}
            >
              <ChevronLeftIcon className="inline-flex" aria-hidden />
            </Button>
            <span className="min-w-[7.5rem] text-center font-heading text-base font-semibold tabular-nums sm:min-w-[8.5rem] sm:text-lg">
              {format(start, "d MMM")} – {format(end, "d MMM")}
            </span>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="rounded-full"
              aria-label="Next week"
              onClick={() => setWeekAnchor((current) => shiftWeek(current, 1))}
            >
              <ChevronRightIcon className="inline-flex" aria-hidden />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {!isCurrentWeek ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={() => setWeekAnchor(new Date())}
              >
                Today
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant={filtersOpen || hasActiveFilters ? "secondary" : "ghost"}
              className="rounded-full"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
            >
              Filters
            </Button>
          </div>
        </div>
      </div>

      {filtersOpen ? (
        <div className="admin-dashboard__filters space-y-3">
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search title, assignee, workspace…"
            aria-label="Search tasks"
            className="h-10 rounded-full border-0 bg-background/80 px-4 shadow-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {QUICK_FILTERS.map((filter) => {
              const active = statusFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => onStatusFilterChange(filter.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "bg-background/70 text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={active}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => {
                onStatusFilterChange("all");
                onQueryChange("");
              }}
            >
              Reset filters
            </Button>
          ) : null}
        </div>
      ) : null}

      <AdminWeekCalendar
        tasks={tasks}
        weekAnchor={weekAnchor}
        focusedTaskIds={focusedTaskIds}
      />

      {tasks.length === 0 ? (
        <div className="admin-dashboard__empty">
          <p className="font-heading text-lg font-semibold">No matching tasks</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another filter or clear the search.
          </p>
        </div>
      ) : null}
    </section>
  );
}
