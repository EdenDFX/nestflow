import Link from "next/link";
import { Suspense } from "react";

import { NestFlowMark } from "@/components/auth/nestflow-mark";
import {
  HeaderBell,
  HeaderBellFallback,
  HeaderIsland,
  HeaderIslandFallback,
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
  className,
  children,
}: {
  profile: NestFlowProfile;
  navItems: NavItem[];
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
        className="hidden h-full w-[76px] shrink-0 flex-col items-center gap-6 border-r border-border/80 bg-background py-5 lg:flex"
        aria-label="Primary"
      >
        <Link href="/app" aria-label="NestFlow home">
          <NestFlowMark size="sm" className="rounded-full" />
        </Link>
        <AppNavRail items={navItems} className="flex-1" />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-40 shrink-0 border-b border-border/80 bg-background/90 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <AppMobileNav profile={profile} navItems={navItems} />

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
