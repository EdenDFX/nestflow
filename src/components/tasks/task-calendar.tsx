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
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { STATUS_LABELS, type NestFlowTask } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

export function TaskCalendar({ tasks }: { tasks: NestFlowTask[] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          {format(month, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setMonth((value) => subMonths(value, 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setMonth(startOfMonth(new Date()))}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setMonth((value) => addMonths(value, 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          const today = isSameDay(day, new Date());

          return (
            <div
              key={key}
              className={cn(
                "min-h-28 rounded-xl border border-border/80 p-2",
                inMonth ? "bg-card" : "bg-muted/30 opacity-60",
                today && "border-primary",
              )}
            >
              <div className="mb-2 text-xs font-medium">{format(day, "d")}</div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <Link
                    key={task.id}
                    href={`/app/tasks/${task.id}`}
                    className="block truncate rounded-md bg-primary/10 px-1.5 py-1 text-[11px] text-primary hover:bg-primary/15"
                    title={`${task.title} · ${STATUS_LABELS[task.status]}`}
                  >
                    {task.title}
                  </Link>
                ))}
                {dayTasks.length > 3 ? (
                  <p className="text-[11px] text-muted-foreground">
                    +{dayTasks.length - 3} more
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
