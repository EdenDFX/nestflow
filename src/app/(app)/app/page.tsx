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
import { rolesAllow } from "@/lib/security/authz";
import { listPersonalNotes } from "@/lib/notes/queries";
import { getDashboardDiscussionSummary } from "@/lib/tasks/discussion-queries";

export default async function DashboardPage() {
  const profile = await requireActiveProfile();
  const role = primaryRole(profile.roles);
  const canAssign = rolesAllow(profile.roles, "assign_tasks");
  const canCreateTasks = rolesAllow(profile.roles, "create_tasks");

  if (role === "admin") {
    redirect("/app/admin");
  }

  if (role === "hr") {
    const [hrData, roster, workspaces, people, discussionSummary] =
      await Promise.all([
      getHrSuiteData(),
      listTeamsWithRoster(),
      listWorkspaces({ includeHr: true }),
      listAssignablePeopleForProfile(profile),
      getDashboardDiscussionSummary(profile.userId),
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
        discussionThreads={discussionSummary.discussionThreads}
        unreadMentionCount={discussionSummary.unreadMentionCount}
      />
    );
  }

  if (role === "line_manager") {
    const [
      { tasks, blocked, workload, managedTeams },
      workspaces,
      people,
      discussionSummary,
    ] = await Promise.all([
      getTeamSuiteData(profile),
      listWorkspaces({
        includeHr: false,
      }),
      listAssignablePeopleForProfile(profile),
      getDashboardDiscussionSummary(profile.userId),
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
        discussionThreads={discussionSummary.discussionThreads}
        unreadMentionCount={discussionSummary.unreadMentionCount}
      />
    );
  }

  const [tasks, counters, workspaces, people, notes, discussionSummary] =
    await Promise.all([
    // RLS: staff only sees tasks they created or are assigned to.
    listTasks(),
    getTaskCounters({ userId: profile.userId }),
    listWorkspaces(),
    listAssignablePeopleForProfile(profile),
    canCreateTasks
      ? Promise.resolve([])
      : listPersonalNotes(profile.userId),
    getDashboardDiscussionSummary(profile.userId),
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
      canCreateTasks={canCreateTasks}
      notes={notes}
      discussionThreads={discussionSummary.discussionThreads}
      unreadMentionCount={discussionSummary.unreadMentionCount}
    />
  );
}
