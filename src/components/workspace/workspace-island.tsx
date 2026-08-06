"use client";

import {
  Activity,
  FolderKanban,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ComponentProps } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NestFlowProfile } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const POMODORO_SECONDS = 25 * 60;
const STORAGE_KEY = "nestflow.workspace-island.pomodoro";

type PomodoroState = {
  remaining: number;
  running: boolean;
  updatedAt: number;
};

type HealthTone = "healthy" | "watch" | "risk";

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

function workspaceHealth(now: Date): { label: string; tone: HealthTone } {
  const hour = now.getHours();
  if (hour >= 16) {
    return { label: "Wrap-up", tone: "watch" };
  }
  if (hour < 9) {
    return { label: "Warm-up", tone: "watch" };
  }
  return { label: "On track", tone: "healthy" };
}

type WorkspaceIslandProps = {
  profile: NestFlowProfile;
  className?: string;
};

export function WorkspaceIsland({ profile, className }: WorkspaceIslandProps) {
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

  const health = workspaceHealth(now);
  const projectLabel = profile.department?.trim() || "NestFlow";
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
        "flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-full border px-1.5 py-1 sm:px-2.5 sm:py-1.5",
        "border-black/10 bg-[#1c1917] text-white shadow-[0_10px_40px_-24px_rgba(0,0,0,0.35)]",
        "dark:border-white/10 dark:bg-white dark:text-black dark:shadow-[0_10px_40px_-24px_rgba(0,0,0,0.45)]",
        !prefersReducedMotion &&
          "transition-[padding,gap] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isFocusExpanded && "gap-0 px-1.5 sm:px-2",
        className,
      )}
      role="region"
      aria-label="Workspace island"
    >
      <div
        className={cn(
          "relative flex min-w-0 items-center overflow-hidden rounded-full bg-primary text-white",
          !prefersReducedMotion &&
            "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isFocusExpanded
            ? "h-9 w-full flex-1 justify-between gap-3 px-3"
            : "h-8 w-auto shrink-0 justify-between gap-2 px-2.5",
          pomodoro.running && !isFocusExpanded && "motion-safe:animate-pulse",
        )}
      >
        {isFocusExpanded ? (
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 bg-black/15 transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        ) : null}

        <div className="relative z-10 flex min-w-0 items-center gap-2">
          <Timer className="size-3.5 shrink-0" aria-hidden />
          <span className="font-mono text-xs font-semibold tabular-nums sm:text-sm">
            {formatClock(pomodoro.remaining)}
          </span>
          {isFocusExpanded ? (
            <span className="hidden truncate text-xs text-white/80 sm:inline">
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
              <Pause className="size-3.5" />
            ) : (
              <Play className="size-3.5" />
            )}
          </button>
          {isFocusExpanded ? (
            <button
              type="button"
              onClick={exitFocus}
              className="rounded-full p-1 transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
              aria-label="Collapse focus session"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={resetPomodoro}
              className="hidden rounded-full p-1 transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none sm:inline-flex"
              aria-label="Reset pomodoro"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex min-w-0 items-center gap-1 overflow-hidden sm:gap-2",
          !prefersReducedMotion &&
            "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isFocusExpanded
            ? "max-w-0 flex-none scale-95 gap-0 opacity-0"
            : "max-w-[1000px] flex-1 scale-100 opacity-100",
        )}
        aria-hidden={isFocusExpanded}
      >
        <IslandChip className="bg-white/8 px-2 text-white/70 sm:px-2.5 dark:bg-black/[0.04] dark:text-black/70">
          <span className="text-[10px] font-semibold tabular-nums sm:text-xs">
            <span className="sm:hidden">{formatIslandDate(now, true)}</span>
            <span className="hidden sm:inline">{formatIslandDate(now)}</span>
          </span>
        </IslandChip>

        <IslandChip className="hidden gap-2 bg-white/8 lg:inline-flex dark:bg-black/[0.04]">
          <Avatar className="size-6 ring-2 ring-[#1c1917] dark:ring-white">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="bg-white/15 text-[10px] text-white dark:bg-black dark:text-white">
              {profileInitials(profile)}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[5.5rem] truncate text-xs font-semibold">
            {youLabel}
          </span>
          <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase dark:bg-primary/15">
            You
          </span>
        </IslandChip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden items-center xl:flex">
              <IslandChip className="gap-1.5 bg-white/8 dark:bg-black/[0.04]">
                <Users
                  className="size-3.5 text-white/45 dark:text-black/45"
                  aria-hidden
                />
                <div className="flex -space-x-1.5">
                  <Avatar className="size-5 ring-2 ring-[#1c1917] dark:ring-white">
                    {profile.avatarUrl ? (
                      <AvatarImage src={profile.avatarUrl} alt="" />
                    ) : null}
                    <AvatarFallback className="bg-primary text-[9px] text-primary-foreground">
                      {profileInitials(profile)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex size-5 items-center justify-center rounded-full bg-white/10 text-[9px] font-semibold text-white/55 ring-2 ring-[#1c1917] dark:bg-black/10 dark:text-black/55 dark:ring-white">
                    +
                  </span>
                </div>
                <span className="text-xs font-medium text-white/60 dark:text-black/60">
                  Team
                </span>
              </IslandChip>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Team presence connects with boards in M2.
          </TooltipContent>
        </Tooltip>

        <IslandChip className="hidden min-w-0 flex-1 gap-1.5 bg-white/8 dark:bg-black/[0.04] 2xl:flex">
          <FolderKanban
            className="size-3.5 shrink-0 text-white/45 dark:text-black/45"
            aria-hidden
          />
          <span className="truncate text-xs font-semibold">{projectLabel}</span>
          <span className="shrink-0 text-[10px] font-medium tracking-wide text-white/40 uppercase dark:text-black/40">
            Project
          </span>
        </IslandChip>

        <IslandChip
          className={cn(
            "ml-auto gap-1 px-2 sm:gap-1.5 sm:px-2.5",
            health.tone === "healthy" &&
              "bg-emerald-500/20 text-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-800",
            health.tone === "watch" &&
              "bg-amber-500/20 text-amber-300 dark:bg-amber-500/15 dark:text-amber-800",
            health.tone === "risk" &&
              "bg-red-500/20 text-red-300 dark:bg-red-500/15 dark:text-red-800",
          )}
          aria-label={health.label}
        >
          <Activity className="size-3.5" aria-hidden />
          <span className="text-[10px] font-semibold sm:text-xs">{health.label}</span>
        </IslandChip>
      </div>
    </div>
  );
}

function IslandChip({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "inline-flex h-8 shrink-0 items-center rounded-full px-2.5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
