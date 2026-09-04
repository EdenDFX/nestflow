import { describe, expect, it } from "vitest";

import {
  canRescheduleTaskOnCalendar,
  shiftDueAtToDay,
} from "@/lib/tasks/calendar-due";

describe("canRescheduleTaskOnCalendar", () => {
  it("blocks completed tasks", () => {
    expect(canRescheduleTaskOnCalendar("completed")).toBe(false);
  });

  it("allows open work", () => {
    expect(canRescheduleTaskOnCalendar("todo")).toBe(true);
    expect(canRescheduleTaskOnCalendar("in_progress")).toBe(true);
    expect(canRescheduleTaskOnCalendar("blocked")).toBe(true);
    expect(canRescheduleTaskOnCalendar("review")).toBe(true);
  });
});

describe("shiftDueAtToDay", () => {
  it("preserves time when shifting day", () => {
    expect(shiftDueAtToDay("2026-09-10T17:00:00.000Z", "2026-09-12")).toMatch(
      /2026-09-12T17:00:00/,
    );
  });
});
