"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentProps } from "react";

import { BadgeAlertIcon } from "@/components/icons/badge-alert";
import { BanIcon } from "@/components/icons/ban";
import { CheckIcon } from "@/components/icons/check";
import { PauseIcon } from "@/components/icons/pause";
import { PlayIcon } from "@/components/icons/play";
import { RotateCCWIcon } from "@/components/icons/rotate-ccw";
import { TimerIcon } from "@/components/icons/timer";
import { XIcon } from "@/components/icons/x";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { NestFlowProfile } from "@/lib/auth/types";
import { islandUpdates, type IslandUpdate } from "@/lib/notifications/island-updates";
import type { NestFlowNotification } from "@/lib/notifications/types";
import { islandAttention, type IslandAttention } from "@/lib/tasks/island-attention";
import { cn } from "@/lib/utils";

const POMODORO_SECONDS = 25 * 60;
const STORAGE_KEY = "nestflow.workspace-island.pomodoro";

type PomodoroState = {
  remaining: number;
  running: boolean;
  updatedAt: number;
};

function profileInitials(profile: NestFlowProfile) {
  const source = profile.fullName?.trim() || profile.email || profile.nestId || "NF";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatIslandDate(date: Date, compact = false) {
  return new Intl.DateTimeFormat("en-GB", {
    ...(compact ? {} : { weekday: "short" as const }),
    day: "numeric",
    month: "short",
  }).format(date);
}

function defaultPomodoro(): PomodoroState {
  return {
    remaining: POMODORO_SECONDS,
    running: false,
    updatedAt: Date.now(),
  };
}

function readPomodoro(): PomodoroState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultPomodoro();
    }

    const parsed = JSON.parse(raw) as PomodoroState;
    if (
      typeof parsed.remaining !== "number" ||
      typeof parsed.running !== "boolean" ||
      typeof parsed.updatedAt !== "number"
    ) {
      return defaultPomodoro();
    }

    if (!parsed.running) {
      return {
        remaining: parsed.remaining,
        running: false,
        updatedAt: Date.now(),
      };
    }

    const elapsed = Math.floor((Date.now() - parsed.updatedAt) / 1000);
    const remaining = Math.max(0, parsed.remaining - elapsed);
    return {
      remaining,
      running: remaining > 0,
      updatedAt: Date.now(),
    };
  } catch {
    return defaultPomodoro();
  }
}

function writePomodoro(state: PomodoroState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

type WorkspaceIslandProps = {
  profile: NestFlowProfile;
  overdueCount: number;
  blockedCount: number;
  notifications: NestFlowNotification[];
  unreadCount: number;
  className?: string;
};

export function WorkspaceIsland({
  profile,
  overdueCount,
  blockedCount,
  notifications,
  unreadCount,
  className,
}: WorkspaceIslandProps) {
  const [now, setNow] = useState(() => new Date());
  const [pomodoro, setPomodoro] = useState<PomodoroState>(defaultPomodoro);
  const [focusMode, setFocusMode] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Expand while focus is active and time remains; auto-collapse at 00:00.
  const isFocusExpanded = focusMode && pomodoro.remaining > 0;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const restored = readPomodoro();
      setPomodoro(restored);
      if (restored.running && restored.remaining > 0) {
        setFocusMode(true);
      }
      setPrefersReducedMotion(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const clock = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!pomodoro.running) {
      return;
    }

    const timer = window.setInterval(() => {
      setPomodoro((current) => {
        if (!current.running) {
          return current;
        }

        const remaining = Math.max(0, current.remaining - 1);
        const next = {
          remaining,
          running: remaining > 0,
          updatedAt: Date.now(),
        };
        writePomodoro(next);
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [pomodoro.running]);

  const attention = islandAttention({
    overdue: overdueCount,
    blocked: blockedCount,
  });
  const updates = islandUpdates(notifications);
  const youLabel = profile.fullName?.split(" ")[0] ?? profile.nestId ?? "You";
  const progress =
    ((POMODORO_SECONDS - pomodoro.remaining) / POMODORO_SECONDS) * 100;

  function startFocus() {
    setFocusMode(true);
    setPomodoro((current) => {
      const next: PomodoroState = {
        remaining: current.remaining <= 0 ? POMODORO_SECONDS : current.remaining,
        running: true,
        updatedAt: Date.now(),
      };
      writePomodoro(next);
      return next;
    });
  }

  function togglePomodoro() {
    if (!pomodoro.running && (pomodoro.remaining === 0 || !focusMode)) {
      startFocus();
      return;
    }

    setPomodoro((current) => {
      const next: PomodoroState = {
        remaining: current.remaining,
        running: !current.running,
        updatedAt: Date.now(),
      };
      writePomodoro(next);
      return next;
    });
  }

  function resetPomodoro() {
    const next = defaultPomodoro();
    writePomodoro(next);
    setPomodoro(next);
    setFocusMode(false);
  }

  function exitFocus() {
    setPomodoro((current) => {
      const next = {
        ...current,
        running: false,
        updatedAt: Date.now(),
      };
      writePomodoro(next);
      return next;
    });
    setFocusMode(false);
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden rounded-full border border-border/80 bg-card px-1.5 py-1 text-foreground sm:gap-2 sm:px-2",
        !prefersReducedMotion &&
          "transition-[padding,gap] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isFocusExpanded && "gap-0",
        className,
      )}
      role="region"
      aria-label="Workspace island"
    >
      <div
        className={cn(
          "relative flex min-w-0 items-center overflow-hidden rounded-full bg-primary text-primary-foreground",
          !prefersReducedMotion &&
            "motion-safe:transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isFocusExpanded
            ? "h-9 w-full flex-1 justify-between gap-3 px-3"
            : "h-8 w-auto shrink-0 justify-between gap-2 px-2.5",
          pomodoro.running && !isFocusExpanded && "motion-safe:animate-pulse",
        )}
      >
        {isFocusExpanded ? (
          <div
            aria-hidden
            className={cn(
              "absolute inset-y-0 left-0 w-full origin-left bg-black/15",
              !prefersReducedMotion &&
                "motion-safe:transition-transform duration-1000 ease-linear",
            )}
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        ) : null}

        <div className="relative z-10 flex min-w-0 items-center gap-2">
          <TimerIcon className="inline-flex shrink-0" size={14} aria-hidden />
          <span className="font-mono text-xs font-semibold tabular-nums sm:text-sm">
            {formatClock(pomodoro.remaining)}
          </span>
          {isFocusExpanded ? (
            <span className="hidden truncate text-xs text-primary-foreground/80 sm:inline">
              {pomodoro.running
                ? "Focus session"
                : pomodoro.remaining === 0
                  ? "Session complete"
                  : "Paused"}
            </span>
          ) : null}
        </div>

        <div className="relative z-10 inline-flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={togglePomodoro}
            className="rounded-full p-1 transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
            aria-label={
              pomodoro.running
                ? "Pause pomodoro"
                : isFocusExpanded
                  ? "Resume pomodoro"
                  : "Start pomodoro"
            }
          >
            {pomodoro.running ? (
              <PauseIcon className="inline-flex" size={14} />
            ) : (
              <PlayIcon className="inline-flex" size={14} />
            )}
          </button>
          {isFocusExpanded ? (
            <button
              type="button"
              onClick={exitFocus}
              className="rounded-full p-1 transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
              aria-label="Collapse focus session"
            >
              <XIcon className="inline-flex" size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={resetPomodoro}
              className="hidden rounded-full p-1 transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none sm:inline-flex"
              aria-label="Reset pomodoro"
            >
              <RotateCCWIcon className="inline-flex" size={14} />
            </button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden sm:gap-2",
          !prefersReducedMotion &&
            "motion-safe:transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isFocusExpanded
            ? "max-w-0 flex-none scale-95 gap-0 opacity-0"
            : "scale-100 opacity-100",
        )}
        aria-hidden={isFocusExpanded}
      >
        <IslandChip>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            <span className="sm:hidden">{formatIslandDate(now, true)}</span>
            <span className="hidden sm:inline">{formatIslandDate(now)}</span>
          </span>
        </IslandChip>

        <IslandChip className="hidden gap-2 lg:inline-flex">
          <Avatar className="size-6 ring-2 ring-background">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="bg-muted text-[10px] text-foreground">
              {profileInitials(profile)}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[6rem] truncate text-xs font-medium">
            {youLabel}
          </span>
        </IslandChip>

        <IslandTicker
          key={updates.map((item) => item.id).join(":")}
          updates={updates}
          unreadCount={unreadCount}
          reducedMotion={prefersReducedMotion}
        />

        <IslandChip
          href={attention.href}
          className={cn(
            "ml-auto gap-1",
            attention.tone === "healthy" &&
              "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300",
            attention.tone === "watch" &&
              "bg-amber-500/12 text-amber-800 dark:text-amber-300",
            attention.tone === "risk" &&
              "bg-red-500/12 text-red-800 dark:text-red-300",
          )}
          aria-label={
            attention.tone === "healthy"
              ? "No overdue or blocked work. Open My Tasks."
              : `Open My Tasks. ${attention.label}.`
          }
        >
          {attentionIcon(attention.tone)}
          <span className="text-xs font-medium">{attention.label}</span>
        </IslandChip>
      </div>
    </div>
  );
}

function IslandTicker({
  updates,
  unreadCount,
  reducedMotion,
}: {
  updates: IslandUpdate[];
  unreadCount: number;
  reducedMotion: boolean;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion || updates.length < 2) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % updates.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [reducedMotion, updates.length]);

  if (updates.length === 0) {
    return (
      <Link
        href="/app/notifications"
        className="hidden h-8 min-w-0 flex-1 items-center rounded-full bg-muted/80 px-3 text-xs text-muted-foreground transition-opacity hover:opacity-90 sm:flex"
      >
        Inbox is quiet
      </Link>
    );
  }

  const current = updates[index] ?? updates[0]!;

  return (
    <Link
      href={current.href}
      className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full bg-muted/80 px-3 transition-opacity hover:opacity-90"
      aria-label={`${unreadCount > 0 ? `${unreadCount} new. ` : ""}${current.kindLabel}: ${current.title}`}
    >
      {unreadCount > 0 ? (
        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-primary">
          {unreadCount > 9 ? "9+" : unreadCount} new
        </span>
      ) : null}
      <span className="min-w-0 truncate text-xs" aria-live="polite">
        <span className="text-muted-foreground">{current.kindLabel} · </span>
        {current.title}
      </span>
    </Link>
  );
}

function attentionIcon(tone: IslandAttention["tone"]) {
  switch (tone) {
    case "risk":
      return <BadgeAlertIcon className="inline-flex" size={14} aria-hidden />;
    case "watch":
      return <BanIcon className="inline-flex" size={14} aria-hidden />;
    case "healthy":
      return <CheckIcon className="inline-flex" size={14} aria-hidden />;
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

function IslandChip({
  children,
  className,
  href,
  ...props
}: ComponentProps<"div"> & { href?: string }) {
  const chipClass = cn(
    "inline-flex h-8 shrink-0 items-center rounded-full bg-muted/80 px-2.5",
    href && "transition-opacity hover:opacity-90",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={chipClass}
        aria-label={
          typeof props["aria-label"] === "string" ? props["aria-label"] : undefined
        }
      >
        {children}
      </Link>
    );
  }

  return (
    <div className={chipClass} {...props}>
      {children}
    </div>
  );
}
