import { STATUS_LABELS, type TaskStatus } from "@/lib/tasks/types";

export type DiscussionThread = {
  taskId: string;
  taskTitle: string;
  taskStatus: TaskStatus;
  latestCommentBody: string;
  latestCommentAt: string;
  latestAuthorName: string | null;
  latestAuthorNestId: string | null;
  isAssignee: boolean;
  involvement: "mentioned" | "commented" | "both";
};

export function involvementLabel(thread: DiscussionThread): string {
  switch (thread.involvement) {
    case "mentioned":
      return "You were mentioned";
    case "commented":
      return "You joined the thread";
    case "both":
      return "Mentioned and replied";
    default: {
      const _exhaustive: never = thread.involvement;
      return _exhaustive;
    }
  }
}

export function taskStatusLabel(status: TaskStatus): string {
  return STATUS_LABELS[status];
}
