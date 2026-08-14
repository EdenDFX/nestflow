import { describe, expect, it } from "vitest";

import { islandAttention } from "@/lib/tasks/island-attention";

describe("islandAttention", () => {
  it("prioritises overdue over blocked", () => {
    expect(islandAttention({ overdue: 2, blocked: 4 })).toEqual({
      label: "2 overdue",
      href: "/app/my-tasks",
      tone: "risk",
    });
  });

  it("surfaces blocked work when nothing is overdue", () => {
    expect(islandAttention({ overdue: 0, blocked: 1 })).toEqual({
      label: "1 blocked",
      href: "/app/my-tasks",
      tone: "watch",
    });
  });

  it("reads Clear when the plate is healthy", () => {
    expect(islandAttention({ overdue: 0, blocked: 0 })).toEqual({
      label: "Clear",
      href: "/app/my-tasks",
      tone: "healthy",
    });
  });
});
