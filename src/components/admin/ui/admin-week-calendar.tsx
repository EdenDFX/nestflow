"use client";

import { format, isSameDay } from "date-fns";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";

import { AdminWeekTaskBlock } from "@/components/admin/ui/admin-week-task-block";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { OversightTaskRow } from "@/lib/admin/types";

import {
  ADMIN_SPRING,
  ADMIN_SPRING_SOFT,
  CALENDAR_HOUR_END,
  CALENDAR_HOUR_START,
  getWeekInterval,
  isCalendarAllDay,
  isToday,
  taskCalendarDate,
  taskCalendarDayKey,
  taskCalendarHour,
} from "../admin-shared";

const HOURS = Array.from(
  { length: CALENDAR_HOUR_END - CALENDAR_HOUR_START + 1 },
  (_, index) => CALENDAR_HOUR_START + index,
);

type AdminWeekCalendarProps = {
  tasks: OversightTaskRow[];
  weekAnchor: Date;
  className?: string;
  focusedTaskIds?: ReadonlySet<string>;
};

/** Soft week grid for the admin tasks canvas; day mode under 768px. */
export function AdminWeekCalendar({
  tasks,
  weekAnchor,
  className,
  focusedTaskIds,
}: AdminWeekCalendarProps) {
  const preferReduced = useReducedMotion();
  const isCompact = useMediaQuery("(max-width: 767px)");
  const { start, end, days } = useMemo(
    () => getWeekInterval(weekAnchor),
    [weekAnchor],
  );

  const weekStartKey = format(days[0] ?? new Date(), "yyyy-MM-dd");
  const defaultDay = days.find((day) => isToday(day)) ?? days[0] ?? new Date();
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [dayDirection, setDayDirection] = useState(0);
  const [syncedWeekKey, setSyncedWeekKey] = useState(weekStartKey);
  if (weekStartKey !== syncedWeekKey) {
    setSyncedWeekKey(weekStartKey);
    setSelectedDay(defaultDay);
  }

  const focusedDay = useMemo(() => {
    if (!focusedTaskIds || focusedTaskIds.size === 0) return null;
    for (const day of days) {
      const key = format(day, "yyyy-MM-dd");
      const dayTasks = tasks.filter(
        (task) => taskCalendarDayKey(task) === key,
      );
      if (dayTasks.some((task) => focusedTaskIds.has(task.id))) {
        return day;
      }
    }
    return null;
  }, [focusedTaskIds, days, tasks]);

  const [syncedFocusKey, setSyncedFocusKey] = useState<string | null>(null);
  const focusKey = focusedDay ? format(focusedDay, "yyyy-MM-dd") : null;
  if (focusKey && focusKey !== syncedFocusKey) {
    setSyncedFocusKey(focusKey);
    setSelectedDay(focusedDay!);
  } else if (!focusKey && syncedFocusKey) {
    setSyncedFocusKey(null);
  }

  const tasksInWeek = useMemo(() => {
    return tasks.filter((task) => {
      const key = taskCalendarDayKey(task);
      if (!key) return false;
      const date = new Date(`${key}T12:00:00`);
      return date >= start && date <= end;
    });
  }, [tasks, start, end]);

  const byDay = useMemo(() => {
    const map = new Map<string, OversightTaskRow[]>();
    for (const day of days) {
      map.set(format(day, "yyyy-MM-dd"), []);
    }
    for (const task of tasksInWeek) {
      const key = taskCalendarDayKey(task);
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => {
        const aTime = taskCalendarDate(a)?.getTime() ?? 0;
        const bTime = taskCalendarDate(b)?.getTime() ?? 0;
        return aTime - bTime;
      });
    }
    return map;
  }, [days, tasksInWeek]);

  const hasAllDay = useMemo(() => {
    if (isCompact) {
      const key = format(selectedDay, "yyyy-MM-dd");
      return (byDay.get(key) ?? []).some((task) => isCalendarAllDay(task));
    }
    return days.some((day) => {
      const key = format(day, "yyyy-MM-dd");
      return (byDay.get(key) ?? []).some((task) => isCalendarAllDay(task));
    });
  }, [days, byDay, isCompact, selectedDay]);

  const activeHours = useMemo(() => {
    const sourceDays = isCompact ? [selectedDay] : days;
    const used = new Set<number>();
    for (const day of sourceDays) {
      const key = format(day, "yyyy-MM-dd");
      for (const task of byDay.get(key) ?? []) {
        const hour = taskCalendarHour(task);
        if (hour !== null) used.add(hour);
      }
    }
    if (used.size === 0) return HOURS.slice(0, 6);
    const min = Math.min(...used, CALENDAR_HOUR_START);
    const max = Math.max(...used, Math.min(...used) + 3);
    return HOURS.filter((hour) => hour >= min && hour <= Math.max(max, min + 3));
  }, [byDay, days, isCompact, selectedDay]);

  const unscheduled = useMemo(
    () => tasks.filter((task) => !taskCalendarDayKey(task)),
    [tasks],
  );

  function selectDay(day: Date) {
    setDayDirection(day.getTime() >= selectedDay.getTime() ? 1 : -1);
    setSelectedDay(day);
  }

  const selectedKey = format(selectedDay, "yyyy-MM-dd");
  const selectedTasks = byDay.get(selectedKey) ?? [];

  const spring = preferReduced ? { duration: 0.01 } : ADMIN_SPRING;
  const softSpring = preferReduced ? { duration: 0.01 } : ADMIN_SPRING_SOFT;

  return (
    <div className={cn("space-y-4", className)}>
      <motion.div
        layout
        transition={spring}
        className={cn(
          "admin-dashboard__calendar-shell",
          isCompact && "is-day-mode",
        )}
      >
        {isCompact ? (
          <LayoutGroup id="admin-calendar-days">
            <div
              className="admin-dashboard__day-strip"
              role="tablist"
              aria-label="Week days"
            >
              {days.map((day) => {
                const selected = isSameDay(day, selectedDay);
                const today = isToday(day);
                const weekend = day.getDay() === 0 || day.getDay() === 6;
                const count = (byDay.get(format(day, "yyyy-MM-dd")) ?? []).length;
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => selectDay(day)}
                    className={cn(
                      "admin-dashboard__day-chip",
                      today && "is-today",
                      weekend && "is-weekend",
                      selected && "is-selected",
                    )}
                  >
                    {selected ? (
                      <motion.span
                        layoutId="admin-day-chip-active"
                        className="admin-dashboard__day-chip-glow"
                        transition={spring}
                      />
                    ) : null}
                    <span className="admin-dashboard__day-chip-name">
                      {format(day, "EEE")}
                    </span>
                    <span className="admin-dashboard__day-chip-number">
                      {format(day, "d")}
                    </span>
                    {count > 0 ? (
                      <span className="admin-dashboard__day-chip-count">
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="popLayout" custom={dayDirection} initial={false}>
              <motion.div
                key={selectedKey}
                custom={dayDirection}
                initial={
                  preferReduced
                    ? { opacity: 0 }
                    : { opacity: 0, x: dayDirection * 28 }
                }
                animate={{ opacity: 1, x: 0 }}
                exit={
                  preferReduced
                    ? { opacity: 0 }
                    : { opacity: 0, x: dayDirection * -22 }
                }
                transition={softSpring}
                className="admin-dashboard__calendar admin-dashboard__calendar--day"
              >
                <div className="admin-dashboard__calendar-day-label">
                  <p className="admin-dashboard__calendar-day-name">
                    {format(selectedDay, "EEEE")}
                  </p>
                  <p className="admin-dashboard__calendar-day-number">
                    {format(selectedDay, "d MMM")}
                  </p>
                </div>

                <div className="admin-dashboard__calendar-day-grid">
                  {hasAllDay ? (
                    <div className="admin-dashboard__calendar-row is-all-day is-single">
                      <div className="admin-dashboard__calendar-gutter">
                        <span>All day</span>
                      </div>
                      <div
                        className={cn(
                          "admin-dashboard__calendar-cell",
                          isToday(selectedDay) && "is-today",
                        )}
                      >
                        {selectedTasks
                          .filter((task) => isCalendarAllDay(task))
                          .map((task) => (
                            <AdminWeekTaskBlock
                              key={task.id}
                              task={task}
                              href={`/app/tasks/${task.id}`}
                              compact
                              focused={focusedTaskIds?.has(task.id)}
                            />
                          ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="admin-dashboard__calendar-body">
                    {activeHours.map((hour) => {
                      const hourTasks = selectedTasks.filter(
                        (task) => taskCalendarHour(task) === hour,
                      );
                      return (
                        <div
                          key={hour}
                          className="admin-dashboard__calendar-row is-single"
                        >
                          <div className="admin-dashboard__calendar-gutter">
                            <span>
                              {format(
                                new Date(2000, 0, 1, hour, 0),
                                "ha",
                              ).toLowerCase()}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "admin-dashboard__calendar-cell",
                              isToday(selectedDay) && "is-today",
                            )}
                          >
                            {hourTasks.map((task) => (
                              <AdminWeekTaskBlock
                                key={task.id}
                                task={task}
                                href={`/app/tasks/${task.id}`}
                                compact
                                focused={focusedTaskIds?.has(task.id)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        ) : (
          <motion.div layout transition={spring} className="admin-dashboard__calendar">
            <div className="admin-dashboard__calendar-head">
              <div className="admin-dashboard__calendar-gutter" aria-hidden />
              {days.map((day) => {
                const today = isToday(day);
                const weekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "admin-dashboard__calendar-day",
                      today && "is-today",
                      weekend && "is-weekend",
                    )}
                  >
                    <p className="admin-dashboard__calendar-day-name">
                      {format(day, "EEE")}
                    </p>
                    <p className="admin-dashboard__calendar-day-number">
                      {format(day, "d")}
                    </p>
                  </div>
                );
              })}
            </div>

            {hasAllDay ? (
              <div className="admin-dashboard__calendar-row is-all-day">
                <div className="admin-dashboard__calendar-gutter">
                  <span>All day</span>
                </div>
                {days.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const today = isToday(day);
                  const weekend = day.getDay() === 0 || day.getDay() === 6;
                  const dayTasks = (byDay.get(key) ?? []).filter((task) =>
                    isCalendarAllDay(task),
                  );
                  return (
                    <div
                      key={`allday-${key}`}
                      className={cn(
                        "admin-dashboard__calendar-cell",
                        today && "is-today",
                        weekend && "is-weekend",
                      )}
                    >
                      {dayTasks.map((task) => (
                        <AdminWeekTaskBlock
                          key={task.id}
                          task={task}
                          href={`/app/tasks/${task.id}`}
                          compact
                          focused={focusedTaskIds?.has(task.id)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="admin-dashboard__calendar-body">
              {activeHours.map((hour) => (
                <div key={hour} className="admin-dashboard__calendar-row">
                  <div className="admin-dashboard__calendar-gutter">
                    <span>
                      {format(new Date(2000, 0, 1, hour, 0), "ha").toLowerCase()}
                    </span>
                  </div>
                  {days.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const today = isToday(day);
                    const weekend = day.getDay() === 0 || day.getDay() === 6;
                    const hourTasks = (byDay.get(key) ?? []).filter(
                      (task) => taskCalendarHour(task) === hour,
                    );
                    return (
                      <div
                        key={`${key}-${hour}`}
                        className={cn(
                          "admin-dashboard__calendar-cell",
                          today && "is-today",
                          weekend && "is-weekend",
                        )}
                      >
                        {hourTasks.map((task) => (
                          <AdminWeekTaskBlock
                            key={task.id}
                            task={task}
                            href={`/app/tasks/${task.id}`}
                            compact
                            focused={focusedTaskIds?.has(task.id)}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {unscheduled.length > 0 ? (
        <div
          id="admin-calendar-unscheduled"
          className="admin-dashboard__calendar-unscheduled"
        >
          <div>
            <h3 className="font-heading text-sm font-semibold">
              No due date ({unscheduled.length})
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tasks matching your filters without a calendar date this week.
            </p>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unscheduled.map((task) => (
              <li key={task.id}>
                <AdminWeekTaskBlock
                  task={task}
                  href={`/app/tasks/${task.id}`}
                  compact
                  focused={focusedTaskIds?.has(task.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tasksInWeek.length === 0 && unscheduled.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No tasks due this week match your filters.
        </p>
      ) : null}
    </div>
  );
}
