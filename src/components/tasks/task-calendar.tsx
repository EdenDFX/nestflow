"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type NestFlowTask,
  type TaskPriority,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: "bg-emerald-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function TaskCalendar({ tasks }: { tasks: NestFlowTask[] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, NestFlowTask[]>();
    for (const task of tasks) {
      if (!task.dueAt) continue;
      const key = format(new Date(task.dueAt), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  const selectedKey = format(selectedDay, "yyyy-MM-dd");
  const selectedTasks = tasksByDay.get(selectedKey) ?? [];

  function goToMonth(next: Date) {
    setMonth(startOfMonth(next));
    if (!isSameMonth(selectedDay, next)) {
      setSelectedDay(startOfMonth(next));
    }
  }

  function selectDay(day: Date) {
    setSelectedDay(day);
    if (!isSameMonth(day, month)) {
      setMonth(startOfMonth(day));
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="min-w-0 truncate font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          {format(month, "MMMM yyyy")}
        </h2>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 sm:size-9"
            onClick={() => goToMonth(subMonths(month, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
            onClick={() => {
              const today = new Date();
              setMonth(startOfMonth(today));
              setSelectedDay(today);
            }}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 sm:size-9"
            onClick={() => goToMonth(addMonths(month, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/*
        Mobile mesh calendar:
        - No per-cell radius (that made thin stadium “pills”)
        - No gap between cells
        - Fixed row height via grid-auto-rows (not min-h-28 / aspect-ratio)
      */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((label) => (
            <div
              key={label}
              className="py-2 text-center text-[11px] font-semibold text-foreground sm:text-xs sm:font-medium sm:text-muted-foreground"
            >
              <span aria-hidden className="sm:hidden">
                {label.charAt(0)}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>

        <div
          className={cn(
            "grid grid-cols-7",
            // Mobile: short square-ish rows. Desktop: taller for task chips.
            "auto-rows-[3rem] sm:auto-rows-[6.5rem]",
          )}
        >
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            const today = isSameDay(day, new Date());
            const selected = isSameDay(day, selectedDay);
            const visibleDesktop = dayTasks.slice(0, 2);
            const overflow = dayTasks.length - visibleDesktop.length;

            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => selectDay(day)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectDay(day);
                  }
                }}
                aria-label={format(day, "EEEE d MMMM yyyy")}
                aria-current={today ? "date" : undefined}
                aria-pressed={selected}
                className={cn(
                  "relative flex h-full min-h-0 w-full min-w-0 flex-col rounded-none border-0 border-r border-b border-border p-1 text-left outline-none",
                  "[&:nth-child(7n)]:border-r-0",
                  "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  "active:bg-muted/50 sm:hover:bg-muted/30",
                  !inMonth && "text-muted-foreground/40",
                  inMonth && "text-foreground",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-medium tabular-nums sm:size-7 sm:text-sm",
                    selected && "bg-foreground font-semibold text-background",
                    today &&
                      !selected &&
                      "bg-primary font-semibold text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>

                {dayTasks.length > 0 ? (
                  <div
                    className="mt-auto flex justify-center gap-0.5 pb-0.5 sm:hidden"
                    aria-hidden
                  >
                    {dayTasks.slice(0, 3).map((task) => (
                      <span
                        key={task.id}
                        className={cn(
                          "size-1 rounded-full",
                          PRIORITY_DOT[task.priority],
                        )}
                      />
                    ))}
                  </div>
                ) : null}

                <div className="hidden min-h-0 flex-1 space-y-0.5 overflow-hidden sm:block">
                  {visibleDesktop.map((task) => (
                    <Link
                      key={task.id}
                      href={`/app/tasks/${task.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "block truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight text-white",
                        PRIORITY_DOT[task.priority],
                      )}
                      title={`${task.title} · ${STATUS_LABELS[task.status]}`}
                    >
                      {task.title}
                    </Link>
                  ))}
                  {overflow > 0 ? (
                    <p className="px-0.5 text-[10px] text-muted-foreground">
                      +{overflow} more
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section
        className="rounded-2xl border border-border bg-card p-3 sm:p-4"
        aria-label={`Tasks for ${format(selectedDay, "EEEE d MMMM")}`}
      >
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h3 className="font-heading text-sm font-semibold tracking-tight sm:text-base">
            {isSameDay(selectedDay, new Date())
              ? "Today"
              : format(selectedDay, "EEE d MMM")}
          </h3>
          <span className="text-xs text-muted-foreground">
            {selectedTasks.length === 0
              ? "No due tasks"
              : `${selectedTasks.length} task${selectedTasks.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {selectedTasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nothing due this day. Tap another date or set due dates on tasks.
          </p>
        ) : (
          <ul className="space-y-2">
            {selectedTasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/app/tasks/${task.id}`}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-muted/40"
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      PRIORITY_DOT[task.priority],
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {task.title}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>{STATUS_LABELS[task.status]}</span>
                      <span aria-hidden>·</span>
                      <span>{PRIORITY_LABELS[task.priority]}</span>
                      {task.dueAt ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>
                            {format(new Date(task.dueAt), "HH:mm")}
                          </span>
                        </>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
