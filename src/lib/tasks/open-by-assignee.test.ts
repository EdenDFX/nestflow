import { describe, expect, it } from "vitest";

import { groupOpenTasksByAssignee } from "@/lib/tasks/open-by-assignee";
import type { NestFlowTask } from "@/lib/tasks/types";

function task(
  overrides: Partial<NestFlowTask> & Pick<NestFlowTask, "id" | "status">,
): NestFlowTask {
  return {
    workspaceId: "ws",
    title: overrides.title ?? overrides.id,
    description: "",
    priority: "medium",
    dueAt: null,
    blockedReason: null,
    createdBy: "u1",
    completedAt: null,
    archivedAt: null,
    createdAt: "2026-08-14T00:00:00.000Z",
    updatedAt: "2026-08-14T00:00:00.000Z",
    assignees: [],
    tags: [],
    recurrenceRule: null,
    recurrenceInterval: 1,
    recurrenceEndsAt: null,
    recurrenceParentId: null,
    approvalStatus: "none",
    approvalNote: null,
    approvalRequestedBy: null,
    approvalRequestedAt: null,
    approvalDecidedBy: null,
    approvalDecidedAt: null,
    gearRef: null,
    gearUrl: null,
    ...overrides,
  };
}

describe("groupOpenTasksByAssignee", () => {
  it("groups open tasks and skips completed or archived", () => {
    const alice = {
      userId: "alice",
      fullName: "Alice",
      nestId: "A1",
      email: "a@example.com",
      avatarUrl: null,
    };
    const bob = {
      userId: "bob",
      fullName: "Bob",
      nestId: "B1",
      email: "b@example.com",
      avatarUrl: null,
    };

    const grouped = groupOpenTasksByAssignee([
      task({ id: "open", status: "todo", assignees: [alice, bob] }),
      task({ id: "done", status: "completed", assignees: [alice] }),
      task({
        id: "archived",
        status: "todo",
        assignees: [bob],
        archivedAt: "2026-01-02T00:00:00.000Z",
      }),
    ]);

    expect(grouped.alice?.map((item) => item.id)).toEqual(["open"]);
    expect(grouped.bob?.map((item) => item.id)).toEqual(["open"]);
  });
});
