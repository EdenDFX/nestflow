import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import {
  NotesCreateDialog,
  PersonalNotesPanel,
} from "@/components/notes/personal-notes-panel";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import { WorkViewSwitcher } from "@/components/tasks/work-view-switcher";
import { listAssignablePeopleForProfile } from "@/lib/admin/queries";
import { canAccessWorkViews } from "@/lib/auth/navigation";
import { requireActiveProfile } from "@/lib/auth/session";
import { listPersonalNotes } from "@/lib/notes/queries";
import { rolesAllow } from "@/lib/security/authz";
import { listTasks, listWorkspaces } from "@/lib/tasks/queries";
import { isWorkView, type WorkView } from "@/lib/tasks/work-views";

const TaskBoard = dynamic(
  () => import("@/components/tasks/task-board").then((mod) => mod.TaskBoard),
  {
    loading: () => (
      <div
        className="h-[28rem] rounded-xl bg-muted/40"
        aria-hidden
      />
    ),
  },
);
const TaskList = dynamic(
  () => import("@/components/tasks/task-list").then((mod) => mod.TaskList),
  {
    loading: () => (
      <div
        className="h-[28rem] rounded-xl border border-border bg-muted/20"
        aria-hidden
      />
    ),
  },
);
const TaskCalendar = dynamic(
  () =>
    import("@/components/tasks/task-calendar").then((mod) => mod.TaskCalendar),
  {
    loading: () => (
      <div
        className="h-[28rem] rounded-xl bg-muted/40"
        aria-hidden
      />
    ),
  },
);

const VIEW_COPY: Record<WorkView, { title: string; body: string }> = {
  board: {
    title: "Board",
    body: "Workflow canvas of status hubs. Drag tasks between nodes, or use Move to for keyboard-friendly updates.",
  },
  list: {
    title: "List",
    body: "Dense table with sorting, filtering, and bulk assign / due / status.",
  },
  calendar: {
    title: "Calendar",
    body: "Due dates and your personal notes. Click a note to open it, or drag a task onto another day to reschedule.",
  },
};

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const profile = await requireActiveProfile();
  if (!canAccessWorkViews(profile.roles)) {
    redirect("/app");
  }

  const params = await searchParams;
  const view: WorkView = isWorkView(params.view) ? params.view : "board";
  const copy = VIEW_COPY[view];

  const canAssign = rolesAllow(profile.roles, "assign_tasks");
  const canCreateTasks = rolesAllow(profile.roles, "create_tasks");

  const [tasks, workspaces, people, notes] = await Promise.all([
    listTasks(),
    listWorkspaces({
      includeHr: profile.roles.includes("admin") || profile.roles.includes("hr"),
    }),
    listAssignablePeopleForProfile(profile),
    listPersonalNotes(profile.userId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {copy.title}
          </h1>
          <p className="text-muted-foreground">{copy.body}</p>
        </div>
        {canCreateTasks ? (
          <TaskCreateDialog
            workspaces={workspaces}
            people={people}
            canAssign={canAssign}
            defaultAssigneeId={profile.userId}
          />
        ) : (
          <NotesCreateDialog />
        )}
      </div>
      <WorkViewSwitcher active={view} />
      {view === "board" ? (
        <TaskBoard initialTasks={tasks} roles={profile.roles} />
      ) : null}
      {view === "list" ? (
        <TaskList tasks={tasks} canAssign={canAssign} people={people} />
      ) : null}
      {view === "calendar" ? (
        <TaskCalendar tasks={tasks} notes={notes} />
      ) : null}
      {!canCreateTasks ? <PersonalNotesPanel notes={notes} /> : null}
    </div>
  );
}
