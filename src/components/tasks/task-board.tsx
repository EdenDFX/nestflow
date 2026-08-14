"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { BadgeAlertIcon } from "@/components/icons/badge-alert";
import { ChevronRightIcon } from "@/components/icons/chevron-right";
import { CircleCheckIcon } from "@/components/icons/circle-check";
import { CircleDashedIcon } from "@/components/icons/circle-dashed";
import { ClipboardCheckIcon } from "@/components/icons/clipboard-check";
import { FileCheckIcon } from "@/components/icons/file-check";
import { LayersIcon } from "@/components/icons/layers";
import { PlusIcon } from "@/components/icons/plus";
import { PriorityBadge } from "@/components/tasks/status-badge";
import { TaskDueTimer } from "@/components/tasks/task-due-timer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { changeTaskStatusAction } from "@/lib/tasks/actions";
import {
  STATUS_LABELS,
  TASK_STATUSES,
  canTransition,
  type NestFlowTask,
  type TaskStatus,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

const statusIcon: Record<TaskStatus, ReactNode> = {
  backlog: <LayersIcon className="inline-flex" size={14} aria-hidden />,
  todo: <ClipboardCheckIcon className="inline-flex" size={14} aria-hidden />,
  in_progress: <CircleDashedIcon className="inline-flex" size={14} aria-hidden />,
  blocked: <BadgeAlertIcon className="inline-flex" size={14} aria-hidden />,
  review: <FileCheckIcon className="inline-flex" size={14} aria-hidden />,
  completed: <CircleCheckIcon className="inline-flex" size={14} aria-hidden />,
};

function Port({
  side,
  active,
}: {
  side: "left" | "right" | "bottom";
  active?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute z-20 flex size-3.5 items-center justify-center rounded-full border bg-background",
        active ? "border-primary" : "border-border",
        side === "left" && "top-1/2 -left-[7px] -translate-y-1/2",
        side === "right" && "top-1/2 -right-[7px] -translate-y-1/2",
        side === "bottom" && "-bottom-[7px] left-1/2 -translate-x-1/2",
      )}
    >
      {side === "right" ? (
        <PlusIcon className="inline-flex text-muted-foreground" size={8} />
      ) : null}
    </span>
  );
}

function StatusHub({
  status,
  count,
  active,
  className,
}: {
  status: TaskStatus;
  count: number;
  active: boolean;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `hub-${status}` });
  const highlight = isOver || active;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative w-full rounded-xl border bg-card px-3 py-2.5 shadow-sm",
        highlight ? "border-primary" : "border-border/90",
        className,
      )}
    >
      <Port side="left" active={highlight} />
      <Port side="right" active={highlight} />
      <Port side="bottom" active={highlight} />
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/60",
            highlight && "border-primary/40 bg-primary/10 text-primary",
          )}
        >
          {statusIcon[status]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold leading-tight">
            {STATUS_LABELS[status]}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {count === 1 ? "1 task" : `${count} tasks`}
          </p>
        </div>
      </div>
    </div>
  );
}

function GraphTaskCard({
  task,
  expanded,
  onToggle,
  onMove,
  dragging,
}: {
  task: NestFlowTask;
  expanded: boolean;
  onToggle: () => void;
  onMove: (taskId: string, status: TaskStatus) => void;
  dragging?: boolean;
}) {
  const moves = TASK_STATUSES.filter((status) =>
    canTransition(task.status, status),
  );

  return (
    <div
      className={cn(
        "relative w-full rounded-xl border bg-card shadow-sm",
        dragging ? "border-primary opacity-90" : "border-border/90",
        expanded && "border-primary/60",
      )}
    >
      <Port side="left" />
      <div className="flex items-start gap-2 p-2.5">
        <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/50 text-muted-foreground">
          <ClipboardCheckIcon className="inline-flex" size={14} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/app/tasks/${task.id}`}
            className="line-clamp-2 font-heading text-sm font-semibold leading-snug hover:text-primary"
            onPointerDown={(event) => event.stopPropagation()}
          >
            {task.title}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <p className="truncate text-[11px] text-muted-foreground">
              {task.assignees[0]?.fullName ??
                task.assignees[0]?.nestId ??
                "Unassigned"}
            </p>
            <TaskDueTimer
              dueAt={task.dueAt}
              status={task.status}
              tone="surface"
            />
          </div>
        </div>
        <button
          type="button"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse task" : "Expand task"}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onToggle}
        >
          <ChevronRightIcon
            className={cn(
              "inline-flex transition-transform",
              expanded && "rotate-90",
            )}
          />
        </button>
      </div>

      {expanded ? (
        <div className="space-y-2.5 border-t border-border/60 px-2.5 py-2.5">
          <p className="line-clamp-3 text-xs text-muted-foreground">
            {task.description?.trim() || "No description."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />
            {moves.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    Move to…
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {moves.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onSelect={() => onMove(task.id, status)}
                    >
                      {STATUS_LABELS[status]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DraggableTaskNode({
  task,
  expanded,
  onToggle,
  onMove,
}: {
  task: NestFlowTask;
  expanded: boolean;
  onToggle: () => void;
  onMove: (taskId: string, status: TaskStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { status: task.status },
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        zIndex: isDragging ? 20 : undefined,
      }}
      className={cn("min-w-0 w-full", isDragging && "opacity-40")}
      {...listeners}
      {...attributes}
    >
      <GraphTaskCard
        task={task}
        expanded={expanded}
        onToggle={onToggle}
        onMove={onMove}
        dragging={isDragging}
      />
    </div>
  );
}

function StatusBranch({
  status,
  tasks,
  expandedId,
  onToggle,
  onMove,
}: {
  status: TaskStatus;
  tasks: NestFlowTask[];
  expandedId: string | null;
  onToggle: (taskId: string) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative min-w-0 w-full rounded-xl p-1",
        "grid grid-cols-1 gap-2.5 sm:grid-cols-2",
        "min-[1100px]:flex min-[1100px]:flex-col",
        isOver && "bg-primary/5",
      )}
    >
      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 px-3 py-5 text-center text-xs text-muted-foreground">
          Drop tasks here
        </p>
      ) : (
        tasks.map((task) => (
          <div key={task.id} className="relative">
            <div
              className="pointer-events-none absolute -top-2.5 left-4 h-2.5 w-px border-l border-dashed border-border"
              aria-hidden
            />
            <DraggableTaskNode
              task={task}
              expanded={expandedId === task.id}
              onToggle={() => onToggle(task.id)}
              onMove={onMove}
            />
          </div>
        ))
      )}
    </div>
  );
}

function WideConnectors() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-[2.65rem] hidden h-8 w-full text-border min-[1100px]:block"
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <marker
          id="nf-flow-arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" className="fill-border" />
        </marker>
      </defs>
      {TASK_STATUSES.slice(0, -1).map((status, index) => {
        const x1 = ((index + 0.5) / TASK_STATUSES.length) * 100 + 6;
        const x2 = ((index + 1.5) / TASK_STATUSES.length) * 100 - 6;
        const mid = (x1 + x2) / 2;
        return (
          <path
            key={status}
            d={`M ${x1} 16 C ${mid} 16, ${mid} 16, ${x2} 16`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            vectorEffect="non-scaling-stroke"
            markerEnd="url(#nf-flow-arrow)"
          />
        );
      })}
    </svg>
  );
}

export function TaskBoard({ initialTasks }: { initialTasks: NestFlowTask[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const columns = useMemo(() => {
    const map = Object.fromEntries(
      TASK_STATUSES.map((status) => [status, [] as NestFlowTask[]]),
    ) as Record<TaskStatus, NestFlowTask[]>;
    for (const task of tasks) {
      map[task.status].push(task);
    }
    return map;
  }, [tasks]);

  const activeTask = tasks.find((task) => task.id === activeId) ?? null;

  function moveTask(taskId: string, status: TaskStatus, blockedReason?: string) {
    const current = tasks.find((task) => task.id === taskId);
    if (!current || current.status === status) return;
    if (!canTransition(current.status, status)) {
      toast.error(
        `Cannot move from ${STATUS_LABELS[current.status]} to ${STATUS_LABELS[status]}.`,
      );
      return;
    }
    if (status === "blocked" && !blockedReason) {
      const reason = window.prompt("Why is this task blocked?");
      if (!reason?.trim()) {
        toast.error("Blocked tasks need a reason.");
        return;
      }
      blockedReason = reason.trim();
    }

    const previous = tasks;
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? { ...task, status, blockedReason: blockedReason ?? null }
          : task,
      ),
    );

    startTransition(async () => {
      const result = await changeTaskStatusAction({
        taskId,
        status,
        blockedReason: blockedReason ?? null,
      });
      if (!result.ok) {
        setTasks(previous);
        toast.error(result.error ?? "Could not update status.");
        return;
      }
      toast.success(`Moved to ${STATUS_LABELS[status]}`);
    });
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const taskId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    const raw = overId.startsWith("hub-") ? overId.slice(4) : overId;
    const overStatus = (
      TASK_STATUSES.includes(raw as TaskStatus)
        ? raw
        : tasks.find((task) => task.id === overId)?.status
    ) as TaskStatus | undefined;

    if (!overStatus) return;
    moveTask(taskId, overStatus);
  }

  function toggleExpanded(taskId: string) {
    setExpandedId((current) => (current === taskId ? null : taskId));
  }

  return (
    <div className={cn("w-full min-w-0", pending && "opacity-90")}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div
          className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-background"
          role="region"
          aria-label="Task flow board"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in oklab, var(--border) 55%, transparent) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        >
          <div className="relative min-[1100px]:overflow-x-auto">
            <div className="relative mx-auto grid w-full grid-cols-1 p-4 sm:p-5 min-[1100px]:min-w-[980px] min-[1100px]:max-w-[1280px] min-[1100px]:grid-cols-6 min-[1100px]:gap-4 min-[1100px]:p-6">
              <WideConnectors />
              {TASK_STATUSES.map((status, index) => (
                <div
                  key={status}
                  className="relative z-10 flex min-w-0 gap-3 min-[1100px]:flex-col min-[1100px]:gap-4"
                >
                  <div className="flex w-4 shrink-0 flex-col items-center pt-5 min-[1100px]:hidden">
                    <span className="size-2.5 rounded-full border border-primary/50 bg-background" />
                    {index < TASK_STATUSES.length - 1 ? (
                      <span
                        className="mt-1 w-px flex-1 bg-border"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <div
                    className={cn(
                      "min-w-0 flex-1 space-y-3 pb-5 min-[1100px]:flex min-[1100px]:w-full min-[1100px]:flex-col min-[1100px]:gap-4 min-[1100px]:space-y-0 min-[1100px]:pb-0",
                      index === TASK_STATUSES.length - 1 && "pb-1",
                    )}
                  >
                    <StatusHub
                      status={status}
                      count={columns[status].length}
                      active={activeTask?.status === status}
                      className="max-w-md min-[1100px]:max-w-none"
                    />
                    <StatusBranch
                      status={status}
                      tasks={columns[status]}
                      expandedId={expandedId}
                      onToggle={toggleExpanded}
                      onMove={moveTask}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-[min(100vw-2rem,260px)]">
              <GraphTaskCard
                task={activeTask}
                expanded={false}
                onToggle={() => undefined}
                onMove={moveTask}
                dragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
