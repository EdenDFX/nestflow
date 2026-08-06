import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { TaskList } from "@/components/tasks/task-list";
import { requireActiveProfile } from "@/lib/auth/session";
import {
  getTaskCounters,
  listAssignablePeople,
  listTasks,
  listWorkspaces,
} from "@/lib/tasks/queries";

export default async function MyTasksPage() {
  const profile = await requireActiveProfile();
  const canAssign =
    profile.roles.includes("admin") ||
    profile.roles.includes("hr") ||
    profile.roles.includes("line_manager");

  const [tasks, counters, workspaces, people] = await Promise.all([
    listTasks({ assigneeId: profile.userId }),
    getTaskCounters(profile.userId),
    listWorkspaces(),
    listAssignablePeople(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            My Tasks
          </h1>
          <p className="text-muted-foreground">
            {counters.open} open · {counters.overdue} overdue ·{" "}
            {counters.completed} completed
          </p>
        </div>
        <TaskCreateDialog
          workspaces={workspaces}
          people={people}
          canAssign={canAssign}
          defaultAssigneeId={profile.userId}
        />
      </div>
      <TaskList tasks={tasks} />
    </div>
  );
}
