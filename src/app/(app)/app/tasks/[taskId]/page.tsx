import { notFound } from "next/navigation";

import { TaskDetail } from "@/components/tasks/task-detail";
import { requireActiveProfile } from "@/lib/auth/session";
import { isR2Configured } from "@/lib/storage/r2";
import { getTaskCollaboration } from "@/lib/tasks/collaboration-queries";
import { getTaskById } from "@/lib/tasks/queries";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const profile = await requireActiveProfile();
  const { taskId } = await params;
  const task = await getTaskById(taskId);

  if (!task) {
    notFound();
  }

  const collaboration = await getTaskCollaboration(taskId);

  const canAssign =
    profile.roles.includes("admin") ||
    profile.roles.includes("hr") ||
    profile.roles.includes("line_manager");

  return (
    <TaskDetail
      task={task}
      canAssign={canAssign}
      collaboration={collaboration}
      r2Configured={isR2Configured()}
    />
  );
}
