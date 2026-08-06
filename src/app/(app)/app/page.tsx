import { redirect } from "next/navigation";

import {
  getTaskCounters,
  listTasks,
  listWorkspaces,
} from "@/lib/tasks/queries";
import {
  getHrSuiteData,
  getTeamSuiteData,
  listAssignablePeopleForProfile,
  listTeamsWithRoster,
} from "@/lib/admin/queries";
import { HrDashboard } from "@/components/workspace/hr-dashboard";
import { LineManagerDashboard } from "@/components/workspace/line-manager-dashboard";
import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";
import { requireActiveProfile } from "@/lib/auth/session";
import { primaryRole } from "@/lib/auth/types";

export default async function DashboardPage() {
  const profile = await requireActiveProfile();
  const role = primaryRole(profile.roles);
  const canAssign =
    profile.roles.includes("admin") ||
    profile.roles.includes("hr") ||
    profile.roles.includes("line_manager");

  if (role === "admin") {
    redirect("/app/admin");
  }

  if (role === "hr") {
    const [hrData, roster, workspaces, people] = await Promise.all([
      getHrSuiteData(),
      listTeamsWithRoster(),
      listWorkspaces({ includeHr: true }),
      listAssignablePeopleForProfile(profile),
    ]);

    return (
      <HrDashboard
        profile={profile}
        hrTasks={hrData.hrTasks}
        employees={hrData.employees}
        invites={hrData.invites}
        teams={roster.teams}
        memberships={roster.memberships}
        workspaces={workspaces}
        people={people}
        canAssign={canAssign}
      />
    );
  }

  if (role === "line_manager") {
    const [{ tasks, blocked, workload, managedTeams }, workspaces, people] =
      await Promise.all([
        getTeamSuiteData(profile),
        listWorkspaces({
          includeHr: false,
        }),
        listAssignablePeopleForProfile(profile),
      ]);

    return (
      <LineManagerDashboard
        profile={profile}
        managedTeams={managedTeams}
        workload={workload}
        blocked={blocked}
        teamTasks={tasks}
        workspaces={workspaces}
        people={people}
        canAssign={canAssign}
      />
    );
  }

  const [tasks, counters, workspaces, people] = await Promise.all([
    // RLS: staff only sees tasks they created or are assigned to.
    listTasks(),
    getTaskCounters({ userId: profile.userId }),
    listWorkspaces(),
    listAssignablePeopleForProfile(profile),
  ]);

  return (
    <WorkspaceDashboard
      profile={profile}
      role={role}
      tasks={tasks}
      counters={counters}
      workspaces={workspaces}
      people={people}
      canAssign={canAssign}
    />
  );
}
