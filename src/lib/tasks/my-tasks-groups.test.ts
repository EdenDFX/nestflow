import { describe, expect, it } from "vitest";

import { bucketForTask, groupMyTasks } from "@/lib/tasks/my-tasks-groups";
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

describe("bucketForTask", () => {
  const now = new Date(2026, 7, 14, 12, 0, 0);

  it("groups by local calendar date and completed status", () => {
    expect(bucketForTask({ status: "todo", dueAt: "2026-08-13" }, now)).toBe(
      "overdue",
    );
    expect(bucketForTask({ status: "todo", dueAt: "2026-08-14" }, now)).toBe(
      "today",
    );
    expect(bucketForTask({ status: "todo", dueAt: "2026-08-20" }, now)).toBe(
      "upcoming",
    );
    expect(bucketForTask({ status: "todo", dueAt: null }, now)).toBe("later");
    expect(
      bucketForTask({ status: "completed", dueAt: "2026-08-13" }, now),
    ).toBe("completed");
  });
});

describe("groupMyTasks", () => {
  it("places each task in one bucket", () => {
    const now = new Date(2026, 7, 14, 12, 0, 0);
    const grouped = groupMyTasks(
      [
        task({ id: "a", status: "todo", dueAt: "2026-08-13" }),
        task({ id: "b", status: "todo", dueAt: "2026-08-14" }),
        task({ id: "c", status: "in_progress", dueAt: null }),
        task({ id: "d", status: "completed", dueAt: "2026-08-14" }),
      ],
      now,
    );

    expect(grouped.overdue.map((item) => item.id)).toEqual(["a"]);
    expect(grouped.today.map((item) => item.id)).toEqual(["b"]);
    expect(grouped.later.map((item) => item.id)).toEqual(["c"]);
    expect(grouped.completed.map((item) => item.id)).toEqual(["d"]);
    expect(grouped.upcoming).toEqual([]);
  });
});
