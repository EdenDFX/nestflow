"use server";

import {
  listMentionablePeopleForProfile,
  listMentionablePeopleForTask,
} from "@/lib/admin/queries";
import { requireActiveProfile } from "@/lib/auth/session";
import type { TaskAssignee } from "@/lib/tasks/types";

export async function loadMentionablePeopleAction(
  taskId?: string,
): Promise<TaskAssignee[]> {
  const profile = await requireActiveProfile();

  if (taskId) {
    return listMentionablePeopleForTask(taskId, profile);
  }

  return listMentionablePeopleForProfile(profile);
}
