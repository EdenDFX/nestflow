import { AdminConsole } from "@/components/admin/admin-console";
import { getAdminOversightData, getAdminSuiteData } from "@/lib/admin/queries";
import { requireRoles } from "@/lib/auth/guards";
import { homePathForRoles, navForRoles } from "@/lib/auth/navigation";
import { listNotifications } from "@/lib/notifications/queries";
import { getDashboardDiscussionSummary } from "@/lib/tasks/discussion-queries";

export default async function AdminPage() {
  const profile = await requireRoles(["admin"]);
  const [oversight, suite, discussionSummary, notifications] = await Promise.all([
    getAdminOversightData(),
    getAdminSuiteData(),
    getDashboardDiscussionSummary(profile.userId),
    listNotifications(12),
  ]);

  const navItems = navForRoles(profile.roles);
  const homeHref = homePathForRoles(profile.roles);

  return (
    <AdminConsole
      profile={profile}
      homeHref={homeHref}
      routeLinks={navItems}
      tasks={oversight.tasks}
      log={oversight.log}
      report={oversight.report}
      oversightUsers={oversight.users}
      users={suite.users}
      departments={suite.departments}
      invites={suite.invites}
      auditEvents={suite.auditEvents}
      teams={suite.teams}
      memberships={suite.memberships}
      people={suite.people}
      openByUser={suite.openByUser}
      discussionThreads={discussionSummary.discussionThreads}
      unreadMentionCount={discussionSummary.unreadMentionCount}
      notifications={notifications.items}
      notificationUnreadCount={notifications.unreadCount}
    />
  );
}
