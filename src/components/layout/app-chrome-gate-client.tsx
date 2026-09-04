"use client";

import { usePathname } from "next/navigation";

import { isAdminChromePath } from "@/lib/admin/chrome-paths";

/** Chooses pre-rendered shell trees without importing server modules on the client. */
export function AppChromeGateClient({
  enabled,
  appShell,
  adminShell,
}: {
  enabled: boolean;
  appShell: React.ReactNode;
  adminShell: React.ReactNode;
}) {
  const pathname = usePathname();
  const useAdminChrome = enabled && isAdminChromePath(pathname);
  return useAdminChrome ? adminShell : appShell;
}
