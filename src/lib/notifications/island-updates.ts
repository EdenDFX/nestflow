import {
  eventLabel,
  type NestFlowNotification,
} from "@/lib/notifications/types";

export type IslandUpdate = {
  id: string;
  kindLabel: string;
  title: string;
  href: string;
  unread: boolean;
};

export function islandUpdates(
  items: NestFlowNotification[],
  limit = 4,
): IslandUpdate[] {
  const unread = items.filter((item) => item.readAt === null);
  const source = (unread.length > 0 ? unread : items).slice(0, limit);

  return source.map((item) => ({
    id: item.id,
    kindLabel: eventLabel(item.eventType),
    title: item.title.trim() || eventLabel(item.eventType),
    href:
      item.href ??
      (item.taskId ? `/app/tasks/${item.taskId}` : "/app/notifications"),
    unread: item.readAt === null,
  }));
}
