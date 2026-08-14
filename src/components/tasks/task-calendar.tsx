"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
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
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { ChevronLeftIcon } from "@/components/icons/chevron-left";
import { ChevronRightIcon } from "@/components/icons/chevron-right";
import { Button } from "@/components/ui/button";
import { updateTaskAction } from "@/lib/tasks/actions";
import {
  calendarDayKey,
  dueAtDayKey,
  shiftDueAtToDay,
} from "@/lib/tasks/calendar-due";
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

const calendarCollision: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) {
    return pointerHits;
  }
  return rectIntersection(args);
};

function dayKeyFromDroppable(overId: string): string | null {
  if (overId.startsWith("day:")) {
    return overId.slice(4);
  }
  if (overId.startsWith("panel:")) {
    return overId.slice(6);
  }
  return null;
}

export function TaskCalendar({ tasks: initialTasks }: { tasks: NestFlowTask[] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [tasks, setTasks] = useState(initialTasks);
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, NestFlowTask[]>();
    for (const task of tasks) {
      if (!task.dueAt) continue;
      const key = dueAtDayKey(task.dueAt);
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  const selectedKey = calendarDayKey(selectedDay);
  const selectedTasks = tasksByDay.get(selectedKey) ?? [];
  const activeTask = tasks.find((task) => task.id === activeId) ?? null;

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

  function moveTaskToDay(taskId: string, dayYmd: string) {
    const current = tasks.find((task) => task.id === taskId);
    if (!current?.dueAt) {
      return;
    }
    if (dueAtDayKey(current.dueAt) === dayYmd) {
      return;
    }

    const nextDueAt = shiftDueAtToDay(current.dueAt, dayYmd);
    if (!nextDueAt) {
      toast.error("Could not move that due date.");
      return;
    }

    const previous = tasks;
    const nextDay = new Date(`${dayYmd}T12:00:00`);
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, dueAt: nextDueAt } : task,
      ),
    );
    setSelectedDay(nextDay);
    if (!isSameMonth(nextDay, month)) {
      setMonth(startOfMonth(nextDay));
    }

    startTransition(async () => {
      const result = await updateTaskAction({
        taskId,
        dueAt: nextDueAt,
      });
      if (!result.ok) {
        setTasks(previous);
        toast.error(result.error ?? "Could not update due date.");
        return;
      }
      toast.success(`Moved to ${format(nextDay, "d MMM")}`);
    });
  }

  function onDragStart(event: DragStartEvent) {
    const taskId = event.active.data.current?.taskId;
    setActiveId(typeof taskId === "string" ? taskId : null);
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const taskId = event.active.data.current?.taskId;
    const overId = event.over?.id ? String(event.over.id) : null;
    if (typeof taskId !== "string" || !overId) {
      return;
    }
    const dayYmd = dayKeyFromDroppable(overId);
    if (!dayYmd) {
      return;
    }
    moveTaskToDay(taskId, dayYmd);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={calendarCollision}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className={cn("space-y-4 sm:space-y-5", pending && "opacity-90")}>
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
              <ChevronLeftIcon className="inline-flex" />
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
              <ChevronRightIcon className="inline-flex" />
            </Button>
          </div>
        </div>

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
              "auto-rows-[3rem] sm:auto-rows-[6.5rem]",
            )}
          >
            {days.map((day) => (
              <CalendarDayCell
                key={calendarDayKey(day)}
                day={day}
                month={month}
                selectedDay={selectedDay}
                dayTasks={tasksByDay.get(calendarDayKey(day)) ?? []}
                onSelect={selectDay}
              />
            ))}
          </div>
        </div>

        <SelectedDayPanel
          selectedDay={selectedDay}
          selectedKey={selectedKey}
          selectedTasks={selectedTasks}
        />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? <CalendarChipPreview task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function SelectedDayPanel({
  selectedDay,
  selectedKey,
  selectedTasks,
}: {
  selectedDay: Date;
  selectedKey: string;
  selectedTasks: NestFlowTask[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `panel:${selectedKey}`,
    data: { dayKey: selectedKey },
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "rounded-2xl border border-border bg-card p-3 sm:p-4",
        isOver && "border-primary/40 bg-primary/5",
      )}
      aria-label={`Tasks for ${format(selectedDay, "EEEE d MMMM")}. Drop a task here to reschedule.`}
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
          Nothing due this day. Drop a task here to move it, or set a due date
          on the task.
        </p>
      ) : (
        <ul className="space-y-2">
          {selectedTasks.map((task) => (
            <li key={task.id}>
              <CalendarListTask task={task} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Drag a task onto another day to reschedule. The time of day stays the
        same.
      </p>
    </section>
  );
}

function CalendarDayCell({
  day,
  month,
  selectedDay,
  dayTasks,
  onSelect,
}: {
  day: Date;
  month: Date;
  selectedDay: Date;
  dayTasks: NestFlowTask[];
  onSelect: (day: Date) => void;
}) {
  const key = calendarDayKey(day);
  const { setNodeRef, isOver } = useDroppable({
    id: `day:${key}`,
    data: { dayKey: key },
  });
  const inMonth = isSameMonth(day, month);
  const today = isSameDay(day, new Date());
  const selected = isSameDay(day, selectedDay);
  const visibleDesktop = dayTasks.slice(0, 2);
  const overflow = dayTasks.length - visibleDesktop.length;

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(day)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(day);
        }
      }}
      aria-label={`${format(day, "EEEE d MMMM yyyy")}. Drop a task here to reschedule.`}
      aria-current={today ? "date" : undefined}
      aria-pressed={selected}
      className={cn(
        "relative flex h-full min-h-0 w-full min-w-0 flex-col rounded-none border-0 border-r border-b border-border p-1 text-left outline-none",
        "[&:nth-child(7n)]:border-r-0",
        "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        "active:bg-muted/50 sm:hover:bg-muted/30",
        !inMonth && "text-muted-foreground/40",
        inMonth && "text-foreground",
        isOver && "bg-primary/12 z-10 ring-2 ring-primary/40 ring-inset",
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
              className={cn("size-1 rounded-full", PRIORITY_DOT[task.priority])}
            />
          ))}
        </div>
      ) : null}

      <div className="hidden min-h-0 flex-1 space-y-0.5 overflow-hidden sm:block">
        {visibleDesktop.map((task) => (
          <CalendarTaskChip key={task.id} task={task} />
        ))}
        {overflow > 0 ? (
          <p className="px-0.5 text-[10px] text-muted-foreground">
            +{overflow} more
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CalendarTaskChip({ task }: { task: NestFlowTask }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `chip:${task.id}`,
    data: { taskId: task.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn("touch-none", isDragging && "opacity-30")}
      {...listeners}
      {...attributes}
    >
      <Link
        href={`/app/tasks/${task.id}`}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "block cursor-grab truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight text-white active:cursor-grabbing",
          PRIORITY_DOT[task.priority],
        )}
        title={`${task.title} · ${STATUS_LABELS[task.status]}. Drag to another day to reschedule.`}
      >
        {task.title}
      </Link>
    </div>
  );
}

function CalendarListTask({ task }: { task: NestFlowTask }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `list:${task.id}`,
    data: { taskId: task.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn("touch-none", isDragging && "opacity-40")}
      {...listeners}
      {...attributes}
    >
      <Link
        href={`/app/tasks/${task.id}`}
        className="flex cursor-grab items-start gap-3 rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-muted/40 active:cursor-grabbing"
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
                <span>{format(new Date(task.dueAt), "HH:mm")}</span>
              </>
            ) : null}
          </span>
        </span>
      </Link>
    </div>
  );
}

function CalendarChipPreview({ task }: { task: NestFlowTask }) {
  return (
    <div
      className={cn(
        "max-w-[14rem] truncate rounded px-2 py-1 text-xs font-medium text-white shadow-lg",
        PRIORITY_DOT[task.priority],
      )}
    >
      {task.title}
    </div>
  );
}
