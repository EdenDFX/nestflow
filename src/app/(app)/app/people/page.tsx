import { PeopleSuite } from "@/components/admin/people-suite";
import { requireRoles } from "@/lib/auth/guards";
import {
  getHrSuiteData,
  listAssignablePeopleForProfile,
  listTeamsWithRoster,
} from "@/lib/admin/queries";
import {
  listAutomationRules,
  listTaskTemplates,
} from "@/lib/tasks/m8-queries";
import { listWorkspaces } from "@/lib/tasks/queries";

export default async function PeopleTasksPage() {
  const profile = await requireRoles(["admin", "hr"]);
  const canAssign =
    profile.roles.includes("admin") ||
    profile.roles.includes("hr") ||
    profile.roles.includes("line_manager");

  const [
    { hrTasks, employees, invites, openByUser },
    workspaces,
    people,
    roster,
    templates,
    automationRules,
  ] = await Promise.all([
    getHrSuiteData(),
    listWorkspaces({ includeHr: true }),
    listAssignablePeopleForProfile(profile),
    listTeamsWithRoster(),
    listTaskTemplates({ activeOnly: true }),
    listAutomationRules(),
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
      teams={roster.teams}
      memberships={roster.memberships}
      templates={templates}
      automationRules={automationRules}
      openByUser={openByUser}
    />
  );
}
