"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { GripHorizontalIcon } from "@/components/icons/grip-horizontal";

import { BulkReassignBar } from "@/components/tasks/bulk-reassign-bar";
import { PriorityBadge, StatusBadge } from "@/components/tasks/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkloadRow } from "@/lib/admin/types";
import { changeTaskStatusAction } from "@/lib/tasks/actions";
import type { AppRole } from "@/lib/auth/types";
import { canRoleTransition } from "@/lib/tasks/status-policy";
import {
  STATUS_LABELS,
  TASK_STATUSES,
  type NestFlowTask,
  type TaskAssignee,
  type TaskStatus,
} from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

function personInitials(name: string | null | undefined, fallback?: string | null) {
  const source = (name ?? fallback ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function formatDue(dueAt: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(dueAt));
}

function isOverdue(task: NestFlowTask) {
  return Boolean(
    task.dueAt &&
      task.status !== "completed" &&
      new Date(task.dueAt).getTime() < Date.now(),
  );
}

function TeamBoardCard({
  task,
  dragging,
  onMove,
  selected,
  onToggleSelect,
  roles,
}: {
  task: NestFlowTask;
  dragging?: boolean;
  onMove: (taskId: string, status: TaskStatus) => void;
  selected?: boolean;
  onToggleSelect?: (taskId: string) => void;
  roles: AppRole[];
}) {
  const assignee = task.assignees[0];
  const moves = TASK_STATUSES.filter((status) =>
    canRoleTransition(roles, task.status, status),
  );
  const overdue = isOverdue(task);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-3 shadow-sm",
        dragging && "opacity-80 ring-2 ring-primary/40",
        overdue && "border-warning/50",
      )}
    >
      <div className="flex items-start gap-2">
        {onToggleSelect ? (
          <input
            type="checkbox"
            className="mt-1 size-3.5 accent-primary"
            checked={Boolean(selected)}
            aria-label={`Select ${task.title}`}
            onChange={() => onToggleSelect(task.id)}
            onPointerDown={(event) => event.stopPropagation()}
          />
        ) : null}
        <Link
          href={`/app/tasks/${task.id}`}
          className="min-w-0 flex-1 font-heading text-sm font-semibold leading-snug hover:text-primary"
          onPointerDown={(event) => event.stopPropagation()}
        >
          {task.title}
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <PriorityBadge priority={task.priority} />
          {moves.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7"
                  aria-label="Move task"
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <GripHorizontalIcon className="inline-flex" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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

      {task.status === "blocked" && task.blockedReason ? (
        <p className="mt-2 line-clamp-2 text-xs text-warning-foreground dark:text-warning">
          {task.blockedReason}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback className="text-[10px] font-semibold">
              {personInitials(
                assignee?.fullName,
                assignee?.nestId ?? assignee?.email,
              )}
            </AvatarFallback>
          </Avatar>
          <p className="truncate text-xs text-muted-foreground">
            {assignee?.fullName ?? assignee?.nestId ?? "Unassigned"}
          </p>
        </div>
        {task.dueAt ? (
          <p
            className={cn(
              "shrink-0 text-xs tabular-nums",
              overdue ? "font-medium text-destructive" : "text-muted-foreground",
            )}
          >
            {formatDue(task.dueAt)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SortableTeamCard({
  task,
  onMove,
  selected,
  onToggleSelect,
  roles,
}: {
  task: NestFlowTask;
  onMove: (taskId: string, status: TaskStatus) => void;
  selected?: boolean;
  onToggleSelect?: (taskId: string) => void;
  roles: AppRole[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { status: task.status } });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TeamBoardCard
        task={task}
        onMove={onMove}
        selected={selected}
        onToggleSelect={onToggleSelect}
        roles={roles}
      />
    </div>
  );
}

function TeamBoardColumn({
  status,
  tasks,
  onMove,
  selectedIds,
  onToggleSelect,
  roles,
}: {
  status: TaskStatus;
  tasks: NestFlowTask[];
  onMove: (taskId: string, status: TaskStatus) => void;
  selectedIds?: string[];
  onToggleSelect?: (taskId: string) => void;
  roles: AppRole[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex max-h-[min(70vh,720px)] w-[min(100%,300px)] shrink-0 flex-col rounded-2xl border border-border/80 bg-muted/25",
        isOver && "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
        <StatusBadge status={status} />
        <span className="tabular-nums text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
          {tasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
              Empty
            </p>
          ) : (
            tasks.map((task) => (
              <SortableTeamCard
                key={task.id}
                task={task}
                onMove={onMove}
                selected={selectedIds?.includes(task.id)}
                onToggleSelect={onToggleSelect}
                roles={roles}
              />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}

export function TeamTaskBoard({
  initialTasks,
  roster,
  people = [],
  canAssign = false,
  initialAssigneeId,
  roles,
}: {
  initialTasks: NestFlowTask[];
  roster: WorkloadRow[];
  people?: TaskAssignee[];
  canAssign?: boolean;
  initialAssigneeId?: string;
  roles: AppRole[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | "all">(
    initialAssigneeId ?? "all",
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [prevAssigneeId, setPrevAssigneeId] = useState(initialAssigneeId);

  if (initialAssigneeId && initialAssigneeId !== prevAssigneeId) {
    setPrevAssigneeId(initialAssigneeId);
    setAssigneeFilter(initialAssigneeId);
  }

  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const visibleTasks = useMemo(() => {
    if (assigneeFilter === "all") return tasks;
    return tasks.filter((task) =>
      task.assignees.some((person) => person.userId === assigneeFilter),
    );
  }, [tasks, assigneeFilter]);

  const columns = useMemo(() => {
    const map = Object.fromEntries(
      TASK_STATUSES.map((status) => [status, [] as NestFlowTask[]]),
    ) as Record<TaskStatus, NestFlowTask[]>;
    for (const task of visibleTasks) {
      map[task.status].push(task);
    }
    return map;
  }, [visibleTasks]);

  const statusCounts = useMemo(
    () =>
      TASK_STATUSES.map((status) => ({
        status,
        count: columns[status].length,
      })),
    [columns],
  );

  const activeTask = tasks.find((task) => task.id === activeId) ?? null;

  function moveTask(taskId: string, status: TaskStatus, blockedReason?: string) {
    const current = tasks.find((task) => task.id === taskId);
    if (!current || current.status === status) return;
    if (!canRoleTransition(roles, current.status, status)) {
      toast.error(
        `Cannot move from ${STATUS_LABELS[current.status]} to ${STATUS_LABELS[status]} with your role.`,
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

    const overStatus = (
      TASK_STATUSES.includes(overId as TaskStatus)
        ? overId
        : tasks.find((task) => task.id === overId)?.status
    ) as TaskStatus | undefined;

    if (!overStatus) return;
    moveTask(taskId, overStatus);
  }

  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
        No team tasks yet. Create a task and assign someone on this roster.
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", pending && "opacity-90")}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={assigneeFilter === "all" ? "default" : "outline"}
            onClick={() => setAssigneeFilter("all")}
          >
            Everyone
            <span className="ml-1.5 tabular-nums text-xs opacity-80">
              {tasks.length}
            </span>
          </Button>
          {roster.map((person) => {
            const count = tasks.filter((task) =>
              task.assignees.some((assignee) => assignee.userId === person.userId),
            ).length;
            return (
              <Button
                key={person.userId}
                type="button"
                size="sm"
                variant={
                  assigneeFilter === person.userId ? "default" : "outline"
                }
                onClick={() => setAssigneeFilter(person.userId)}
              >
                {person.fullName ?? person.nestId ?? "Unnamed"}
                <span className="ml-1.5 tabular-nums text-xs opacity-80">
                  {count}
                </span>
              </Button>
            );
          })}
        </div>
        <dl className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {statusCounts.map(({ status, count }) => (
            <div key={status}>
              <dt className="inline">{STATUS_LABELS[status]} </dt>
              <dd className="inline tabular-nums font-medium text-foreground">
                {count}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          role="region"
          aria-label="Team board by status"
        >
          {TASK_STATUSES.map((status) => (
            <TeamBoardColumn
              key={status}
              status={status}
              tasks={columns[status]}
              onMove={moveTask}
              roles={roles}
              selectedIds={canAssign ? selected : undefined}
              onToggleSelect={
                canAssign
                  ? (taskId) => {
                      setSelected((current) =>
                        current.includes(taskId)
                          ? current.filter((id) => id !== taskId)
                          : [...current, taskId],
                      );
                    }
                  : undefined
              }
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <TeamBoardCard
              task={activeTask}
              dragging
              onMove={moveTask}
              roles={roles}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      {canAssign ? (
        <BulkReassignBar
          selectedIds={selected}
          people={people}
          onClear={() => setSelected([])}
        />
      ) : null}
    </div>
  );
}
