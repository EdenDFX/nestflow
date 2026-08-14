import { describe, expect, it } from "vitest";

import { islandUpdates } from "@/lib/notifications/island-updates";
import type { NestFlowNotification } from "@/lib/notifications/types";

function item(
  overrides: Partial<NestFlowNotification>,
): NestFlowNotification {
  return {
    id: "n1",
    userId: "u1",
    actorId: null,
    actorName: null,
    eventType: "task_assigned",
    title: "Assigned to you",
    body: "",
    taskId: "t1",
    href: "/app/tasks/t1",
    metadata: {},
    readAt: null,
    createdAt: "2026-08-14T12:00:00.000Z",
    ...overrides,
  };
}

describe("islandUpdates", () => {
  it("prefers unread items and keeps newest-first order", () => {
    const updates = islandUpdates([
      item({
        id: "unread-mention",
        eventType: "task_mentioned",
        title: "You were mentioned",
        readAt: null,
      }),
      item({
        id: "read-assign",
        title: "Old assignment",
        readAt: "2026-08-14T13:00:00.000Z",
      }),
    ]);

    expect(updates).toHaveLength(1);
    expect(updates[0]?.id).toBe("unread-mention");
    expect(updates[0]?.kindLabel).toBe("Mention");
    expect(updates[0]?.unread).toBe(true);
  });

  it("falls back to the latest read update when the inbox is caught up", () => {
    const updates = islandUpdates([
      item({
        id: "read",
        title: "Moved to Review",
        eventType: "task_status_changed",
        readAt: "2026-08-14T13:00:00.000Z",
        href: null,
        taskId: "t9",
      }),
    ]);

    expect(updates).toEqual([
      {
        id: "read",
        kindLabel: "Status",
        title: "Moved to Review",
        href: "/app/tasks/t9",
        unread: false,
      },
    ]);
  });

  it("returns nothing when there are no notifications", () => {
    expect(islandUpdates([])).toEqual([]);
  });
});
