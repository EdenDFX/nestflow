import Link from "next/link";
import { Suspense } from "react";

import { NestFlowMark } from "@/components/auth/nestflow-mark";
import { HeaderBellFallback, HeaderIslandFallback } from "@/components/layout/app-header-fallbacks";
import {
  HeaderBell,
  HeaderIsland,
} from "@/components/layout/app-header-metrics";
import { AppMobileNav, AppNavRail } from "@/components/layout/app-nav";
import { AppUserMenu } from "@/components/layout/app-user-menu";
import { CommandPaletteHost } from "@/components/search/command-palette-host";
import { SearchTrigger } from "@/components/search/search-trigger";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { NavItem } from "@/lib/auth/navigation";
import type { NestFlowProfile } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

export function AppShell({
  profile,
  navItems,
  homeHref,
  className,
  children,
}: {
  profile: NestFlowProfile;
  navItems: NavItem[];
  homeHref: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-dvh max-h-dvh flex-1 overflow-hidden bg-background text-foreground",
        className,
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <aside
        className="hidden h-full w-[84px] shrink-0 flex-col items-center border-r border-border/70 bg-background/95 py-4 lg:flex"
        aria-label="Primary"
      >
        <div className="flex w-full flex-col items-center gap-5 px-2">
          <Link
            href={homeHref}
            aria-label="NestFlow home"
            className="rounded-2xl ring-offset-background transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <NestFlowMark size="sm" className="rounded-2xl" />
          </Link>
          <div className="h-px w-8 bg-border/80" aria-hidden />
          <AppNavRail items={navItems} className="flex-1" />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-40 shrink-0 border-b border-border/80 bg-background/90 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <AppMobileNav
              profile={profile}
              navItems={navItems}
              homeHref={homeHref}
            />

            <Suspense fallback={<HeaderIslandFallback />}>
              <HeaderIsland profile={profile} />
            </Suspense>

            <div className="ml-auto flex items-center gap-2">
              <SearchTrigger />
              <ThemeToggle />
              <Suspense fallback={<HeaderBellFallback />}>
                <HeaderBell />
              </Suspense>
              <AppUserMenu profile={profile} />
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="nf-scroll mx-auto min-h-0 w-full max-w-[1400px] flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8"
        >
          {children}
        </main>
      </div>
      <CommandPaletteHost />
    </div>
  );
}
