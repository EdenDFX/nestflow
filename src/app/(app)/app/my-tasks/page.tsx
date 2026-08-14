import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { MyTasksPlan } from "@/components/tasks/my-tasks-plan";
import { listAssignablePeopleForProfile } from "@/lib/admin/queries";
import { requireActiveProfile } from "@/lib/auth/session";
import { listChecklistsForTasks } from "@/lib/tasks/collaboration-queries";
import {
  getTaskCounters,
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
    listTasks({
      assigneeId: profile.userId,
      includeCreatedBy: profile.userId,
    }),
    getTaskCounters({ userId: profile.userId }),
    listWorkspaces({
      includeHr: profile.roles.includes("admin") || profile.roles.includes("hr"),
    }),
    listAssignablePeopleForProfile(profile),
  ]);
  const checklists = await listChecklistsForTasks(tasks.map((task) => task.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            My Tasks
          </h1>
          <p className="text-muted-foreground">
            {counters.open} open · {counters.overdue} overdue ·{" "}
            {counters.completed} completed. Grouped like a daily plan: overdue,
            today, upcoming, later.
          </p>
        </div>
        <TaskCreateDialog
          workspaces={workspaces}
          people={people}
          canAssign={canAssign}
          defaultAssigneeId={profile.userId}
        />
      </div>
      <MyTasksPlan tasks={tasks} checklists={checklists} people={people} />
    </div>
  );
}
