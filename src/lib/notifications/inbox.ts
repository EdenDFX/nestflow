import type { NestFlowNotification } from "@/lib/notifications/types";
import type { TaskStatus } from "@/lib/tasks/types";

export type TaskInboxSummary = {
  id: string;
  title: string;
  status: TaskStatus;
};

export const INBOX_FILTERS = [
  "all",
  "unread",
  "mentions",
  "assignments",
] as const;

export type InboxFilter = (typeof INBOX_FILTERS)[number];

export const INBOX_FILTER_LABELS: Record<InboxFilter, string> = {
  all: "All",
  unread: "Unread",
  mentions: "Mentions",
  assignments: "Assignments",
};

export function isInboxFilter(value: string | null | undefined): value is InboxFilter {
  return (
    value === "all" ||
    value === "unread" ||
    value === "mentions" ||
    value === "assignments"
  );
}

export function matchesInboxFilter(
  item: NestFlowNotification,
  filter: InboxFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "unread":
      return item.readAt === null;
    case "mentions":
      return item.eventType === "task_mentioned";
    case "assignments":
      return item.eventType === "task_assigned";
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}
