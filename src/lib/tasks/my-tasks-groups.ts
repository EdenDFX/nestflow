import type { NestFlowTask } from "@/lib/tasks/types";

export const MY_TASK_BUCKETS = [
  "overdue",
  "today",
  "upcoming",
  "later",
  "completed",
] as const;

export type MyTaskBucket = (typeof MY_TASK_BUCKETS)[number];

export const MY_TASK_BUCKET_LABELS: Record<MyTaskBucket, string> = {
  overdue: "Overdue",
  today: "Today",
  upcoming: "Upcoming",
  later: "Later",
  completed: "Completed",
};

function localYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dueYmd(dueAt: string): string {
  return dueAt.slice(0, 10);
}

export function bucketForTask(
  task: Pick<NestFlowTask, "status" | "dueAt">,
  now = new Date(),
): MyTaskBucket {
  if (task.status === "completed") {
    return "completed";
  }
  if (!task.dueAt) {
    return "later";
  }

  const due = dueYmd(task.dueAt);
  const today = localYmd(now);
  if (due < today) return "overdue";
  if (due === today) return "today";
  return "upcoming";
}

export function groupMyTasks(
  tasks: NestFlowTask[],
  now = new Date(),
): Record<MyTaskBucket, NestFlowTask[]> {
  const groups: Record<MyTaskBucket, NestFlowTask[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    later: [],
    completed: [],
  };

  for (const task of tasks) {
    groups[bucketForTask(task, now)].push(task);
  }

  return groups;
}
