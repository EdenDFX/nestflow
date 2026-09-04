import { describe, expect, it } from "vitest";

import { resolveTaskInteractionMode } from "@/lib/tasks/interaction-mode";
import type { NestFlowTask } from "@/lib/tasks/types";

const baseTask: NestFlowTask = {
  id: "task-1",
  workspaceId: "ws-1",
  title: "Example",
  description: "",
  status: "in_progress",
  priority: "medium",
  dueAt: null,
  blockedReason: null,
  createdBy: "creator-1",
  completedAt: null,
  archivedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  assignees: [{ userId: "assignee-1", fullName: "Assignee", nestId: "ASG1", email: null, avatarUrl: null }],
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
};

describe("resolveTaskInteractionMode", () => {
  it("gives oversight-only admin discussion mode on any task", () => {
    expect(
      resolveTaskInteractionMode(
        { userId: "admin-1", roles: ["admin"] },
        baseTask,
      ),
    ).toBe("discussion");
  });

  it("gives admin with line_manager full edit", () => {
    expect(
      resolveTaskInteractionMode(
        { userId: "admin-1", roles: ["admin", "line_manager"] },
        baseTask,
      ),
    ).toBe("full_edit");
  });

  it("gives staff assignees progress mode", () => {
    expect(
      resolveTaskInteractionMode(
        { userId: "assignee-1", roles: ["staff"] },
        baseTask,
      ),
    ).toBe("progress");
  });

  it("gives mentioned staff discussion-only access", () => {
    expect(
      resolveTaskInteractionMode(
        { userId: "observer-1", roles: ["staff"] },
        baseTask,
      ),
    ).toBe("discussion");
  });
});
