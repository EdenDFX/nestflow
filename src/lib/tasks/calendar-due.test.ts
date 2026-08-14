import { describe, expect, it } from "vitest";

import {
  calendarDayKey,
  dueAtDayKey,
  shiftDueAtToDay,
} from "@/lib/tasks/calendar-due";

describe("calendar-due", () => {
  it("keeps the local clock when the due day changes", () => {
    const due = new Date(2026, 7, 11, 14, 30, 0);
    const nextIso = shiftDueAtToDay(due.toISOString(), "2026-08-12");
    expect(nextIso).not.toBeNull();
    const moved = new Date(nextIso!);
    expect(moved.getFullYear()).toBe(2026);
    expect(moved.getMonth()).toBe(7);
    expect(moved.getDate()).toBe(12);
    expect(moved.getHours()).toBe(14);
    expect(moved.getMinutes()).toBe(30);
  });

  it("returns the same instant when the day is unchanged", () => {
    const due = new Date(2026, 7, 11, 9, 0, 0);
    expect(shiftDueAtToDay(due.toISOString(), "2026-08-11")).toBe(
      due.toISOString(),
    );
  });

  it("rejects an invalid day key", () => {
    expect(shiftDueAtToDay(new Date().toISOString(), "12 August")).toBeNull();
  });

  it("formats local calendar keys", () => {
    const day = new Date(2026, 7, 11, 23, 15, 0);
    expect(calendarDayKey(day)).toBe("2026-08-11");
    expect(dueAtDayKey(day.toISOString())).toBe("2026-08-11");
  });
});
