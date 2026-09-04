import { CommandPaletteHost } from "@/components/search/command-palette-host";
import { cn } from "@/lib/utils";

import "@/styles/admin-dashboard.css";

/** Full-bleed main region for the standalone admin dashboard. */
export function AdminMainShell({
  className,
  children,
}: {
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
      <main
        id="main-content"
        tabIndex={-1}
        className="nf-scroll admin-dashboard-main min-h-0 w-full flex-1 overflow-y-auto"
      >
        {children}
      </main>
      <CommandPaletteHost />
    </div>
  );
}
