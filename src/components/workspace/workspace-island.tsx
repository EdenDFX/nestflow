"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { useReducedMotion } from "motion/react";

import { BadgeAlertIcon } from "@/components/icons/badge-alert";
import { BanIcon } from "@/components/icons/ban";
import { CheckIcon } from "@/components/icons/check";
import { PauseIcon } from "@/components/icons/pause";
import { PlayIcon } from "@/components/icons/play";
import { RotateCCWIcon } from "@/components/icons/rotate-ccw";
import { TimerIcon } from "@/components/icons/timer";
import { XIcon } from "@/components/icons/x";
import {
  DynamicIsland,
  type DynamicIslandView,
} from "@/components/ui/dynamic-island";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIslandChromeReporter } from "@/components/layout/island-chrome-context";
import { homePathForRoles } from "@/lib/auth/navigation";
import type { NestFlowProfile } from "@/lib/auth/types";
import {
  islandUpdates,
  type IslandUpdate,
} from "@/lib/notifications/island-updates";
import type { NestFlowNotification } from "@/lib/notifications/types";
import {
  islandAttention,
  type IslandAttention,
} from "@/lib/tasks/island-attention";
import { playAppSound, triggerHaptic } from "@/lib/sounds/play";
import { cn } from "@/lib/utils";

const POMODORO_SECONDS = 25 * 60;
const STORAGE_KEY = "nestflow.workspace-island.pomodoro";
const NOTIFICATION_HOLD_MS = 5200;

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
  const [expanded, setExpanded] = useState(false);
  const [alertUpdate, setAlertUpdate] = useState<IslandUpdate | null>(null);
  const seenUnreadRef = useRef<Set<string>>(new Set());
  const alertTimerRef = useRef<number | null>(null);
  const chrome = useIslandChromeReporter();

  const isFocusExpanded = focusMode && pomodoro.remaining > 0;
  const updates = islandUpdates(notifications);
  const youLabel = profile.fullName?.split(" ")[0] ?? profile.nestId ?? "You";
  const progress =
    ((POMODORO_SECONDS - pomodoro.remaining) / POMODORO_SECONDS) * 100;

  const attention = islandAttention(
    {
      overdue: overdueCount,
      blocked: blockedCount,
    },
    { href: homePathForRoles(profile.roles) },
  );

  const view: DynamicIslandView = (() => {
    if (isFocusExpanded) return "timer";
    if (alertUpdate) return "notification";
    if (attention.tone !== "healthy" && !expanded) return "action";
    if (expanded) return "strip";
    return "idle";
  })();

  const reportView = chrome?.setView;

  useEffect(() => {
    reportView?.(view);
  }, [reportView, view]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const restored = readPomodoro();
      setPomodoro(restored);
      if (restored.running && restored.remaining > 0) {
        setFocusMode(true);
      }
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
        if (remaining === 0 && current.remaining > 0) {
          playAppSound("timerComplete");
          triggerHaptic("success");
        }
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

  useEffect(() => {
    if (isFocusExpanded) {
      return;
    }

    const unread = updates.filter((item) => item.unread);
    const nextAlert = unread.find((item) => !seenUnreadRef.current.has(item.id));
    if (!nextAlert) {
      return;
    }

    seenUnreadRef.current.add(nextAlert.id);
    setAlertUpdate(nextAlert);
    playAppSound("taskNotification");
    triggerHaptic("medium");
    if (alertTimerRef.current) {
      window.clearTimeout(alertTimerRef.current);
    }
    alertTimerRef.current = window.setTimeout(() => {
      setAlertUpdate(null);
      alertTimerRef.current = null;
    }, NOTIFICATION_HOLD_MS);
  }, [updates, isFocusExpanded]);

  useEffect(() => {
    return () => {
      if (alertTimerRef.current) {
        window.clearTimeout(alertTimerRef.current);
      }
    };
  }, []);

  function startFocus() {
    setFocusMode(true);
    setAlertUpdate(null);
    playAppSound("timer");
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

    playAppSound(pomodoro.running ? "click" : "timer");
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
    playAppSound("reject");
    const next = defaultPomodoro();
    writePomodoro(next);
    setPomodoro(next);
    setFocusMode(false);
  }

  function exitFocus() {
    playAppSound("island");
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

  function dismissAlert() {
    playAppSound("click");
    setAlertUpdate(null);
    if (alertTimerRef.current) {
      window.clearTimeout(alertTimerRef.current);
      alertTimerRef.current = null;
    }
  }

  return (
    <DynamicIsland view={view} className={cn("w-full min-w-0", className)}>
      {view === "timer" ? (
        <FocusView
          remaining={pomodoro.remaining}
          running={pomodoro.running}
          progress={progress}
          onToggle={togglePomodoro}
          onReset={resetPomodoro}
          onExit={exitFocus}
        />
      ) : null}

      {view === "notification" && alertUpdate ? (
        <NotificationView
          update={alertUpdate}
          unreadCount={unreadCount}
          onDismiss={dismissAlert}
        />
      ) : null}

      {view === "action" ? (
        <ActionView
          attention={attention}
          onExpand={() => {
            playAppSound("island");
            setExpanded(true);
          }}
        />
      ) : null}

      {view === "idle" ? (
        <IdleView
          now={now}
          remaining={pomodoro.remaining}
          running={pomodoro.running}
          youLabel={youLabel}
          onExpand={() => {
            playAppSound("island");
            setExpanded(true);
          }}
          onToggleTimer={togglePomodoro}
          onReset={resetPomodoro}
        />
      ) : null}

      {view === "strip" ? (
        <StripView
          now={now}
          profile={profile}
          youLabel={youLabel}
          pomodoro={pomodoro}
          progress={progress}
          updates={updates}
          unreadCount={unreadCount}
          attention={attention}
          onToggle={togglePomodoro}
          onReset={resetPomodoro}
          onCollapse={() => {
            playAppSound("click");
            setExpanded(false);
          }}
        />
      ) : null}
    </DynamicIsland>
  );
}

function FocusView({
  remaining,
  running,
  progress,
  onToggle,
  onReset,
  onExit,
}: {
  remaining: number;
  running: boolean;
  progress: number;
  onToggle: () => void;
  onReset: () => void;
  onExit: () => void;
}) {
  return (
    <div className="relative flex h-9 w-[min(100%,18rem)] items-center justify-between gap-2 px-2.5 sm:h-10 sm:w-[min(100%,22rem)] sm:gap-3 sm:px-4">
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 origin-left bg-black/15 motion-safe:transition-transform motion-safe:duration-1000 motion-safe:ease-linear"
        style={{ transform: `scaleX(${progress / 100})`, width: "100%" }}
      />
      <div className="relative z-10 flex min-w-0 items-center gap-1.5 sm:gap-2">
        <TimerIcon className="inline-flex shrink-0" size={14} aria-hidden />
        <span className="font-mono text-xs font-semibold tabular-nums sm:text-sm">
          {formatClock(remaining)}
        </span>
        <span className="hidden truncate text-xs text-primary-foreground/80 md:inline">
          {running ? "Focus session" : remaining === 0 ? "Session complete" : "Paused"}
        </span>
      </div>
      <div className="relative z-10 inline-flex shrink-0 items-center gap-0.5">
        <IslandIconButton
          onClick={onToggle}
          aria-label={running ? "Pause pomodoro" : "Resume pomodoro"}
        >
          {running ? (
            <PauseIcon className="inline-flex" size={14} />
          ) : (
            <PlayIcon className="inline-flex" size={14} />
          )}
        </IslandIconButton>
        <IslandIconButton onClick={onReset} aria-label="Reset pomodoro">
          <RotateCCWIcon className="inline-flex" size={14} />
        </IslandIconButton>
        <IslandIconButton onClick={onExit} aria-label="Collapse focus session">
          <XIcon className="inline-flex" size={14} />
        </IslandIconButton>
      </div>
    </div>
  );
}

function NotificationView({
  update,
  unreadCount,
  onDismiss,
}: {
  update: IslandUpdate;
  unreadCount: number;
  onDismiss: () => void;
}) {
  return (
    <div className="flex h-9 w-[min(100%,18rem)] items-center gap-2 px-2.5 sm:h-11 sm:w-[min(100%,22rem)] sm:gap-2.5 sm:px-4">
      <Link
        href={update.href}
        className="flex min-w-0 flex-1 items-center gap-2"
        onClick={onDismiss}
        aria-label={`${unreadCount > 0 ? `${unreadCount} new. ` : ""}${update.kindLabel}: ${update.title}`}
      >
        {unreadCount > 0 ? (
          <span className="shrink-0 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
        <span className="min-w-0 truncate text-xs">
          <span className="text-muted-foreground">{update.kindLabel} · </span>
          {update.title}
        </span>
      </Link>
      <IslandIconButton onClick={onDismiss} aria-label="Dismiss notification">
        <XIcon className="inline-flex" size={14} />
      </IslandIconButton>
    </div>
  );
}

function ActionView({
  attention,
  onExpand,
}: {
  attention: IslandAttention;
  onExpand: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={cn(
        "flex h-10 items-center gap-2 px-3.5 text-xs font-medium",
        attention.tone === "watch" && "text-amber-800 dark:text-amber-300",
        attention.tone === "risk" && "text-red-800 dark:text-red-300",
      )}
      aria-label={`Open island. ${attention.label}.`}
    >
      {attentionIcon(attention.tone)}
      <span>{attention.label}</span>
    </button>
  );
}

function IdleView({
  now,
  remaining,
  running,
  youLabel,
  onExpand,
  onToggleTimer,
  onReset,
}: {
  now: Date;
  remaining: number;
  running: boolean;
  youLabel: string;
  onExpand: () => void;
  onToggleTimer: () => void;
  onReset: () => void;
}) {
  const canReset = remaining < POMODORO_SECONDS;

  return (
    <div className="flex h-9 max-w-full items-center gap-1 px-1.5">
      <div
        className={cn(
          "inline-flex h-7 items-center rounded-full bg-primary text-primary-foreground",
          running && "motion-safe:animate-pulse",
        )}
      >
        <button
          type="button"
          onClick={onToggleTimer}
          className="inline-flex h-7 items-center gap-1.5 rounded-full px-2 sm:px-2.5"
          aria-label={running ? "Open focus session" : "Start pomodoro"}
        >
          <TimerIcon className="inline-flex" size={12} aria-hidden />
          <span className="font-mono text-[11px] font-semibold tabular-nums">
            {formatClock(remaining)}
          </span>
        </button>
        {canReset ? (
          <button
            type="button"
            onClick={onReset}
            className="mr-0.5 rounded-full p-1 transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
            aria-label="Reset pomodoro"
          >
            <RotateCCWIcon className="inline-flex" size={12} />
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onExpand}
        className="inline-flex h-7 max-w-[7rem] items-center gap-1.5 truncate rounded-full px-2 text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground sm:max-w-none sm:gap-2 sm:px-2.5"
        aria-label="Expand workspace island"
      >
        <span className="tabular-nums">{formatIslandDate(now, true)}</span>
        <span className="hidden max-w-[4.5rem] truncate md:inline">{youLabel}</span>
      </button>
    </div>
  );
}

function StripView({
  now,
  profile,
  youLabel,
  pomodoro,
  progress,
  updates,
  unreadCount,
  attention,
  onToggle,
  onReset,
  onCollapse,
}: {
  now: Date;
  profile: NestFlowProfile;
  youLabel: string;
  pomodoro: PomodoroState;
  progress: number;
  updates: IslandUpdate[];
  unreadCount: number;
  attention: IslandAttention;
  onToggle: () => void;
  onReset: () => void;
  onCollapse: () => void;
}) {
  return (
    <div className="flex w-[min(100%,26rem)] max-w-full items-center gap-1 overflow-hidden px-1.5 py-1 sm:gap-1.5">
      <div
        className={cn(
          "relative flex h-8 shrink-0 items-center justify-between gap-1.5 overflow-hidden rounded-full bg-primary px-2.5 text-primary-foreground",
          pomodoro.running && "motion-safe:animate-pulse",
        )}
      >
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 origin-left bg-black/10"
          style={{ width: `${progress}%` }}
        />
        <div className="relative z-10 flex items-center gap-1.5">
          <TimerIcon className="inline-flex shrink-0" size={14} aria-hidden />
          <span className="font-mono text-xs font-semibold tabular-nums">
            {formatClock(pomodoro.remaining)}
          </span>
        </div>
        <div className="relative z-10 inline-flex items-center">
          <IslandIconButton
            onClick={onToggle}
            aria-label={pomodoro.running ? "Pause pomodoro" : "Start pomodoro"}
          >
            {pomodoro.running ? (
              <PauseIcon className="inline-flex" size={14} />
            ) : (
              <PlayIcon className="inline-flex" size={14} />
            )}
          </IslandIconButton>
          <IslandIconButton
            onClick={onReset}
            className="inline-flex"
            aria-label="Reset pomodoro"
          >
            <RotateCCWIcon className="inline-flex" size={14} />
          </IslandIconButton>
        </div>
      </div>

      <IslandChip className="hidden md:inline-flex">
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {formatIslandDate(now, true)}
        </span>
      </IslandChip>

      <IslandChip className="hidden gap-2 2xl:inline-flex">
        <Avatar className="size-6 ring-2 ring-background">
          {profile.avatarUrl ? (
            <AvatarImage src={profile.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback className="bg-muted text-[10px] text-foreground">
            {profileInitials(profile)}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-[5rem] truncate text-xs font-medium">
          {youLabel}
        </span>
      </IslandChip>

      <IslandTicker updates={updates} unreadCount={unreadCount} />

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
        <span className="hidden text-xs font-medium lg:inline">
          {attention.label}
        </span>
      </IslandChip>

      <button
        type="button"
        onClick={onCollapse}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Shrink workspace island"
      >
        <XIcon className="inline-flex" size={12} />
      </button>
    </div>
  );
}

function IslandTicker({
  updates,
  unreadCount,
}: {
  updates: IslandUpdate[];
  unreadCount: number;
}) {
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || updates.length < 2) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % updates.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, updates.length]);

  if (updates.length === 0) {
    return (
      <Link
        href="/app/notifications"
        className="hidden h-8 min-w-0 max-w-[9rem] flex-1 items-center truncate rounded-full bg-muted/80 px-3 text-xs text-muted-foreground transition-opacity hover:opacity-90 xl:flex"
      >
        Inbox is quiet
      </Link>
    );
  }

  const current = updates[index] ?? updates[0]!;

  return (
    <Link
      href={current.href}
      className="flex h-8 min-w-0 max-w-[14rem] flex-1 items-center gap-2 rounded-full bg-muted/80 px-3 transition-opacity hover:opacity-90"
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

function IslandIconButton({
  children,
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full p-1 transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
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
