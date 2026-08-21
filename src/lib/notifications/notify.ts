import { sendNotificationEmail } from "@/lib/notifications/email";
import {
  sendGoogleChatToUser,
  wantsGoogleChat,
} from "@/lib/notifications/google-chat";
import {
  sendWebPushPayload,
  sendWebPushToUser,
} from "@/lib/notifications/push";
import type {
  NotificationEventType,
  NotificationPreferences,
} from "@/lib/notifications/types";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notifications/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type EmitParams = {
  userId: string;
  eventType: NotificationEventType;
  title: string;
  body: string;
  taskId?: string | null;
  href?: string | null;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string | null;
  /** Cron / service-role path (no user session). */
  system?: boolean;
};

function mapPreferences(
  userId: string,
  data: Record<string, unknown> | null,
): NotificationPreferences {
  if (!data) {
    return { userId, ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
  return {
    userId,
    emailAssignment: Boolean(data.email_assignment ?? true),
    emailMention: Boolean(data.email_mention ?? true),
    emailDueSoon: Boolean(data.email_due_soon ?? true),
    emailOverdue: Boolean(data.email_overdue ?? true),
    emailPerformanceDigest: Boolean(data.email_performance_digest ?? true),
    pushAssignment: Boolean(data.push_assignment ?? true),
    pushMention: Boolean(data.push_mention ?? true),
    pushOverdue: Boolean(data.push_overdue ?? true),
    pushPerformanceDigest: Boolean(data.push_performance_digest ?? true),
    chatAssignment: Boolean(data.chat_assignment ?? true),
    chatMention: Boolean(data.chat_mention ?? true),
    chatDueSoon: Boolean(data.chat_due_soon ?? true),
    chatOverdue: Boolean(data.chat_overdue ?? true),
  };
}

function wantsEmail(
  prefs: NotificationPreferences,
  eventType: NotificationEventType,
) {
  switch (eventType) {
    case "task_assigned":
      return prefs.emailAssignment;
    case "task_mentioned":
      return prefs.emailMention;
    case "task_due_soon":
      return prefs.emailDueSoon;
    case "task_overdue":
      return prefs.emailOverdue;
    case "performance_digest":
      return prefs.emailPerformanceDigest;
    case "task_status_changed":
      return false;
    case "invite":
      return true;
    default: {
      const _exhaustive: never = eventType;
      return _exhaustive;
    }
  }
}

function wantsPush(
  prefs: NotificationPreferences,
  eventType: NotificationEventType,
) {
  switch (eventType) {
    case "task_assigned":
      return prefs.pushAssignment;
    case "task_mentioned":
      return prefs.pushMention;
    case "task_overdue":
      return prefs.pushOverdue;
    case "performance_digest":
      return prefs.pushPerformanceDigest;
    case "task_due_soon":
    case "task_status_changed":
    case "invite":
      return false;
    default: {
      const _exhaustive: never = eventType;
      return _exhaustive;
    }
  }
}

async function loadPreferences(
  userId: string,
  system: boolean,
): Promise<NotificationPreferences> {
  if (system) {
    const admin = createAdminClient();
    if (!admin) {
      return { userId, ...DEFAULT_NOTIFICATION_PREFERENCES };
    }
    const { data } = await admin
      .schema("nestflow")
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return mapPreferences(userId, data);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("nf_notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return mapPreferences(userId, data);
}

async function resolveRecipientProfile(userId: string, system: boolean) {
  if (system) {
    const admin = createAdminClient();
    if (!admin) return null;
    const { data } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();
    return data ?? null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}

async function markChannelSent(
  notificationId: string,
  channel: "email" | "push" | "chat",
  system: boolean,
) {
  let column: "email_sent_at" | "push_sent_at" | "chat_sent_at";
  switch (channel) {
    case "email":
      column = "email_sent_at";
      break;
    case "push":
      column = "push_sent_at";
      break;
    case "chat":
      column = "chat_sent_at";
      break;
    default: {
      const _exhaustive: never = channel;
      return _exhaustive;
    }
  }
  const payload = { [column]: new Date().toISOString() };

  if (system) {
    const admin = createAdminClient();
    if (!admin) return;
    await admin
      .schema("nestflow")
      .from("notifications")
      .update(payload)
      .eq("id", notificationId);
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("nf_notifications")
    .update(payload)
    .eq("id", notificationId);
}

async function emitViaRpc(params: EmitParams): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("nestflow_emit_notification", {
    p_user_id: params.userId,
    p_event_type: params.eventType,
    p_title: params.title,
    p_body: params.body,
    p_task_id: params.taskId ?? null,
    p_href: params.href ?? null,
    p_metadata: params.metadata ?? {},
    p_idempotency_key: params.idempotencyKey ?? null,
  });

  if (error) {
    console.error("Failed to emit notification", error);
    return null;
  }
  return (data as string | null) ?? null;
}

async function emitViaAdmin(params: EmitParams): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) {
    console.error("System notify requires SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }

  if (
    params.idempotencyKey &&
    (params.eventType === "task_assigned" ||
      params.eventType === "task_mentioned" ||
      params.eventType === "task_status_changed")
  ) {
    // system events never skip self; overdue/due_soon always notify assignee
  }

  const { data, error } = await admin
    .schema("nestflow")
    .from("notifications")
    .insert({
      user_id: params.userId,
      actor_id: null,
      event_type: params.eventType,
      title: params.title,
      body: params.body,
      task_id: params.taskId ?? null,
      href: params.href ?? null,
      metadata: params.metadata ?? {},
      idempotency_key: params.idempotencyKey ?? null,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return null;
    }
    console.error("System notification insert failed", error);
    return null;
  }

  return data?.id ?? null;
}

async function deliverPush(
  params: EmitParams,
  notificationId: string,
  system: boolean,
) {
  if (!system) {
    const result = await sendWebPushToUser({
      userId: params.userId,
      title: params.title,
      body: params.body,
      href: params.href,
    });
    if (result.sent > 0) {
      await markChannelSent(notificationId, "push", false);
    }
    return;
  }

  const admin = createAdminClient();
  if (!admin) return;

  const { data: subs } = await admin
    .schema("nestflow")
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", params.userId);

  if (!subs || subs.length === 0) return;

  let sent = 0;
  for (const sub of subs) {
    const result = await sendWebPushPayload({
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      title: params.title,
      body: params.body,
      href: params.href,
    });
    if (result.ok) {
      sent += 1;
      await admin
        .schema("nestflow")
        .from("push_subscriptions")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", sub.id);
    }
  }

  if (sent > 0) {
    await markChannelSent(notificationId, "push", true);
  }
}

/**
 * Create an in-app notification and optionally deliver email / push / Chat.
 * Returns the new notification id, or null when skipped/duplicate.
 */
export async function notifyUser(params: EmitParams): Promise<string | null> {
  const system = Boolean(params.system);
  const notificationId = system
    ? await emitViaAdmin(params)
    : await emitViaRpc(params);

  if (!notificationId) {
    return null;
  }

  const prefs = await loadPreferences(params.userId, system);
  const recipient = await resolveRecipientProfile(params.userId, system);

  if (wantsEmail(prefs, params.eventType)) {
    const email = recipient?.email ?? null;
    if (email) {
      const result = await sendNotificationEmail({
        to: email,
        eventType: params.eventType,
        title: params.title,
        body: params.body,
        href: params.href,
      });
      if (result.sent) {
        await markChannelSent(notificationId, "email", system);
      }
    }
  }

  if (wantsPush(prefs, params.eventType)) {
    await deliverPush(params, notificationId, system);
  }

  if (wantsGoogleChat(prefs, params.eventType)) {
    const result = await sendGoogleChatToUser({
      eventType: params.eventType,
      title: params.title,
      body: params.body,
      href: params.href,
      recipientLabel: recipient?.full_name || recipient?.email || null,
    });
    if (result.sent) {
      await markChannelSent(notificationId, "chat", system);
    }
  }

  return notificationId;
}

export async function notifyMany(
  userIds: string[],
  params: Omit<EmitParams, "userId">,
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  const results: string[] = [];
  for (const userId of unique) {
    const id = await notifyUser({ ...params, userId });
    if (id) results.push(id);
  }
  return results;
}
