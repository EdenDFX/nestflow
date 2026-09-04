import { TaskDetail } from "@/components/tasks/task-detail";
import { TaskPane } from "@/components/tasks/task-pane";
import {
  listAssignablePeopleForProfile,
  listMentionablePeopleForTask,
} from "@/lib/admin/queries";
import { requireActiveProfile } from "@/lib/auth/session";
import { isR2Configured } from "@/lib/storage/r2";
import { getTaskCollaboration } from "@/lib/tasks/collaboration-queries";
import { getTaskM8Extras } from "@/lib/tasks/m8-queries";
import { getTaskById } from "@/lib/tasks/queries";
import { canOperateOnTasks, resolveTaskInteractionMode } from "@/lib/tasks/interaction-mode";

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

  const [collaboration, m8, assignablePeople, mentionablePeople] = await Promise.all([
    getTaskCollaboration(taskId),
    getTaskM8Extras(taskId),
    listAssignablePeopleForProfile(profile),
    listMentionablePeopleForTask(taskId, profile),
  ]);

  const canAssign = canOperateOnTasks(profile.roles);

  const interactionMode = resolveTaskInteractionMode(profile, task);

  return (
    <TaskPane taskId={task.id} title={task.title}>
      <TaskDetail
        task={task}
        canAssign={canAssign}
        canDecideApproval={canAssign}
        collaboration={collaboration}
        m8={m8}
        r2Configured={isR2Configured()}
        assignablePeople={assignablePeople}
        mentionablePeople={mentionablePeople}
        variant="pane"
        interactionMode={interactionMode}
        roles={profile.roles}
      />
    </TaskPane>
  );
}
