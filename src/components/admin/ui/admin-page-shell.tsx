import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminPageShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Two-column admin layout: calm sidebar + main canvas. */
export function AdminPageShell({
  sidebar,
  children,
  className,
}: AdminPageShellProps) {
  return (
    <div
      className={cn(
        "grid gap-8 xl:grid-cols-[minmax(15rem,17.5rem)_minmax(0,1fr)] xl:items-start",
        className,
      )}
    >
      <aside className="min-w-0 space-y-2.5 xl:sticky xl:top-6">{sidebar}</aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
