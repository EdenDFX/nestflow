import { redirect } from "next/navigation";

import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { TaskList } from "@/components/tasks/task-list";
import { listAssignablePeopleForProfile } from "@/lib/admin/queries";
import { canAccessWorkViews } from "@/lib/auth/navigation";
import { requireActiveProfile } from "@/lib/auth/session";
import { listTasks, listWorkspaces } from "@/lib/tasks/queries";

export default async function ListPage() {
  const profile = await requireActiveProfile();
  if (!canAccessWorkViews(profile.roles)) {
    redirect("/app");
  }

  const canAssign =
    profile.roles.includes("admin") ||
    profile.roles.includes("hr") ||
    profile.roles.includes("line_manager");

  const [tasks, workspaces, people] = await Promise.all([
    listTasks(),
    listWorkspaces(),
    listAssignablePeopleForProfile(profile),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            List
          </h1>
          <p className="text-muted-foreground">
            Dense table view with sorting and filtering.
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
