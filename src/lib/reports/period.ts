import type { PeriodBounds, ReportPeriodKind } from "@/lib/reports/types";

/** Nest ops timezone. Africa/Lagos is permanently UTC+1 (no DST). */
export const REPORT_TIMEZONE = "Africa/Lagos";
const LAGOS_OFFSET = "+01:00";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Calendar YYYY-MM-DD in Africa/Lagos for an instant. */
export function lagosYmd(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Weekday Mon=1 … Sun=7 in Africa/Lagos. */
export function lagosWeekdayMon1(date: Date = new Date()): number {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TIMEZONE,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return map[label] ?? 1;
}

export function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y: y!, m: m!, d: d! };
}

export function formatYmd(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** Start of Lagos calendar day as UTC Date. */
export function lagosDayStartUtc(ymd: string): Date {
  return new Date(`${ymd}T00:00:00${LAGOS_OFFSET}`);
}

export function addCalendarDays(ymd: string, delta: number): string {
  const start = lagosDayStartUtc(ymd);
  const next = new Date(start.getTime() + delta * 24 * 60 * 60 * 1000);
  return lagosYmd(next);
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function addCalendarMonths(ymd: string, delta: number): string {
  const { y, m, d } = parseYmd(ymd);
  const idx = y * 12 + (m - 1) + delta;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  const dim = daysInMonth(ny, nm);
  return formatYmd(ny, nm, Math.min(d, dim));
}

/** ISO week key (Monday-based) for a Lagos YYYY-MM-DD. */
export function isoWeekKey(ymd: string): string {
  const start = lagosDayStartUtc(ymd);
  // Use UTC Thursday trick on Lagos noon to avoid boundary issues.
  const noon = new Date(start.getTime() + 12 * 60 * 60 * 1000);
  const day = lagosWeekdayMon1(noon);
  const thursday = new Date(noon.getTime() + (4 - day) * 24 * 60 * 60 * 1000);
  const thuYmd = lagosYmd(thursday);
  const { y } = parseYmd(thuYmd);
  const jan4 = formatYmd(y, 1, 4);
  const jan4Start = lagosDayStartUtc(jan4);
  const week1MondayOffset = lagosWeekdayMon1(jan4Start) - 1;
  const week1Monday = new Date(
    jan4Start.getTime() - week1MondayOffset * 24 * 60 * 60 * 1000,
  );
  const week =
    Math.floor((start.getTime() - week1Monday.getTime()) / (7 * 24 * 60 * 60 * 1000)) +
    1;
  return `${y}-W${pad2(week)}`;
}

function dailyLabel(ymd: string): string {
  const start = lagosDayStartUtc(ymd);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: REPORT_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(start);
}

function weeklyLabel(startYmd: string, endYmd: string): string {
  return `${dailyLabel(startYmd)} – ${dailyLabel(endYmd)}`;
}

function monthlyLabel(ymd: string): string {
  const start = lagosDayStartUtc(ymd);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: REPORT_TIMEZONE,
    month: "long",
    year: "numeric",
  }).format(start);
}

/**
 * Resolve period bounds.
 * - Without `endingDate`: previous complete period relative to `now` (digest default).
 * - With `endingDate`: period that ends on that Lagos calendar day (inclusive end day).
 */
export function resolvePeriodBounds(
  kind: ReportPeriodKind,
  options?: { endingDate?: string; now?: Date },
): PeriodBounds {
  const now = options?.now ?? new Date();
  const today = lagosYmd(now);

  if (kind === "daily") {
    const ending = options?.endingDate ?? addCalendarDays(today, -1);
    const start = lagosDayStartUtc(ending);
    const end = lagosDayStartUtc(addCalendarDays(ending, 1));
    return {
      kind,
      start,
      end,
      periodKey: ending,
      endingDate: ending,
      label: dailyLabel(ending),
    };
  }

  if (kind === "weekly") {
    let ending: string;
    if (options?.endingDate) {
      ending = options.endingDate;
    } else {
      // Previous complete Mon–Sun ends on the most recent Sunday before today.
      // On Sunday, that is 7 days ago (last week); Mon–Sat uses this week's Sunday? No —
      // Mon–Sat: most recent Sunday is still "last week"'s end.
      const weekday = lagosWeekdayMon1(now);
      ending =
        weekday === 7
          ? addCalendarDays(today, -7)
          : addCalendarDays(today, -weekday);
    }
    const startYmd = addCalendarDays(ending, -6);
    const start = lagosDayStartUtc(startYmd);
    const end = lagosDayStartUtc(addCalendarDays(ending, 1));
    return {
      kind,
      start,
      end,
      periodKey: isoWeekKey(startYmd),
      endingDate: ending,
      label: weeklyLabel(startYmd, ending),
    };
  }

  // monthly
  let ending: string;
  if (options?.endingDate) {
    ending = options.endingDate;
  } else {
    const firstOfThisMonth = `${today.slice(0, 7)}-01`;
    ending = addCalendarDays(firstOfThisMonth, -1);
  }
  const { y, m } = parseYmd(ending);
  const startYmd = formatYmd(y, m, 1);
  const start = lagosDayStartUtc(startYmd);
  const end = lagosDayStartUtc(addCalendarDays(ending, 1));
  return {
    kind,
    start,
    end,
    periodKey: `${y}-${pad2(m)}`,
    endingDate: ending,
    label: monthlyLabel(startYmd),
  };
}

/** Which digest periods should fire for a Lagos "today". */
export function digestPeriodsForToday(now: Date = new Date()): ReportPeriodKind[] {
  const kinds: ReportPeriodKind[] = ["daily"];
  if (lagosWeekdayMon1(now) === 1) {
    kinds.push("weekly");
  }
  const today = lagosYmd(now);
  if (parseYmd(today).d === 1) {
    kinds.push("monthly");
  }
  return kinds;
}

export function periodHref(
  kind: ReportPeriodKind,
  endingDate: string,
  options?: { department?: string | null },
): string {
  const params = new URLSearchParams({
    period: kind,
    ending: endingDate,
  });
  const department = options?.department?.trim();
  if (department) {
    params.set("department", department);
  }
  return `/app/reports?${params.toString()}`;
}

/**
 * Default ending date for the interactive reports UI.
 * Unlike digest defaults, this includes the in-progress day, week, or month.
 */
export function resolveInteractivePeriodEnding(
  kind: ReportPeriodKind,
  now: Date = new Date(),
): string {
  const today = lagosYmd(now);

  if (kind === "daily") {
    return today;
  }

  if (kind === "weekly") {
    const weekday = lagosWeekdayMon1(now);
    if (weekday === 7) return today;
    return addCalendarDays(today, 7 - weekday);
  }

  const { y, m } = parseYmd(today);
  return formatYmd(y, m, daysInMonth(y, m));
}

/** Shift an ending date by one period for prev/next navigation. */
export function shiftEndingDate(
  kind: ReportPeriodKind,
  endingDate: string,
  direction: -1 | 1,
): string {
  if (kind === "daily") {
    return addCalendarDays(endingDate, direction);
  }
  if (kind === "weekly") {
    return addCalendarDays(endingDate, direction * 7);
  }
  const startOfMonth = `${endingDate.slice(0, 7)}-01`;
  const shiftedStart = addCalendarMonths(startOfMonth, direction);
  const { y, m } = parseYmd(shiftedStart);
  return formatYmd(y, m, daysInMonth(y, m));
}
