/**
 * Compose optional date + optional submit time into a due_at value.
 * Date-only keeps existing YYYY-MM-DD behaviour. Time requires a date.
 */
export function composeDueAt(
  date: string,
  time: string,
): string | null {
  const d = date.trim();
  if (!d) return null;
  const t = time.trim();
  if (!t) return d;
  return `${d}T${t}:00`;
}

/** Split a stored due_at into form date / time fields. */
export function splitDueAt(dueAt: string | null): {
  date: string;
  time: string;
} {
  if (!dueAt) {
    return { date: "", time: "" };
  }

  const date = dueAt.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { date: "", time: "" };
  }

  const match = dueAt.match(/T(\d{2}):(\d{2})/);
  if (!match) {
    return { date, time: "" };
  }

  return { date, time: `${match[1]}:${match[2]}` };
}

/** Human-readable due label for progress / read-only views. */
export function formatDueAtLabel(dueAt: string | null): string {
  if (!dueAt) return "No due date";
  const { date, time } = splitDueAt(dueAt);
  if (!date) return "No due date";
  if (!time) return date;
  return `${date} · ${time}`;
}
