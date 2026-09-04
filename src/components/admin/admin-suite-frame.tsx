import type { ReactNode } from "react";

import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";
import type { NestFlowProfile } from "@/lib/auth/types";
import { homePathForRoles, navForRoles } from "@/lib/auth/navigation";
import { listNotifications } from "@/lib/notifications/queries";

/** Shared NestFlow admin chrome for Overview / Discussions / Reports. */
export async function AdminSuiteFrame({
  profile,
  children,
}: {
  profile: NestFlowProfile;
  children: ReactNode;
}) {
  const notifications = await listNotifications(12);
  const routeLinks = navForRoles(profile.roles);
  const homeHref = homePathForRoles(profile.roles);

  return (
    <div className="admin-dashboard">
      <AdminDashboardHeader
        profile={profile}
        homeHref={homeHref}
        routeLinks={routeLinks}
        notifications={notifications.items}
        notificationUnreadCount={notifications.unreadCount}
      />
      <div className="admin-dashboard__body">{children}</div>
    </div>
  );
}
