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
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { PriorityBadge, StatusBadge } from "@/components/tasks/status-badge";
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

function TaskCard({
  task,
  dragging,
}: {
  task: NestFlowTask;
  dragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-3 shadow-sm",
        dragging && "opacity-80 ring-2 ring-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/app/tasks/${task.id}`}
          className="font-heading text-sm font-semibold hover:text-primary"
        >
          {task.title}
        </Link>
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground">
          {task.assignees[0]?.fullName ??
            task.assignees[0]?.nestId ??
            "Unassigned"}
        </p>
        {task.dueAt ? (
          <p className="text-xs text-muted-foreground">
            {new Date(task.dueAt).toLocaleDateString()}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SortableTaskCard({ task }: { task: NestFlowTask }) {
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
      <TaskCard task={task} />
    </div>
  );
}

function BoardColumn({
  status,
  tasks,
  onMove,
}: {
  status: TaskStatus;
  tasks: NestFlowTask[];
  onMove: (taskId: string, status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[420px] w-[280px] shrink-0 flex-col rounded-2xl border border-border/80 bg-muted/30 p-3",
        isOver && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
        </div>
      </div>

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2">
          {tasks.map((task) => (
            <div key={task.id} className="space-y-1">
              <SortableTaskCard task={task} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-full text-xs">
                    Move to…
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {TASK_STATUSES.filter((candidate) =>
                    canTransition(task.status, candidate),
                  ).map((candidate) => (
                    <DropdownMenuItem
                      key={candidate}
                      onSelect={() => onMove(task.id, candidate)}
                    >
                      {STATUS_LABELS[candidate]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

export function TaskBoard({ initialTasks }: { initialTasks: NestFlowTask[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
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
      toast.error(`Cannot move from ${STATUS_LABELS[current.status]} to ${STATUS_LABELS[status]}.`);
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
      }
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

  return (
    <div className={cn("space-y-3", pending && "opacity-90")}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div
          className="flex gap-3 overflow-x-auto pb-4"
          role="region"
          aria-label="Task board by status"
        >
          {TASK_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              tasks={columns[status]}
              onMove={moveTask}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
