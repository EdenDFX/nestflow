import { notFound } from "next/navigation";

import { TaskDetail } from "@/components/tasks/task-detail";
import { requireActiveProfile } from "@/lib/auth/session";
import { isR2Configured } from "@/lib/storage/r2";
import { getTaskCollaboration } from "@/lib/tasks/collaboration-queries";
import { getTaskM8Extras } from "@/lib/tasks/m8-queries";
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

  const [collaboration, m8] = await Promise.all([
    getTaskCollaboration(taskId),
    getTaskM8Extras(taskId),
  ]);

  const canAssign =
    profile.roles.includes("admin") ||
    profile.roles.includes("hr") ||
    profile.roles.includes("line_manager");

  const canDecideApproval = canAssign;

  return (
    <TaskDetail
      task={task}
      canAssign={canAssign}
      canDecideApproval={canDecideApproval}
      collaboration={collaboration}
      m8={m8}
      r2Configured={isR2Configured()}
    />
  );
}
