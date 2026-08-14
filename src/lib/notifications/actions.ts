"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireActiveProfile } from "@/lib/auth/session";
import { isWebPushConfigured } from "@/lib/notifications/push";
import { createClient } from "@/lib/supabase/server";

export type NotificationActionResult = {
  ok: boolean;
  error?: string;
  code?: string;
};

function revalidateNotificationPaths() {
  revalidatePath("/app");
  revalidatePath("/app/notifications");
  revalidatePath("/app/profile");
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<NotificationActionResult> {
  await requireActiveProfile();
  const parsed = z.string().uuid().safeParse(notificationId);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid notification." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("nf_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .is("read_at", null);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  revalidateNotificationPaths();
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  const profile = await requireActiveProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("nf_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.userId)
    .is("read_at", null);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  revalidateNotificationPaths();
  return { ok: true };
}

const preferencesSchema = z.object({
  emailAssignment: z.boolean(),
  emailMention: z.boolean(),
  emailDueSoon: z.boolean(),
  emailOverdue: z.boolean(),
  pushAssignment: z.boolean(),
  pushMention: z.boolean(),
  pushOverdue: z.boolean(),
  chatAssignment: z.boolean(),
  chatMention: z.boolean(),
  chatDueSoon: z.boolean(),
  chatOverdue: z.boolean(),
});

export async function updateNotificationPreferencesAction(
  input: z.infer<typeof preferencesSchema>,
): Promise<NotificationActionResult> {
  const profile = await requireActiveProfile();
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid preferences." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("nf_notification_preferences").upsert(
    {
      user_id: profile.userId,
      email_assignment: parsed.data.emailAssignment,
      email_mention: parsed.data.emailMention,
      email_due_soon: parsed.data.emailDueSoon,
      email_overdue: parsed.data.emailOverdue,
      push_assignment: parsed.data.pushAssignment,
      push_mention: parsed.data.pushMention,
      push_overdue: parsed.data.pushOverdue,
      chat_assignment: parsed.data.chatAssignment,
      chat_mention: parsed.data.chatMention,
      chat_due_soon: parsed.data.chatDueSoon,
      chat_overdue: parsed.data.chatOverdue,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  revalidateNotificationPaths();
  return { ok: true };
}

const pushSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function subscribePushAction(
  input: z.infer<typeof pushSchema>,
): Promise<NotificationActionResult> {
  const profile = await requireActiveProfile();

  if (!isWebPushConfigured()) {
    return {
      ok: false,
      code: "INTERNAL",
      error: "Web Push is not configured. Add VAPID keys to enable browser alerts.",
    };
  }

  const parsed = pushSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid push subscription." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("nf_push_subscriptions").upsert(
    {
      user_id: profile.userId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      user_agent: null,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  revalidateNotificationPaths();
  return { ok: true };
}

export async function unsubscribePushAction(
  endpoint?: string,
): Promise<NotificationActionResult> {
  const profile = await requireActiveProfile();
  const supabase = await createClient();

  let query = supabase
    .from("nf_push_subscriptions")
    .delete()
    .eq("user_id", profile.userId);

  if (endpoint) {
    query = query.eq("endpoint", endpoint);
  }

  const { error } = await query;
  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  revalidateNotificationPaths();
  return { ok: true };
}

export async function getPushConfigAction() {
  await requireActiveProfile();
  return {
    configured: isWebPushConfigured(),
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
  };
}
