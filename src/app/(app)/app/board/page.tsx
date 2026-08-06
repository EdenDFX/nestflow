import { TaskBoard } from "@/components/tasks/task-board";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { requireActiveProfile } from "@/lib/auth/session";
import {
  listAssignablePeople,
  listTasks,
  listWorkspaces,
} from "@/lib/tasks/queries";

export default async function BoardPage() {
  const profile = await requireActiveProfile();
  const canAssign =
    profile.roles.includes("admin") ||
    profile.roles.includes("hr") ||
    profile.roles.includes("line_manager");

  const [tasks, workspaces, people] = await Promise.all([
    listTasks(),
    listWorkspaces(),
    listAssignablePeople(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Board
          </h1>
          <p className="text-muted-foreground">
            Drag cards between columns, or use Move to for keyboard-friendly
            updates.
          </p>
        </div>
        <TaskCreateDialog
          workspaces={workspaces}
          people={people}
          canAssign={canAssign}
          defaultAssigneeId={profile.userId}
        />
      </div>
      <TaskBoard initialTasks={tasks} />
    </div>
  );
}
