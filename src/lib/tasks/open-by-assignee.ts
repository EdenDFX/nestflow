import type { NestFlowTask } from "@/lib/tasks/types";

export function groupOpenTasksByAssignee(
  tasks: NestFlowTask[],
): Record<string, NestFlowTask[]> {
  const map: Record<string, NestFlowTask[]> = {};
  for (const task of tasks) {
    if (task.archivedAt || task.status === "completed") continue;
    for (const person of task.assignees) {
      const list = map[person.userId] ?? [];
      list.push(task);
      map[person.userId] = list;
    }
  }
  return map;
}
