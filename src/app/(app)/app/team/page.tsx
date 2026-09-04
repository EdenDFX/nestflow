import { TeamSuite } from "@/components/admin/team-suite";
import { requireRoles } from "@/lib/auth/guards";
import {
  getTeamSuiteData,
  listAssignablePeopleForProfile,
} from "@/lib/admin/queries";
import { rolesAllow } from "@/lib/security/authz";
import { listWorkspaces } from "@/lib/tasks/queries";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ person?: string }>;
}) {
  const profile = await requireRoles(["admin", "line_manager"]);
  const params = await searchParams;
  const canAssign = rolesAllow(profile.roles, "assign_tasks");
  const canCreateTasks = rolesAllow(profile.roles, "create_tasks");

  const [{ tasks, blocked, workload, managedTeams, isOrgWide }, workspaces, people] =
    await Promise.all([
      getTeamSuiteData(profile),
      listWorkspaces({
        includeHr:
          profile.roles.includes("admin") || profile.roles.includes("hr"),
      }),
      listAssignablePeopleForProfile(profile),
    ]);

  return (
    <TeamSuite
      tasks={tasks}
      blocked={blocked}
      workload={workload}
      workspaces={workspaces}
      people={people}
      canAssign={canAssign}
      canCreateTasks={canCreateTasks}
      defaultAssigneeId={profile.userId}
      managedTeams={managedTeams}
      isOrgWide={isOrgWide}
      initialPersonId={params.person}
      roles={profile.roles}
    />
  );
}
