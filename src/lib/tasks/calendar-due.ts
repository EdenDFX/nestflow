import { format } from "date-fns";

const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function calendarDayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function dueAtDayKey(dueAt: string): string {
  return format(new Date(dueAt), "yyyy-MM-dd");
}

export function shiftDueAtToDay(dueAt: string, dayYmd: string): string | null {
  const current = new Date(dueAt);
  if (Number.isNaN(current.getTime())) {
    return null;
  }

  const parts = DAY_KEY.exec(dayYmd);
  if (!parts) {
    return null;
  }

  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);
  const next = new Date(current.getTime());
  next.setFullYear(year, month - 1, day);
  if (Number.isNaN(next.getTime())) {
    return null;
  }

  return next.toISOString();
}
