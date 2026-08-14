import {
  eventLabel,
  type NotificationEventType,
  type NotificationPreferences,
} from "@/lib/notifications/types";

const WEBHOOK_HOST = "chat.googleapis.com";

export type GoogleChatDeliveryMode = "webhook" | "none";

export type GoogleChatSendResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "provider_error" };

export type GoogleChatCardInput = {
  eventType: NotificationEventType;
  title: string;
  body: string;
  href?: string | null;
  recipientLabel?: string | null;
};

export type GoogleChatCardPayload = {
  text: string;
  cardsV2: Array<{
    cardId: string;
    card: {
      header: { title: string; subtitle: string };
      sections: Array<{
        widgets: Array<{
          decoratedText?: { topLabel: string; text: string; wrapText: boolean };
          textParagraph?: { text: string };
          buttonList?: {
            buttons: Array<{
              text: string;
              onClick: { openLink: { url: string } };
            }>;
          };
        }>;
      }>;
    };
  }>;
};

function enabledFlag() {
  return process.env.GOOGLE_CHAT_ENABLED === "true";
}

export function isGoogleChatWebhookUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === WEBHOOK_HOST &&
      url.pathname.includes("/spaces/") &&
      url.pathname.endsWith("/messages")
    );
  } catch {
    return false;
  }
}

export function googleChatDeliveryMode(): GoogleChatDeliveryMode {
  const webhook = process.env.GOOGLE_CHAT_WEBHOOK_URL?.trim() ?? "";
  if (enabledFlag() && isGoogleChatWebhookUrl(webhook)) {
    return "webhook";
  }
  return "none";
}

export function isGoogleChatConfigured() {
  return googleChatDeliveryMode() !== "none";
}

export function absoluteAppUrl(href?: string | null) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!href) return appUrl;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  return `${appUrl}${href}`;
}

export function wantsGoogleChat(
  prefs: NotificationPreferences,
  eventType: NotificationEventType,
) {
  switch (eventType) {
    case "task_assigned":
      return prefs.chatAssignment;
    case "task_mentioned":
      return prefs.chatMention;
    case "task_due_soon":
      return prefs.chatDueSoon;
    case "task_overdue":
      return prefs.chatOverdue;
    case "task_status_changed":
    case "invite":
      return false;
    default: {
      const _exhaustive: never = eventType;
      return _exhaustive;
    }
  }
}

export function buildGoogleChatCardPayload(
  input: GoogleChatCardInput,
): GoogleChatCardPayload {
  const link = absoluteAppUrl(input.href);
  const topLabel = input.recipientLabel
    ? `For ${input.recipientLabel}`
    : eventLabel(input.eventType);

  return {
    text: `${input.title}\n${input.body}\n${link}`,
    cardsV2: [
      {
        cardId: "nestflow-notification",
        card: {
          header: {
            title: "NestFlow",
            subtitle: eventLabel(input.eventType),
          },
          sections: [
            {
              widgets: [
                {
                  decoratedText: {
                    topLabel,
                    text: input.title,
                    wrapText: true,
                  },
                },
                {
                  textParagraph: {
                    text: input.body,
                  },
                },
                {
                  buttonList: {
                    buttons: [
                      {
                        text: "Open in NestFlow",
                        onClick: {
                          openLink: {
                            url: link,
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

export async function sendGoogleChatToUser(params: {
  eventType: NotificationEventType;
  title: string;
  body: string;
  href?: string | null;
  recipientLabel?: string | null;
}): Promise<GoogleChatSendResult> {
  const mode = googleChatDeliveryMode();
  switch (mode) {
    case "none":
      return { sent: false, reason: "not_configured" };
    case "webhook":
      return sendGoogleChatWebhook(params);
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

async function sendGoogleChatWebhook(
  params: GoogleChatCardInput,
): Promise<GoogleChatSendResult> {
  const webhook = process.env.GOOGLE_CHAT_WEBHOOK_URL?.trim();
  if (!webhook || !isGoogleChatWebhookUrl(webhook)) {
    return { sent: false, reason: "not_configured" };
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(buildGoogleChatCardPayload(params)),
    });

    if (!response.ok) {
      console.error("Google Chat webhook failed", {
        status: response.status,
        eventType: params.eventType,
      });
      return { sent: false, reason: "provider_error" };
    }

    return { sent: true };
  } catch (error) {
    console.error("Google Chat webhook threw", {
      eventType: params.eventType,
      error: error instanceof Error ? error.message : "unknown",
    });
    return { sent: false, reason: "provider_error" };
  }
}
