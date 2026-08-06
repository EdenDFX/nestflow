import {
  MarkAllReadButton,
  NotificationList,
} from "@/components/notifications/notification-list";
import { requireActiveProfile } from "@/lib/auth/session";
import { listNotifications } from "@/lib/notifications/queries";

export default async function NotificationsPage() {
  await requireActiveProfile();
  const { items, unreadCount } = await listNotifications(80);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You are caught up."}
          </p>
        </div>
        <MarkAllReadButton disabled={unreadCount === 0} />
      </div>
      <div className="rounded-xl border border-border/80 p-2">
        <NotificationList items={items} />
      </div>
    </div>
  );
}
