import { redirect } from "next/navigation";

import { TaskCalendar } from "@/components/tasks/task-calendar";
import { requireActiveProfile } from "@/lib/auth/session";
import { canAccessWorkViews } from "@/lib/auth/navigation";
import { listPersonalNotes } from "@/lib/notes/queries";
import { listTasks } from "@/lib/tasks/queries";

export default async function CalendarPage() {
  const profile = await requireActiveProfile();
  if (canAccessWorkViews(profile.roles)) {
    redirect("/app/work?view=calendar");
  }

  const [tasks, notes] = await Promise.all([
    listTasks(),
    listPersonalNotes(profile.userId),
  ]);
  const dated = tasks.filter((task) => task.dueAt);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1 sm:space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Calendar
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {dated.length} task{dated.length === 1 ? "" : "s"} with due dates.
          Your notes appear on the day you pick. Click a note to open it.
        </p>
      </div>
      <TaskCalendar tasks={tasks} notes={notes} />
    </div>
  );
}
