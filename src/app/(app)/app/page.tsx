import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";
import { requireActiveProfile } from "@/lib/auth/session";
import { primaryRole } from "@/lib/auth/types";
import {
  getTaskCounters,
  listAssignablePeople,
  listTasks,
  listWorkspaces,
} from "@/lib/tasks/queries";

export default async function DashboardPage() {
  const profile = await requireActiveProfile();
  const role = primaryRole(profile.roles);
  const canAssign =
    profile.roles.includes("admin") ||
    profile.roles.includes("hr") ||
    profile.roles.includes("line_manager");

  const [tasks, counters, workspaces, people] = await Promise.all([
    listTasks(),
    getTaskCounters(),
    listWorkspaces(),
    listAssignablePeople(),
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
