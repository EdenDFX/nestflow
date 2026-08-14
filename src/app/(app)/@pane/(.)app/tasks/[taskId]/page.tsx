import { TaskDetail } from "@/components/tasks/task-detail";
import { TaskPane } from "@/components/tasks/task-pane";
import { listAssignablePeopleForProfile } from "@/lib/admin/queries";
import { requireActiveProfile } from "@/lib/auth/session";
import { isR2Configured } from "@/lib/storage/r2";
import { getTaskCollaboration } from "@/lib/tasks/collaboration-queries";
import { getTaskM8Extras } from "@/lib/tasks/m8-queries";
import { getTaskById } from "@/lib/tasks/queries";

export default async function InterceptedTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const profile = await requireActiveProfile();
  const { taskId } = await params;
  const task = await getTaskById(taskId);

  if (!task) {
    return null;
  }

  const [collaboration, m8, people] = await Promise.all([
    getTaskCollaboration(taskId),
    getTaskM8Extras(taskId),
    listAssignablePeopleForProfile(profile),
  ]);

  const canAssign =
    profile.roles.includes("admin") ||
    profile.roles.includes("hr") ||
    profile.roles.includes("line_manager");

  return (
    <TaskPane taskId={task.id} title={task.title}>
      <TaskDetail
        task={task}
        canAssign={canAssign}
        canDecideApproval={canAssign}
        collaboration={collaboration}
        m8={m8}
        r2Configured={isR2Configured()}
        assignablePeople={people}
        variant="pane"
      />
    </TaskPane>
  );
}
