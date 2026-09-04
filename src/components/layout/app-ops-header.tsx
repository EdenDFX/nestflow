"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";

import { NestFlowMark } from "@/components/auth/nestflow-mark";
import { AppMobileNav } from "@/components/layout/app-nav";
import { AppRouteLinks } from "@/components/layout/app-route-links";
import { AppUserMenu } from "@/components/layout/app-user-menu";
import {
  useIslandChrome,
  type IslandRoom,
} from "@/components/layout/island-chrome-context";
import { SearchTrigger } from "@/components/search/search-trigger";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { NavItem } from "@/lib/auth/navigation";
import type { NestFlowProfile } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const sideTransition = {
  type: "spring" as const,
  bounce: 0.2,
  duration: 0.35,
};

const NARROW_QUERY = "(max-width: 899px)";

function subscribeNarrow(onStoreChange: () => void) {
  const media = window.matchMedia(NARROW_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getNarrowSnapshot() {
  return window.matchMedia(NARROW_QUERY).matches;
}

function getNarrowServerSnapshot() {
  return false;
}

function useNarrowHeader() {
  return useSyncExternalStore(
    subscribeNarrow,
    getNarrowSnapshot,
    getNarrowServerSnapshot,
  );
}

function ChromeSlot({
  show,
  children,
  className,
}: {
  show: boolean;
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          key="visible"
          className={cn("flex min-w-0 items-center overflow-hidden", className)}
          initial={
            reduceMotion ? false : { opacity: 0, maxWidth: 0, scale: 0.94 }
          }
          animate={{ opacity: 1, maxWidth: 480, scale: 1 }}
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, maxWidth: 0, scale: 0.94 }
          }
          transition={reduceMotion ? { duration: 0 } : sideTransition}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function resolveRoom(room: IslandRoom, narrow: boolean): IslandRoom {
  if (narrow && room === "grown") {
    return "dominant";
  }
  return room;
}

export function AppOpsHeader({
  profile,
  navItems,
  homeHref,
  island,
  bell,
}: {
  profile: NestFlowProfile;
  navItems: NavItem[];
  homeHref: string;
  island: ReactNode;
  bell: ReactNode;
}) {
  const { room } = useIslandChrome();
  const narrow = useNarrowHeader();
  const reduceMotion = useReducedMotion();
  const layoutRoom = resolveRoom(room, narrow);

  const showWordmark = layoutRoom === "resting";
  const showRoutes = layoutRoom === "resting";
  const showSearch = layoutRoom === "resting";
  const showTheme = layoutRoom !== "dominant";
  const showBell = layoutRoom !== "dominant";
  const showUser = layoutRoom !== "dominant";

  return (
    <header className="z-40 shrink-0 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div
        className={cn(
          "flex h-14 items-center px-3 sm:h-16 sm:px-5",
          layoutRoom === "dominant" ? "gap-2" : "gap-3 sm:gap-4",
        )}
      >
        <motion.div
          layout={!reduceMotion}
          className="flex min-w-0 shrink items-center gap-2"
          transition={reduceMotion ? { duration: 0 } : sideTransition}
        >
          <AppMobileNav
            profile={profile}
            navItems={navItems}
            homeHref={homeHref}
          />
          <Link
            href={homeHref}
            className="inline-flex shrink-0 items-center gap-2 rounded-full text-inherit no-underline"
            aria-label="NestFlow home"
          >
            <NestFlowMark size="sm" className="rounded-2xl" />
            <ChromeSlot show={showWordmark} className="hidden lg:flex">
              <span className="font-heading pr-1 text-lg font-semibold tracking-tight whitespace-nowrap">
                NestFlow
              </span>
            </ChromeSlot>
          </Link>
          <ChromeSlot show={showRoutes}>
            <AppRouteLinks items={navItems} />
          </ChromeSlot>
        </motion.div>

        <motion.div
          layout={!reduceMotion}
          className="flex min-w-0 flex-1 justify-center"
          transition={reduceMotion ? { duration: 0 } : sideTransition}
        >
          {island}
        </motion.div>

        <motion.div
          layout={!reduceMotion}
          className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2"
          transition={reduceMotion ? { duration: 0 } : sideTransition}
        >
          <ChromeSlot show={showSearch}>
            <SearchTrigger />
          </ChromeSlot>
          <ChromeSlot show={showTheme}>
            <ThemeToggle />
          </ChromeSlot>
          <ChromeSlot show={showBell}>{bell}</ChromeSlot>
          <ChromeSlot show={showUser}>
            <AppUserMenu profile={profile} />
          </ChromeSlot>
        </motion.div>
      </div>
    </header>
  );
}
