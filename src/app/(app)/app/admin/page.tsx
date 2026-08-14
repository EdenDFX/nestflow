import { AdminConsole } from "@/components/admin/admin-console";
import { getAdminOversightData, getAdminSuiteData } from "@/lib/admin/queries";
import { requireRoles } from "@/lib/auth/guards";

export default async function AdminPage() {
  await requireRoles(["admin"]);
  const [oversight, suite] = await Promise.all([
    getAdminOversightData(),
    getAdminSuiteData(),
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
    />
  );
}
