import { AdminMainShell } from "@/components/layout/admin-main-shell";
import { AppChromeGateClient } from "@/components/layout/app-chrome-gate-client";
import { AppShell } from "@/components/layout/app-shell";
import type { NavItem } from "@/lib/auth/navigation";
import type { NestFlowProfile } from "@/lib/auth/types";

/** Renders full app chrome everywhere except the standalone admin suite. */
export function AppChromeGate({
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
  const enabled = profile.roles.includes("admin");

  return (
    <AppChromeGateClient
      enabled={enabled}
      appShell={
        <AppShell
          profile={profile}
          navItems={navItems}
          homeHref={homeHref}
          className={className}
        >
          {children}
        </AppShell>
      }
      adminShell={
        <AdminMainShell className={className}>{children}</AdminMainShell>
      }
    />
  );
}
