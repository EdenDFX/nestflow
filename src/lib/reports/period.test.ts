import { describe, expect, it } from "vitest";

import {
  digestPeriodsForToday,
  lagosWeekdayMon1,
  lagosYmd,
  resolveInteractivePeriodEnding,
  resolvePeriodBounds,
  shiftEndingDate,
} from "@/lib/reports/period";
import { aggregateStaffPeriod } from "@/lib/reports/queries";

describe("resolvePeriodBounds", () => {
  it("resolves previous Lagos day for daily digests", () => {
    // 2026-08-21 10:00 UTC = 11:00 Lagos
    const now = new Date("2026-08-21T10:00:00.000Z");
    const period = resolvePeriodBounds("daily", { now });
    expect(period.endingDate).toBe("2026-08-20");
    expect(period.periodKey).toBe("2026-08-20");
    expect(period.start.toISOString()).toBe("2026-08-19T23:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-08-20T23:00:00.000Z");
  });

  it("resolves previous Mon–Sun week", () => {
    // Friday 21 Aug 2026 Lagos → previous week ends Sun 16 Aug
    const now = new Date("2026-08-21T10:00:00.000Z");
    const period = resolvePeriodBounds("weekly", { now });
    expect(period.endingDate).toBe("2026-08-16");
    expect(period.start.toISOString()).toBe("2026-08-09T23:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-08-16T23:00:00.000Z");
  });

  it("resolves previous calendar month", () => {
    const now = new Date("2026-08-21T10:00:00.000Z");
    const period = resolvePeriodBounds("monthly", { now });
    expect(period.endingDate).toBe("2026-07-31");
    expect(period.periodKey).toBe("2026-07");
    expect(period.start.toISOString()).toBe("2026-06-30T23:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-07-31T23:00:00.000Z");
  });

  it("honours an explicit ending date", () => {
    const period = resolvePeriodBounds("daily", { endingDate: "2026-08-01" });
    expect(period.endingDate).toBe("2026-08-01");
    expect(period.periodKey).toBe("2026-08-01");
  });
});

describe("digestPeriodsForToday", () => {
  it("always includes daily", () => {
    const kinds = digestPeriodsForToday(new Date("2026-08-21T10:00:00.000Z"));
    expect(kinds).toContain("daily");
  });

  it("includes weekly on Lagos Monday", () => {
    // Monday 17 Aug 2026 08:00 Lagos = 07:00 UTC
    const kinds = digestPeriodsForToday(new Date("2026-08-17T07:00:00.000Z"));
    expect(lagosWeekdayMon1(new Date("2026-08-17T07:00:00.000Z"))).toBe(1);
    expect(kinds).toEqual(["daily", "weekly"]);
  });

  it("includes monthly on the 1st Lagos", () => {
    const kinds = digestPeriodsForToday(new Date("2026-08-01T07:00:00.000Z"));
    expect(lagosYmd(new Date("2026-08-01T07:00:00.000Z"))).toBe("2026-08-01");
    expect(kinds).toEqual(["daily", "monthly"]);
  });
});

describe("resolveInteractivePeriodEnding", () => {
  it("defaults to today for daily and weekly views", () => {
    const now = new Date("2026-09-03T15:00:00.000Z");
    expect(resolveInteractivePeriodEnding("daily", now)).toBe("2026-09-03");
    // Thursday → this week's Sunday (clamped to today on the reports page).
    expect(resolveInteractivePeriodEnding("weekly", now)).toBe("2026-09-06");
  });

  it("defaults to the last day of the current month", () => {
    const now = new Date("2026-09-03T15:00:00.000Z");
    expect(resolveInteractivePeriodEnding("monthly", now)).toBe("2026-09-30");
  });
});

describe("shiftEndingDate", () => {
  it("shifts daily and weekly", () => {
    expect(shiftEndingDate("daily", "2026-08-20", -1)).toBe("2026-08-19");
    expect(shiftEndingDate("weekly", "2026-08-16", 1)).toBe("2026-08-23");
  });
});

describe("aggregateStaffPeriod", () => {
  const period = resolvePeriodBounds("daily", { endingDate: "2026-08-20" });

  it("counts completed, missed, overdue, and blocked correctly", () => {
    const report = aggregateStaffPeriod({
      period,
      people: [
        {
          userId: "u1",
          fullName: "Ada",
          nestId: "N1",
          email: "ada@example.com",
          department: "Creative",
        },
      ],
      workspaces: [{ id: "w1", name: "General" }],
      assignees: [
        { task_id: "t1", user_id: "u1" },
        { task_id: "t2", user_id: "u1" },
        { task_id: "t3", user_id: "u1" },
        { task_id: "t4", user_id: "u1" },
      ],
      timeEntries: [
        {
          user_id: "u1",
          minutes: 45,
          logged_at: "2026-08-20T12:00:00.000Z",
        },
      ],
      tasks: [
        {
          id: "t1",
          workspace_id: "w1",
          title: "Done on time",
          status: "completed",
          due_at: "2026-08-20T15:00:00.000Z",
          blocked_reason: null,
          completed_at: "2026-08-20T14:00:00.000Z",
          archived_at: null,
          created_at: "2026-08-19T10:00:00.000Z",
          updated_at: "2026-08-20T14:00:00.000Z",
        },
        {
          id: "t2",
          workspace_id: "w1",
          title: "Missed due",
          status: "todo",
          due_at: "2026-08-20T10:00:00.000Z",
          blocked_reason: null,
          completed_at: null,
          archived_at: null,
          created_at: "2026-08-18T10:00:00.000Z",
          updated_at: "2026-08-20T11:00:00.000Z",
        },
        {
          id: "t3",
          workspace_id: "w1",
          title: "Still overdue older",
          status: "in_progress",
          due_at: "2026-08-18T10:00:00.000Z",
          blocked_reason: null,
          completed_at: null,
          archived_at: null,
          created_at: "2026-08-10T10:00:00.000Z",
          updated_at: "2026-08-19T10:00:00.000Z",
        },
        {
          id: "t4",
          workspace_id: "w1",
          title: "Blocked now",
          status: "blocked",
          due_at: null,
          blocked_reason: "Waiting on legal",
          completed_at: null,
          archived_at: null,
          created_at: "2026-08-20T08:00:00.000Z",
          updated_at: "2026-08-20T09:00:00.000Z",
        },
      ],
    });

    const ada = report.staff[0]!;
    expect(ada.completed).toBe(1);
    expect(ada.completedOnTime).toBe(1);
    expect(ada.missed).toBe(1);
    expect(ada.overdue).toBe(2); // t2 + t3 open past due at period end
    expect(ada.blocked).toBe(1);
    expect(ada.minutesLogged).toBe(45);
    expect(ada.onTimeRate).toBe(50);
    expect(report.summary.completed).toBe(1);
    expect(report.summary.missed).toBe(1);
  });

  it("treats late completion as missed", () => {
    const report = aggregateStaffPeriod({
      period,
      people: [
        {
          userId: "u1",
          fullName: "Ada",
          nestId: null,
          email: null,
          department: null,
        },
      ],
      workspaces: [{ id: "w1", name: "General" }],
      assignees: [{ task_id: "t1", user_id: "u1" }],
      timeEntries: [],
      tasks: [
        {
          id: "t1",
          workspace_id: "w1",
          title: "Late",
          status: "completed",
          due_at: "2026-08-20T10:00:00.000Z",
          blocked_reason: null,
          completed_at: "2026-08-20T18:00:00.000Z",
          archived_at: null,
          created_at: "2026-08-19T10:00:00.000Z",
          updated_at: "2026-08-20T18:00:00.000Z",
        },
      ],
    });

    expect(report.staff[0]!.completed).toBe(1);
    expect(report.staff[0]!.completedOnTime).toBe(0);
    expect(report.staff[0]!.missed).toBe(1);
    expect(report.staff[0]!.onTimeRate).toBe(0);
  });
});
