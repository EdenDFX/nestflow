import {
  MarkAllReadButton,
} from "@/components/notifications/notification-list";
import { NotificationInbox } from "@/components/notifications/notification-inbox";
import { listAssignablePeopleForProfile } from "@/lib/admin/queries";
import { requireActiveProfile } from "@/lib/auth/session";
import { isInboxFilter } from "@/lib/notifications/inbox";
import { listNotifications } from "@/lib/notifications/queries";
import { listTaskInboxSummaries } from "@/lib/tasks/queries";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const profile = await requireActiveProfile();
  const params = await searchParams;
  const filter = isInboxFilter(params.filter) ? params.filter : "all";
  const [{ items, unreadCount }, people] = await Promise.all([
    listNotifications(80),
    listAssignablePeopleForProfile(profile),
  ]);
  const taskSummaries = await listTaskInboxSummaries(
    items
      .map((item) => item.taskId)
      .filter((id): id is string => Boolean(id)),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Inbox
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread. Comment or complete without leaving.`
              : "You are caught up."}
          </p>
        </div>
        <MarkAllReadButton disabled={unreadCount === 0} />
      </div>
      <NotificationInbox
        items={items}
        filter={filter}
        taskSummaries={taskSummaries}
        people={people}
      />
    </div>
  );
}
