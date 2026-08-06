"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Columns3,
  LayoutGrid,
  List,
  ListTodo,
  Menu,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { NestFlowMark } from "@/components/auth/nestflow-mark";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkspaceIsland } from "@/components/workspace/workspace-island";
import { signOutAction } from "@/lib/auth/actions";
import type { NavIcon, NavItem } from "@/lib/auth/navigation";
import { primaryRole, roleLabel, type NestFlowProfile } from "@/lib/auth/types";
import type { NestFlowNotification } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

const navIcons: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutGrid,
  "my-tasks": ListTodo,
  board: Columns3,
  list: List,
  calendar: CalendarDays,
  team: Users,
  people: UserRound,
  admin: Settings,
};

function initials(profile: NestFlowProfile) {
  const source = profile.fullName?.trim() || profile.email || profile.nestId || "NF";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function isActivePath(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function IconRail({
  items,
  onNavigate,
  className,
}: {
  items: NavItem[];
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col items-center gap-2", className)}>
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = navIcons[item.icon];

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex size-11 items-center justify-center rounded-full transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {active ? (
                  <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background" />
                ) : null}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

export function AppShell({
  profile,
  navItems,
  notifications,
  unreadCount,
  children,
}: {
  profile: NestFlowProfile;
  navItems: NavItem[];
  notifications: NestFlowNotification[];
  unreadCount: number;
  children: React.ReactNode;
}) {
  const displayRole = roleLabel(primaryRole(profile.roles));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh max-h-dvh flex-1 overflow-hidden bg-background text-foreground">
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
        <IconRail items={navItems} className="flex-1" />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-40 shrink-0 border-b border-border/80 bg-background/90 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <div className="lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Open navigation"
                  >
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <NestFlowMark size="sm" />
                      NestFlow
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-8 flex justify-center">
                    <IconRail
                      items={navItems}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <WorkspaceIsland profile={profile} />

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell
                items={notifications}
                unreadCount={unreadCount}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 gap-2 rounded-full px-1.5 sm:px-2"
                  >
                    <Avatar className="size-8 ring-2 ring-border">
                      {profile.avatarUrl ? (
                        <AvatarImage src={profile.avatarUrl} alt="" />
                      ) : null}
                      <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                        {initials(profile)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="space-y-1">
                    <p className="truncate text-sm font-medium">
                      {profile.fullName ?? "NestFlow user"}
                    </p>
                    <p className="truncate text-xs font-normal text-muted-foreground">
                      {profile.nestId
                        ? `Nest ID ${profile.nestId}`
                        : profile.email}
                    </p>
                    <p className="text-xs font-normal text-muted-foreground">
                      {displayRole}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/app/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/notifications">Notifications</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      void signOutAction();
                    }}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
    </div>
  );
}
