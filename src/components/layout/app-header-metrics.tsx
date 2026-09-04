import { cache } from "react";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { WorkspaceIsland } from "@/components/workspace/workspace-island";
import type { NestFlowProfile } from "@/lib/auth/types";
import { listNotifications } from "@/lib/notifications/queries";
import { getTaskCounters } from "@/lib/tasks/queries";

import {
  HeaderBellFallback,
  HeaderIslandFallback,
} from "./app-header-fallbacks";

export { HeaderBellFallback, HeaderIslandFallback };

const getShellNotifications = cache(async () => listNotifications(12));
const getShellCounters = cache(async (userId: string) =>
  getTaskCounters({ userId }),
);

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
