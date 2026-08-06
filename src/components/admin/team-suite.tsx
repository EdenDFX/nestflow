"use client";

import Link from "next/link";
import { useState } from "react";

import { TaskBoard } from "@/components/tasks/task-board";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { PriorityBadge, StatusBadge } from "@/components/tasks/status-badge";
import { Button } from "@/components/ui/button";
import type { WorkloadRow } from "@/lib/admin/types";
import type {
  NestFlowTask,
  NestFlowWorkspace,
  TaskAssignee,
} from "@/lib/tasks/types";

type TeamTab = "board" | "workload" | "blocked";

export function TeamSuite({
  tasks,
  blocked,
  workload,
  workspaces,
  people,
  canAssign,
  defaultAssigneeId,
}: {
  tasks: NestFlowTask[];
  blocked: NestFlowTask[];
  workload: WorkloadRow[];
  workspaces: NestFlowWorkspace[];
  people: TaskAssignee[];
  canAssign: boolean;
  defaultAssigneeId?: string;
}) {
  const [tab, setTab] = useState<TeamTab>("board");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Team
          </h1>
          <p className="text-muted-foreground">
            Managed-team board, workload distribution, and blocked queue.
          </p>
        </div>
        <TaskCreateDialog
          workspaces={workspaces}
          people={people}
          canAssign={canAssign}
          defaultAssigneeId={defaultAssigneeId}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["board", "Team board"],
            ["workload", "Workload"],
            ["blocked", `Blocked (${blocked.length})`],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={tab === id ? "default" : "outline"}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "board" ? <TaskBoard initialTasks={tasks} /> : null}

      {tab === "workload" ? (
        <div className="overflow-x-auto rounded-xl border border-border/80">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Person</th>
                <th className="px-3 py-2 font-medium">Open</th>
                <th className="px-3 py-2 font-medium">Blocked</th>
                <th className="px-3 py-2 font-medium">Overdue</th>
                <th className="px-3 py-2 font-medium">Completed</th>
              </tr>
            </thead>
            <tbody>
              {workload.map((row) => (
                <tr key={row.userId} className="border-b border-border/60">
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{row.fullName ?? "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.nestId ?? row.email}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">{row.openCount}</td>
                  <td className="px-3 py-2.5">{row.blockedCount}</td>
                  <td className="px-3 py-2.5">{row.overdueCount}</td>
                  <td className="px-3 py-2.5">{row.completedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "blocked" ? (
        <div className="space-y-2">
          {blocked.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No blocked tasks in your managed teams.
            </p>
          ) : (
            blocked.map((task) => (
              <Link
                key={task.id}
                href={`/app/tasks/${task.id}`}
                className="block rounded-xl border border-border/80 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <p className="font-medium">{task.title}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {task.blockedReason || "No blocker reason recorded."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {task.assignees
                    .map(
                      (person) =>
                        person.fullName ?? person.nestId ?? person.email,
                    )
                    .join(", ") || "Unassigned"}
                </p>
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
