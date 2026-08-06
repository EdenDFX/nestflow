"use client";

import { useEffect, useState } from "react";

import type { TaskStatus } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

export type DueTimerTone = "on-primary" | "on-ink" | "surface";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Human remaining or overdue span relative to `now`. */
export function formatDueCountdown(
  dueAt: string,
  nowMs: number,
): { label: string; remainingMs: number; overdue: boolean } {
  const dueMs = new Date(dueAt).getTime();
  const remainingMs = dueMs - nowMs;
  const overdue = remainingMs < 0;
  const abs = Math.abs(remainingMs);

  const totalMinutes = Math.floor(abs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  let span: string;
  if (days > 0) {
    span = hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  } else if (hours > 0) {
    span = minutes > 0 ? `${hours}h ${pad(minutes)}m` : `${hours}h`;
  } else {
    span = `${Math.max(1, minutes)}m`;
  }

  return {
    remainingMs,
    overdue,
    label: overdue ? `${span} overdue` : `${span} left`,
  };
}

export function TaskDueTimer({
  dueAt,
  status,
  tone = "surface",
  className,
}: {
  dueAt: string | null;
  status: TaskStatus;
  tone?: DueTimerTone;
  className?: string;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    // Tick often so short windows stay honest; cost is tiny for a few cards.
    const id = window.setInterval(() => setNowMs(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  if (status === "completed") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
          tone === "on-primary" && "bg-[#1c1917]/10 text-[#1c1917]/70",
          tone === "on-ink" && "bg-white/10 text-white/60",
          tone === "surface" && "bg-muted text-muted-foreground",
          className,
        )}
      >
        Complete
      </span>
    );
  }

  if (!dueAt) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
          tone === "on-primary" && "bg-[#1c1917]/10 text-[#1c1917]/65",
          tone === "on-ink" && "bg-white/10 text-white/55",
          tone === "surface" && "bg-muted text-muted-foreground",
          className,
        )}
      >
        No due date
      </span>
    );
  }

  const { label, remainingMs, overdue } = formatDueCountdown(dueAt, nowMs);
  const blocked = status === "blocked";
  const urgent =
    !overdue && !blocked && remainingMs > 0 && remainingMs < 24 * 60 * 60 * 1000;
  const alert = overdue || blocked;

  return (
    <span
      title={
        blocked
          ? `Blocked · ${overdue ? label : `Due ${new Date(dueAt).toLocaleString()}`}`
          : overdue
            ? label
            : `Due ${new Date(dueAt).toLocaleString()}`
      }
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums tracking-tight",
        alert &&
          "bg-red-600 text-white shadow-sm ring-1 ring-red-500/40 dark:bg-red-500",
        !alert &&
          urgent &&
          "bg-amber-500/20 text-amber-900 ring-1 ring-amber-500/30 dark:text-amber-200",
        !alert &&
          !urgent &&
          tone === "on-primary" &&
          "bg-[#1c1917]/10 text-[#1c1917]/80",
        !alert &&
          !urgent &&
          tone === "on-ink" &&
          "bg-white/12 text-white/80",
        !alert &&
          !urgent &&
          tone === "surface" &&
          "bg-muted text-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          alert ? "bg-white animate-pulse" : urgent ? "bg-amber-600" : "bg-current opacity-50",
        )}
      />
      {blocked ? (overdue ? `Blocked · ${label}` : "Blocked") : label}
    </span>
  );
}
