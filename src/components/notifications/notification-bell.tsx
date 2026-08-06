"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import {
  MarkAllReadButton,
  NotificationList,
} from "@/components/notifications/notification-list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NestFlowNotification } from "@/lib/notifications/types";

export function NotificationBell({
  items,
  unreadCount,
}: {
  items: NestFlowNotification[];
  unreadCount: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <MarkAllReadButton disabled={unreadCount === 0} />
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-1">
          <NotificationList items={items.slice(0, 8)} compact />
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Button asChild variant="ghost" className="w-full justify-center">
            <Link href="/app/notifications">View all</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
