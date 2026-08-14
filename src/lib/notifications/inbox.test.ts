import { describe, expect, it } from "vitest";

import {
  matchesInboxFilter,
  type InboxFilter,
} from "@/lib/notifications/inbox";
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
    title: "Assigned",
    body: "",
    taskId: "t1",
    href: "/app/tasks/t1",
    metadata: {},
    readAt: null,
    createdAt: "2026-08-14T12:00:00.000Z",
    ...overrides,
  };
}

describe("matchesInboxFilter", () => {
  const filters: InboxFilter[] = ["all", "unread", "mentions", "assignments"];

  it("keeps unread and event-type slices separate", () => {
    const unreadMention = item({
      eventType: "task_mentioned",
      readAt: null,
    });
    const readAssign = item({
      eventType: "task_assigned",
      readAt: "2026-08-14T13:00:00.000Z",
    });

    expect(matchesInboxFilter(unreadMention, "all")).toBe(true);
    expect(matchesInboxFilter(readAssign, "unread")).toBe(false);
    expect(matchesInboxFilter(unreadMention, "mentions")).toBe(true);
    expect(matchesInboxFilter(unreadMention, "assignments")).toBe(false);
    expect(matchesInboxFilter(readAssign, "assignments")).toBe(true);
  });

  it("covers every filter", () => {
    const sample = item({});
    for (const filter of filters) {
      expect(typeof matchesInboxFilter(sample, filter)).toBe("boolean");
    }
  });
});
