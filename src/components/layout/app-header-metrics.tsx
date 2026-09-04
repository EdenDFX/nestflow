import { cache } from "react";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { WorkspaceIsland } from "@/components/workspace/workspace-island";
import type { NestFlowProfile } from "@/lib/auth/types";
import { listNotifications } from "@/lib/notifications/queries";
import { getTaskCounters } from "@/lib/tasks/queries";

const getShellNotifications = cache(async () => listNotifications(12));
const getShellCounters = cache(async (userId: string) =>
  getTaskCounters({ userId }),
);

export function HeaderIslandFallback() {
  return (
    <div
      className="flex h-10 min-w-0 flex-1 items-center overflow-hidden rounded-full border border-border/80 bg-card px-1.5 py-1 sm:px-2"
      aria-hidden
    >
      <div className="h-8 w-full rounded-full bg-muted/60" />
    </div>
  );
}

export function HeaderBellFallback() {
  return <div className="size-8 shrink-0 rounded-full bg-muted/60" aria-hidden />;
}

export async function HeaderIsland({
  profile,
}: {
  profile: NestFlowProfile;
}) {
  const [{ items, unreadCount }, counters] = await Promise.all([
    getShellNotifications(),
    getShellCounters(profile.userId),
  ]);

  return (
    <WorkspaceIsland
      profile={profile}
      overdueCount={counters.overdue}
      blockedCount={counters.blocked}
      notifications={items}
      unreadCount={unreadCount}
    />
  );
}

export async function HeaderBell() {
  const { items, unreadCount } = await getShellNotifications();
  return <NotificationBell items={items} unreadCount={unreadCount} />;
}
