import { AdminConsole } from "@/components/admin/admin-console";
import { getAdminOversightData, getAdminSuiteData } from "@/lib/admin/queries";
import { requireRoles } from "@/lib/auth/guards";
import { requireActiveProfile } from "@/lib/auth/session";
import { getDashboardDiscussionSummary } from "@/lib/tasks/discussion-queries";

export default async function AdminPage() {
  const profile = await requireRoles(["admin"]);
  const [oversight, suite, discussionSummary] = await Promise.all([
    getAdminOversightData(),
    getAdminSuiteData(),
    getDashboardDiscussionSummary(profile.userId),
  ]);

  return (
    <AdminConsole
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
    />
  );
}
