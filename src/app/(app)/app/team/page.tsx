import { TeamSuite } from "@/components/admin/team-suite";
import { requireRoles } from "@/lib/auth/guards";
import {
  getTeamSuiteData,
  listAssignablePeopleForProfile,
} from "@/lib/admin/queries";
import { listWorkspaces } from "@/lib/tasks/queries";

export default async function TeamPage() {
  const profile = await requireRoles(["admin", "line_manager"]);
  const canAssign =
    profile.roles.includes("admin") ||
    profile.roles.includes("line_manager") ||
    profile.roles.includes("hr");

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
      defaultAssigneeId={profile.userId}
      managedTeams={managedTeams}
      isOrgWide={isOrgWide}
    />
  );
}
