"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { NestFlowMark } from "@/components/auth/nestflow-mark";
import { AppUserMenu } from "@/components/layout/app-user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SearchTrigger } from "@/components/search/search-trigger";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { NavItem } from "@/lib/auth/navigation";
import type { NestFlowProfile } from "@/lib/auth/types";
import type { NestFlowNotification } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

import {
  AdminSectionTabs,
  type AdminSectionTab,
} from "./ui/admin-section-tabs";

type AdminDashboardHeaderProps = {
  profile: NestFlowProfile;
  homeHref: string;
  routeLinks: NavItem[];
  notifications: NestFlowNotification[];
  notificationUnreadCount: number;
  sectionTabs?: AdminSectionTab[];
  sectionTab?: string;
  onSectionTabChange?: (id: string) => void;
  center?: ReactNode;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Tasky-style top bar: brand, optional center slot, utilities. */
export function AdminDashboardHeader({
  profile,
  homeHref,
  routeLinks,
  notifications,
  notificationUnreadCount,
  sectionTabs,
  sectionTab,
  onSectionTabChange,
  center,
}: AdminDashboardHeaderProps) {
  const pathname = usePathname();

  const centerContent =
    center ??
    (sectionTabs && sectionTab && onSectionTabChange ? (
      <AdminSectionTabs
        tabs={sectionTabs}
        value={sectionTab}
        onChange={onSectionTabChange}
        variant="dashboard"
      />
    ) : null);

  return (
    <header className="admin-dashboard__header">
      <div className="admin-dashboard__brand">
        <Link href={homeHref} className="admin-dashboard__logo" aria-label="NestFlow home">
          <NestFlowMark size="sm" className="rounded-2xl" />
          <span className="admin-dashboard__wordmark">NestFlow</span>
        </Link>
        <nav aria-label="Admin routes" className="admin-dashboard__route-links">
          {routeLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "admin-dashboard__route-link",
                isActivePath(pathname, item.href) && "is-active",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="admin-dashboard__tabs">{centerContent}</div>

      <div className="admin-dashboard__tools">
        <SearchTrigger />
        <ThemeToggle />
        <NotificationBell
          items={notifications}
          unreadCount={notificationUnreadCount}
        />
        <AppUserMenu profile={profile} />
      </div>
    </header>
  );
}
