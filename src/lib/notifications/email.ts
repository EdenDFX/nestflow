import { Resend } from "resend";

import type { NotificationEventType } from "@/lib/notifications/types";

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function getResend() {
  if (!isResendConfigured()) {
    throw new Error("Resend is not configured.");
  }
  return new Resend(process.env.RESEND_API_KEY!);
}

export async function sendNotificationEmail(params: {
  to: string;
  eventType: NotificationEventType;
  title: string;
  body: string;
  href?: string | null;
}) {
  if (!isResendConfigured()) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = params.href
    ? params.href.startsWith("http")
      ? params.href
      : `${appUrl}${params.href}`
    : appUrl;

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `[NestFlow] ${params.title}`,
    html: `
      <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
        <p style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #FF6300;">
          NestFlow
        </p>
        <h1 style="font-size: 20px; margin: 8px 0 12px;">${escapeHtml(params.title)}</h1>
        <p style="margin: 0 0 16px; white-space: pre-line;">${escapeHtml(params.body)}</p>
        <p>
          <a href="${escapeHtml(link)}" style="color: #FF6300;">Open in NestFlow</a>
        </p>
      </div>
    `,
    text: `${params.title}\n\n${params.body}\n\n${link}`,
  });

  if (error) {
    console.error("Resend send failed", error);
    return { sent: false as const, reason: "provider_error" as const };
  }

  return { sent: true as const };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
