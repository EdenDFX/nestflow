"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/notifications/actions";
import { eventLabel, type NestFlowNotification } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export function NotificationList({
  items,
  compact = false,
}: {
  items: NestFlowNotification[];
  compact?: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-muted-foreground">
        No notifications yet.
      </p>
    );
  }

  return (
    <ul className={cn("space-y-1", compact && "max-h-80 overflow-y-auto")}>
      {items.map((item) => {
        const href = item.href ?? (item.taskId ? `/app/tasks/${item.taskId}` : "/app/notifications");
        const unread = !item.readAt;

        return (
          <li key={item.id}>
            <Link
              href={href}
              className={cn(
                "block rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/70",
                unread && "bg-primary/5",
              )}
              onClick={() => {
                if (unread) {
                  void markNotificationReadAction(item.id);
                }
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  {item.body ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {item.body}
                    </p>
                  ) : null}
                  <p className="text-[11px] text-muted-foreground">
                    {eventLabel(item.eventType)} ·{" "}
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {unread ? (
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function MarkAllReadButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled || pending}
      onClick={() => {
        startTransition(async () => {
          const result = await markAllNotificationsReadAction();
          if (!result.ok) {
            toast.error(result.error ?? "Could not mark notifications read.");
            return;
          }
          toast.success("All notifications marked read.");
          router.refresh();
        });
      }}
    >
      Mark all read
    </Button>
  );
}
