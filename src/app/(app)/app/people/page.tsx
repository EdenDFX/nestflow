import { PeopleSuite } from "@/components/admin/people-suite";
import { requireRoles } from "@/lib/auth/guards";
import { getHrSuiteData } from "@/lib/admin/queries";
import {
  listAssignablePeople,
  listWorkspaces,
} from "@/lib/tasks/queries";

export default async function PeopleTasksPage() {
  const profile = await requireRoles(["admin", "hr"]);
  const canAssign =
    profile.roles.includes("admin") ||
    profile.roles.includes("hr") ||
    profile.roles.includes("line_manager");

  const [{ hrTasks, employees, invites }, workspaces, people] =
    await Promise.all([
      getHrSuiteData(),
      listWorkspaces({ includeHr: true }),
      listAssignablePeople(),
    ]);

  return (
    <PeopleSuite
      hrTasks={hrTasks}
      employees={employees}
      invites={invites}
      workspaces={workspaces}
      people={people}
      canAssign={canAssign}
      canManageStatus={
        profile.roles.includes("admin") || profile.roles.includes("hr")
      }
    />
  );
}
