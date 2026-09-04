import { Geist_Mono } from "next/font/google";

import { AppChromeGate } from "@/components/layout/app-chrome-gate";
import { AppSoundProvider } from "@/components/sounds/app-sound-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { homePathForRoles, navForRoles } from "@/lib/auth/navigation";
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
  const homeHref = homePathForRoles(profile.roles);

  return (
    <TooltipProvider delayDuration={200}>
      <AppSoundProvider>
        <AppChromeGate
          profile={profile}
          navItems={navItems}
          homeHref={homeHref}
          className={geistMono.variable}
        >
          {children}
        </AppChromeGate>
        {pane}
        <Toaster richColors closeButton position="top-right" />
      </AppSoundProvider>
    </TooltipProvider>
  );
}
