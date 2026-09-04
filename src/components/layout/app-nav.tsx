"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";

import { AlignLeftIcon } from "@/components/icons/align-left";
import { CalendarDaysIcon } from "@/components/icons/calendar-days";
import { ChartColumnIncreasingIcon } from "@/components/icons/chart-column-increasing";
import { ClipboardCheckIcon } from "@/components/icons/clipboard-check";
import { FolderKanbanIcon } from "@/components/icons/folder-kanban";
import { LayersIcon } from "@/components/icons/layers";
import { LayoutGridIcon } from "@/components/icons/layout-grid";
import { MenuIcon } from "@/components/icons/menu";
import { UserIcon } from "@/components/icons/user";
import { UsersIcon } from "@/components/icons/users";

import { NestFlowMark } from "@/components/auth/nestflow-mark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOutAction } from "@/lib/auth/actions";
import type { NavIcon, NavItem } from "@/lib/auth/navigation";
import { profileInitials } from "@/lib/auth/profile-initials";
import { primaryRole, roleLabel, type NestFlowProfile } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

type RailIcon = ComponentType<{ className?: string; size?: number }>;

const navIcons: Record<NavIcon, RailIcon> = {
  dashboard: LayoutGridIcon,
  "my-tasks": ClipboardCheckIcon,
  work: FolderKanbanIcon,
  board: FolderKanbanIcon,
  list: AlignLeftIcon,
  calendar: CalendarDaysIcon,
  team: UsersIcon,
  people: UserIcon,
  admin: LayersIcon,
  reports: ChartColumnIncreasingIcon,
  discussions: AlignLeftIcon,
};

function isActivePath(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavRail({
  items,
  className,
}: {
  items: NavItem[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex w-full flex-col items-center gap-1.5 px-2",
        className,
      )}
    >
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = navIcons[item.icon];

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex size-11 items-center justify-center rounded-2xl transition-[color,background-color,box-shadow] duration-200",
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_10px_24px_-14px_rgba(255,99,0,0.95)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="inline-flex" size={18} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

function MobileNavList({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = navIcons[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-[0_10px_24px_-12px_rgba(255,99,0,0.85)]"
                : "text-foreground hover:bg-muted",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                active
                  ? "bg-white/15 text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground",
              )}
            >
              <Icon className="inline-flex" size={18} />
            </span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {active ? (
              <span
                className="size-1.5 shrink-0 rounded-full bg-primary-foreground/90"
                aria-hidden
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppMobileNav({
  profile,
  navItems,
  homeHref,
}: {
  profile: NestFlowProfile;
  navItems: NavItem[];
  homeHref: string;
}) {
  const [open, setOpen] = useState(false);
  const displayRole = roleLabel(primaryRole(profile.roles));

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Open navigation">
            <MenuIcon className="inline-flex" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[min(100%,20rem)] gap-0 border-border/80 p-0 sm:max-w-xs"
        >
          <SheetHeader className="border-b border-border/80 px-5 py-5 text-left">
            <div className="flex items-center gap-3 pr-8">
              <Link
                href={homeHref}
                aria-label="NestFlow home"
                onClick={() => setOpen(false)}
              >
                <NestFlowMark size="sm" className="rounded-xl" />
              </Link>
              <div className="min-w-0">
                <SheetTitle className="font-heading text-lg font-semibold tracking-tight">
                  NestFlow
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Plan. Assign. Deliver.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="nf-scroll flex-1 overflow-y-auto py-4">
            <MobileNavList items={navItems} onNavigate={() => setOpen(false)} />
          </div>

          <SheetFooter className="border-t border-border/80 bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 shrink-0 ring-2 ring-border">
                {profile.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {profileInitials(profile)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {profile.fullName ?? "NestFlow user"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {displayRole}
                  {profile.nestId ? ` · ${profile.nestId}` : ""}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/profile" onClick={() => setOpen(false)}>
                  Profile
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  setOpen(false);
                  void signOutAction();
                }}
              >
                Sign out
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
