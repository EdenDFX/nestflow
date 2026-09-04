import { describe, expect, it } from "vitest";

import {
  allowedStatusTargets,
  canRoleSetStatus,
  canRoleTransition,
} from "@/lib/tasks/status-policy";

describe("canRoleSetStatus", () => {
  it("lets admin with line_manager set any status", () => {
    expect(canRoleSetStatus(["admin", "line_manager"], "todo")).toBe(true);
    expect(canRoleSetStatus(["admin", "line_manager"], "in_progress")).toBe(true);
    expect(canRoleSetStatus(["admin", "line_manager"], "completed")).toBe(true);
  });

  it("blocks oversight-only admin from setting status", () => {
    expect(canRoleSetStatus(["admin"], "todo")).toBe(false);
    expect(canRoleSetStatus(["admin"], "completed")).toBe(false);
  });

  it("limits line managers to todo and completed", () => {
    expect(canRoleSetStatus(["line_manager"], "todo")).toBe(true);
    expect(canRoleSetStatus(["line_manager"], "completed")).toBe(true);
    expect(canRoleSetStatus(["line_manager"], "in_progress")).toBe(false);
    expect(canRoleSetStatus(["line_manager"], "blocked")).toBe(false);
    expect(canRoleSetStatus(["line_manager"], "review")).toBe(false);
  });

  it("limits staff and HR to progress statuses", () => {
    for (const role of ["staff", "hr"] as const) {
      expect(canRoleSetStatus([role], "in_progress")).toBe(true);
      expect(canRoleSetStatus([role], "blocked")).toBe(true);
      expect(canRoleSetStatus([role], "review")).toBe(true);
      expect(canRoleSetStatus([role], "todo")).toBe(false);
      expect(canRoleSetStatus([role], "completed")).toBe(false);
    }
  });
});

describe("canRoleTransition", () => {
  it("lets staff leave todo for in_progress", () => {
    expect(canRoleTransition(["staff"], "todo", "in_progress")).toBe(true);
  });

  it("blocks staff from completing", () => {
    expect(canRoleTransition(["staff"], "review", "completed")).toBe(false);
  });

  it("lets line managers complete from review", () => {
    expect(
      canRoleTransition(["line_manager"], "review", "completed"),
    ).toBe(true);
  });

  it("blocks line managers from in_progress", () => {
    expect(
      canRoleTransition(["line_manager"], "todo", "in_progress"),
    ).toBe(false);
  });
});

describe("allowedStatusTargets", () => {
  it("returns staff targets from todo", () => {
    expect(allowedStatusTargets(["staff"], "todo")).toEqual([
      "in_progress",
      "blocked",
    ]);
  });

  it("returns manager complete from review", () => {
    expect(allowedStatusTargets(["line_manager"], "review")).toEqual([
      "completed",
    ]);
  });
});
