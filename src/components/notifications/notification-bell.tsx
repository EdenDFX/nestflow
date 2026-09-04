"use client";

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
import { NotificationBell as NotificationBellTrigger } from "@/components/ui/notification-bell";
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
        <NotificationBellTrigger count={unreadCount} max={9} size={32} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Inbox</DropdownMenuLabel>
          <MarkAllReadButton disabled={unreadCount === 0} />
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-1">
          <NotificationList items={items.slice(0, 8)} compact />
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Button asChild variant="ghost" className="w-full justify-center">
            <Link href="/app/notifications">Open inbox</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
