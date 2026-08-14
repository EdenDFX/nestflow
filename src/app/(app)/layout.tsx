import { AppShell } from "@/components/layout/app-shell";
import { navForRoles } from "@/lib/auth/navigation";
import { requireActiveProfile } from "@/lib/auth/session";
import { listNotifications } from "@/lib/notifications/queries";
import { getTaskCounters } from "@/lib/tasks/queries";

export default async function AuthenticatedLayout({
  children,
  pane,
}: Readonly<{
  children: React.ReactNode;
  pane: React.ReactNode;
}>) {
  const profile = await requireActiveProfile();
  const navItems = navForRoles(profile.roles);
  const [{ items, unreadCount }, counters] = await Promise.all([
    listNotifications(12),
    getTaskCounters({ userId: profile.userId }),
  ]);

  return (
    <>
      <AppShell
        profile={profile}
        navItems={navItems}
        notifications={items}
        unreadCount={unreadCount}
        overdueCount={counters.overdue}
        blockedCount={counters.blocked}
      >
        {children}
      </AppShell>
      {pane}
    </>
  );
}
