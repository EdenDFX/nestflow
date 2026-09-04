"use client";

/**
 * NestFlow Dynamic Island shell.
 * Spring layout morph inspired by SmoothUI Dynamic Island
 * (https://smoothui.dev/docs/components/dynamic-island).
 */

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DynamicIslandView =
  | "idle"
  | "strip"
  | "timer"
  | "notification"
  | "action";

const BOUNCE_BY_TRANSITION: Record<string, number> = {
  idle: 0.5,
  "idle-strip": 0.45,
  "idle-timer": 0.3,
  "idle-notification": 0.4,
  "idle-action": 0.4,
  "strip-idle": 0.45,
  "strip-timer": 0.3,
  "strip-notification": 0.35,
  "strip-action": 0.35,
  "timer-idle": 0.3,
  "timer-strip": 0.3,
  "timer-notification": 0.35,
  "notification-idle": 0.4,
  "notification-strip": 0.35,
  "action-idle": 0.4,
  "action-strip": 0.35,
};

const DEFAULT_BOUNCE = 0.5;

type DynamicIslandProps = {
  view: DynamicIslandView;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  "aria-label"?: string;
};

export function DynamicIsland({
  view,
  children,
  className,
  contentClassName,
  "aria-label": ariaLabel = "Workspace island",
}: DynamicIslandProps) {
  const shouldReduceMotion = useReducedMotion();
  const bounce = BOUNCE_BY_TRANSITION[view] ?? DEFAULT_BOUNCE;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 max-w-full justify-center px-0.5",
        className,
      )}
      role="region"
      aria-label={ariaLabel}
    >
      <motion.div
        layout
        className={cn(
          "mx-auto w-fit max-w-full min-w-0 overflow-hidden rounded-full border border-border/80 bg-card text-foreground shadow-[0_8px_24px_-18px_rgba(0,0,0,0.55)]",
          view === "timer" &&
            "w-full border-primary/40 bg-primary text-primary-foreground sm:w-fit",
          view === "notification" && "w-full border-amber-500/30 sm:w-fit",
          view === "action" && "border-emerald-500/30",
          view === "strip" && "w-full sm:w-fit",
        )}
        style={{ borderRadius: 9999 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                type: "spring" as const,
                bounce,
                duration: 0.35,
              }
        }
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={view}
            className={cn("min-w-0", contentClassName)}
            initial={
              shouldReduceMotion
                ? false
                : {
                    filter: "blur(5px)",
                    opacity: 0,
                    scale: 0.92,
                  }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1, scale: 1 }
                : {
                    filter: "blur(0px)",
                    opacity: 1,
                    scale: 1,
                  }
            }
            exit={
              shouldReduceMotion
                ? undefined
                : {
                    filter: "blur(4px)",
                    opacity: 0,
                    scale: 0.94,
                  }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    type: "spring" as const,
                    bounce,
                    duration: 0.3,
                  }
            }
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
