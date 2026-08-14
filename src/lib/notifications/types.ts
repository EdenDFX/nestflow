export const NOTIFICATION_EVENT_TYPES = [
  "task_assigned",
  "task_mentioned",
  "task_due_soon",
  "task_overdue",
  "task_status_changed",
  "invite",
] as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

export type NestFlowNotification = {
  id: string;
  userId: string;
  actorId: string | null;
  actorName: string | null;
  eventType: NotificationEventType;
  title: string;
  body: string;
  taskId: string | null;
  href: string | null;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPreferences = {
  userId: string;
  emailAssignment: boolean;
  emailMention: boolean;
  emailDueSoon: boolean;
  emailOverdue: boolean;
  pushAssignment: boolean;
  pushMention: boolean;
  pushOverdue: boolean;
  chatAssignment: boolean;
  chatMention: boolean;
  chatDueSoon: boolean;
  chatOverdue: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<
  NotificationPreferences,
  "userId"
> = {
  emailAssignment: true,
  emailMention: true,
  emailDueSoon: true,
  emailOverdue: true,
  pushAssignment: true,
  pushMention: true,
  pushOverdue: true,
  chatAssignment: true,
  chatMention: true,
  chatDueSoon: true,
  chatOverdue: true,
};

export function isNotificationEventType(
  value: string,
): value is NotificationEventType {
  return (NOTIFICATION_EVENT_TYPES as readonly string[]).includes(value);
}

export function eventLabel(type: NotificationEventType): string {
  switch (type) {
    case "task_assigned":
      return "Assignment";
    case "task_mentioned":
      return "Mention";
    case "task_due_soon":
      return "Due soon";
    case "task_overdue":
      return "Overdue";
    case "task_status_changed":
      return "Status";
    case "invite":
      return "Invite";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
