import { describe, expect, it } from "vitest";

import {
  composeDueAt,
  formatDueAtLabel,
  splitDueAt,
} from "@/lib/tasks/due-at";

describe("composeDueAt", () => {
  it("returns null when date is empty", () => {
    expect(composeDueAt("", "")).toBeNull();
    expect(composeDueAt("", "14:30")).toBeNull();
  });

  it("returns date-only when time is empty", () => {
    expect(composeDueAt("2026-09-03", "")).toBe("2026-09-03");
  });

  it("combines date and time", () => {
    expect(composeDueAt("2026-09-03", "14:30")).toBe("2026-09-03T14:30:00");
  });
});

describe("splitDueAt", () => {
  it("handles null and date-only", () => {
    expect(splitDueAt(null)).toEqual({ date: "", time: "" });
    expect(splitDueAt("2026-09-03")).toEqual({
      date: "2026-09-03",
      time: "",
    });
  });

  it("extracts time from ISO-like values", () => {
    expect(splitDueAt("2026-09-03T14:30:00.000Z")).toEqual({
      date: "2026-09-03",
      time: "14:30",
    });
  });
});

describe("formatDueAtLabel", () => {
  it("formats empty, date-only, and datetime", () => {
    expect(formatDueAtLabel(null)).toBe("No due date");
    expect(formatDueAtLabel("2026-09-03")).toBe("2026-09-03");
    expect(formatDueAtLabel("2026-09-03T14:30:00")).toBe("2026-09-03 · 14:30");
  });
});
