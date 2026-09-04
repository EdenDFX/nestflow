import { TaskDetailSkeleton } from "@/components/tasks/task-detail-skeleton";

/** Full-page task route only. Intercepted opens use @pane loading. */
export default function TaskDetailPageLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <TaskDetailSkeleton />
    </div>
  );
}
