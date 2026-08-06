import { TaskCalendar } from "@/components/tasks/task-calendar";
import { requireActiveProfile } from "@/lib/auth/session";
import { listTasks } from "@/lib/tasks/queries";

export default async function CalendarPage() {
  await requireActiveProfile();
  const tasks = await listTasks();
  const dated = tasks.filter((task) => task.dueAt);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Calendar
        </h1>
        <p className="text-muted-foreground">
          {dated.length} tasks with due dates across your accessible workspaces.
        </p>
      </div>
      <TaskCalendar tasks={tasks} />
    </div>
  );
}
