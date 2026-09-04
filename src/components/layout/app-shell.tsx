import { Suspense } from "react";

import {
  HeaderBellFallback,
  HeaderIslandFallback,
} from "@/components/layout/app-header-fallbacks";
import {
  HeaderBell,
  HeaderIsland,
} from "@/components/layout/app-header-metrics";
import { AppOpsHeader } from "@/components/layout/app-ops-header";
import { IslandChromeProvider } from "@/components/layout/island-chrome-context";
import { CommandPaletteHost } from "@/components/search/command-palette-host";
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
        "flex h-dvh max-h-dvh flex-1 flex-col overflow-hidden bg-background text-foreground",
        className,
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <IslandChromeProvider>
        <AppOpsHeader
          profile={profile}
          navItems={navItems}
          homeHref={homeHref}
          island={
            <Suspense fallback={<HeaderIslandFallback />}>
              <HeaderIsland profile={profile} />
            </Suspense>
          }
          bell={
            <Suspense fallback={<HeaderBellFallback />}>
              <HeaderBell />
            </Suspense>
          }
        />
      </IslandChromeProvider>

      <main
        id="main-content"
        tabIndex={-1}
        className="nf-scroll mx-auto min-h-0 w-full max-w-[1400px] flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8"
      >
        {children}
      </main>

      <CommandPaletteHost />
    </div>
  );
}
