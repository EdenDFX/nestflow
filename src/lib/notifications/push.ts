import webpush from "web-push";

import { createClient } from "@/lib/supabase/server";

export function isWebPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

function configureWebPush() {
  if (!isWebPushConfigured()) {
    throw new Error("Web Push is not configured.");
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

export async function sendWebPushToUser(params: {
  userId: string;
  title: string;
  body: string;
  href?: string | null;
}) {
  if (!isWebPushConfigured()) {
    return { sent: 0, reason: "not_configured" as const };
  }

  configureWebPush();
  const supabase = await createClient();
  const { data: subs, error } = await supabase
    .from("nf_push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", params.userId);

  if (error || !subs || subs.length === 0) {
    return { sent: 0, reason: "no_subscriptions" as const };
  }

  const payload = JSON.stringify({
    title: params.title,
    body: params.body,
    href: params.href ?? "/app/notifications",
  });

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload,
      );
      sent += 1;
      await supabase
        .from("nf_push_subscriptions")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", sub.id);
    } catch (error) {
      const statusCode =
        typeof error === "object" &&
        error &&
        "statusCode" in error &&
        typeof (error as { statusCode?: number }).statusCode === "number"
          ? (error as { statusCode: number }).statusCode
          : null;

      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("nf_push_subscriptions").delete().eq("id", sub.id);
      } else {
        console.error("Web Push send failed", error);
      }
    }
  }

  return { sent, reason: "ok" as const };
}

/** Cron/service-role path: send using admin client rows already loaded */
export async function sendWebPushPayload(params: {
  endpoint: string;
  p256dh: string;
  auth: string;
  title: string;
  body: string;
  href?: string | null;
}) {
  if (!isWebPushConfigured()) {
    return { ok: false as const };
  }
  configureWebPush();
  try {
    await webpush.sendNotification(
      {
        endpoint: params.endpoint,
        keys: {
          p256dh: params.p256dh,
          auth: params.auth,
        },
      },
      JSON.stringify({
        title: params.title,
        body: params.body,
        href: params.href ?? "/app/notifications",
      }),
    );
    return { ok: true as const };
  } catch (error) {
    console.error("Web Push send failed", error);
    return { ok: false as const, error };
  }
}
