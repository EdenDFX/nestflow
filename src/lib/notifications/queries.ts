import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  isNotificationEventType,
  type NestFlowNotification,
  type NotificationPreferences,
} from "@/lib/notifications/types";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  full_name: string | null;
};

export async function listNotifications(limit = 40): Promise<{
  items: NestFlowNotification[];
  unreadCount: number;
}> {
  const supabase = await createClient();

  const [{ data: rows, error }, { count, error: countError }] =
    await Promise.all([
      supabase
        .from("nf_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("nf_notifications")
        .select("*", { count: "exact", head: true })
        .is("read_at", null),
    ]);

  if (error) throw new Error(error.message);
  if (countError) throw new Error(countError.message);

  const actorIds = [
    ...new Set(
      (rows ?? [])
        .map((row) => row.actor_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  let profiles = new Map<string, ProfileRow>();
  if (actorIds.length > 0) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);
    profiles = new Map(
      (profileRows ?? []).map((row: ProfileRow) => [row.id, row]),
    );
  }

  const items: NestFlowNotification[] = (rows ?? []).flatMap((row) => {
    if (!isNotificationEventType(row.event_type)) return [];
    const actor = row.actor_id ? profiles.get(row.actor_id) : null;
    return [
      {
        id: row.id,
        userId: row.user_id,
        actorId: row.actor_id,
        actorName: actor?.full_name ?? null,
        eventType: row.event_type,
        title: row.title,
        body: row.body ?? "",
        taskId: row.task_id,
        href: row.href,
        metadata: (row.metadata ?? {}) as Record<string, unknown>,
        readAt: row.read_at,
        createdAt: row.created_at,
      },
    ];
  });

  return { items, unreadCount: count ?? 0 };
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("nf_notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("nf_notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return { userId, ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  return {
    userId: data.user_id,
    emailAssignment: data.email_assignment,
    emailMention: data.email_mention,
    emailDueSoon: data.email_due_soon,
    emailOverdue: data.email_overdue,
    emailPerformanceDigest: Boolean(data.email_performance_digest ?? true),
    pushAssignment: data.push_assignment,
    pushMention: data.push_mention,
    pushOverdue: data.push_overdue,
    pushPerformanceDigest: Boolean(data.push_performance_digest ?? true),
    chatAssignment: Boolean(data.chat_assignment ?? true),
    chatMention: Boolean(data.chat_mention ?? true),
    chatDueSoon: Boolean(data.chat_due_soon ?? true),
    chatOverdue: Boolean(data.chat_overdue ?? true),
  };
}

export async function listPushSubscriptionCount(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("nf_push_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
