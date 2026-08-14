import { Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { navForRoles } from "@/lib/auth/navigation";
import { requireActiveProfile } from "@/lib/auth/session";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export default async function AuthenticatedLayout({
  children,
  pane,
}: Readonly<{
  children: React.ReactNode;
  pane: React.ReactNode;
}>) {
  const profile = await requireActiveProfile();
  const navItems = navForRoles(profile.roles);

  return (
    <TooltipProvider delayDuration={200}>
      <AppShell
        profile={profile}
        navItems={navItems}
        className={geistMono.variable}
      >
        {children}
      </AppShell>
      {pane}
      <Toaster richColors closeButton position="top-right" />
    </TooltipProvider>
  );
}
