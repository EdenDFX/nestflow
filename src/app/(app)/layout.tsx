import { AppShell } from "@/components/layout/app-shell";
import { navForRoles } from "@/lib/auth/navigation";
import { requireActiveProfile } from "@/lib/auth/session";
import { listNotifications } from "@/lib/notifications/queries";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireActiveProfile();
  const navItems = navForRoles(profile.roles);
  const { items, unreadCount } = await listNotifications(8);

  return (
    <AppShell
      profile={profile}
      navItems={navItems}
      notifications={items}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
