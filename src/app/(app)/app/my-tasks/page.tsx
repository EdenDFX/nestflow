import { redirect } from "next/navigation";

import { NotesCreateDialog, PersonalNotesPanel } from "@/components/notes/personal-notes-panel";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { MyTasksPlan } from "@/components/tasks/my-tasks-plan";
import { listAssignablePeopleForProfile, listMentionablePeopleForProfile } from "@/lib/admin/queries";
import { homePathForRoles } from "@/lib/auth/navigation";
import { requireActiveProfile } from "@/lib/auth/session";
import { primaryRole } from "@/lib/auth/types";
import { listPersonalNotes } from "@/lib/notes/queries";
import { rolesAllow } from "@/lib/security/authz";
import { listChecklistsForTasks } from "@/lib/tasks/collaboration-queries";
import {
  getTaskCounters,
  listTasks,
  listWorkspaces,
} from "@/lib/tasks/queries";

export default async function MyTasksPage() {
  const profile = await requireActiveProfile();
  if (primaryRole(profile.roles) === "admin") {
    redirect(homePathForRoles(profile.roles));
  }
  const canCreateTasks = rolesAllow(profile.roles, "create_tasks");
  const canAssign = rolesAllow(profile.roles, "assign_tasks");

  const tasksPromise = listTasks({
    assigneeId: profile.userId,
    includeCreatedBy: profile.userId,
  });
  const [tasks, counters, workspaces, assignablePeople, mentionablePeople, checklists, notes] =
    await Promise.all([
      tasksPromise,
      getTaskCounters({ userId: profile.userId }),
      listWorkspaces({
        includeHr:
          profile.roles.includes("admin") || profile.roles.includes("hr"),
      }),
      listAssignablePeopleForProfile(profile),
      listMentionablePeopleForProfile(profile),
      tasksPromise.then((loaded) =>
        listChecklistsForTasks(loaded.map((task) => task.id)),
      ),
      listPersonalNotes(profile.userId),
    ]);

  return (
    <div className="space-y-8">
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
        {canCreateTasks ? (
          <TaskCreateDialog
            workspaces={workspaces}
            people={assignablePeople}
            canAssign={canAssign}
            defaultAssigneeId={profile.userId}
          />
        ) : (
          <NotesCreateDialog />
        )}
      </div>
      <MyTasksPlan
        tasks={tasks}
        checklists={checklists}
        people={mentionablePeople}
        roles={profile.roles}
      />
      {!canCreateTasks ? <PersonalNotesPanel notes={notes} /> : null}
    </div>
  );
}
