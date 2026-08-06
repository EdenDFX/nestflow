import { describe, expect, it } from "vitest";

import { rolesAllow } from "@/lib/security/authz";
import {
  clearRateLimitBuckets,
  checkRateLimit,
} from "@/lib/security/rate-limit";
import { canTransition, TASK_STATUSES } from "@/lib/tasks/types";

describe("canTransition", () => {
  it("allows documented transitions and rejects illegal ones", () => {
    expect(canTransition("backlog", "todo")).toBe(true);
    expect(canTransition("todo", "completed")).toBe(false);
    expect(canTransition("blocked", "completed")).toBe(false);
    expect(canTransition("review", "completed")).toBe(true);
    expect(canTransition("completed", "in_progress")).toBe(true);
  });

  it("treats same-status as allowed", () => {
    for (const status of TASK_STATUSES) {
      expect(canTransition(status, status)).toBe(true);
    }
  });
});

describe("rolesAllow capability matrix", () => {
  it("denies staff from admin capabilities", () => {
    expect(rolesAllow(["staff"], "manage_users")).toBe(false);
    expect(rolesAllow(["staff"], "view_audit")).toBe(false);
    expect(rolesAllow(["staff"], "access_hr_workspaces")).toBe(false);
    expect(rolesAllow(["staff"], "assign_tasks")).toBe(false);
  });

  it("allows line managers team suite but not HR workspaces", () => {
    expect(rolesAllow(["line_manager"], "manage_team_suite")).toBe(true);
    expect(rolesAllow(["line_manager"], "assign_tasks")).toBe(true);
    expect(rolesAllow(["line_manager"], "access_hr_workspaces")).toBe(false);
    expect(rolesAllow(["line_manager"], "manage_users")).toBe(false);
  });

  it("allows HR invite and HR workspaces but not audit", () => {
    expect(rolesAllow(["hr"], "invite_users")).toBe(true);
    expect(rolesAllow(["hr"], "access_hr_workspaces")).toBe(true);
    expect(rolesAllow(["hr"], "view_audit")).toBe(false);
    expect(rolesAllow(["hr"], "manage_departments")).toBe(false);
  });

  it("allows admin everything in the matrix", () => {
    expect(rolesAllow(["admin"], "manage_users")).toBe(true);
    expect(rolesAllow(["admin"], "view_audit")).toBe(true);
    expect(rolesAllow(["admin"], "access_hr_workspaces")).toBe(true);
    expect(rolesAllow(["admin"], "manage_team_suite")).toBe(true);
  });
});

describe("checkRateLimit", () => {
  it("blocks after the limit within the window", () => {
    clearRateLimitBuckets();
    const key = "test:limit";
    expect(checkRateLimit({ key, limit: 2, windowMs: 60_000 }).ok).toBe(true);
    expect(checkRateLimit({ key, limit: 2, windowMs: 60_000 }).ok).toBe(true);
    expect(checkRateLimit({ key, limit: 2, windowMs: 60_000 }).ok).toBe(false);
  });
});
