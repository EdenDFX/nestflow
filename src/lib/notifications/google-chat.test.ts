import { afterEach, describe, expect, it } from "vitest";

import {
  absoluteAppUrl,
  buildGoogleChatCardPayload,
  googleChatDeliveryMode,
  isGoogleChatConfigured,
  isGoogleChatWebhookUrl,
  wantsGoogleChat,
} from "@/lib/notifications/google-chat";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_EVENT_TYPES,
  type NotificationEventType,
  type NotificationPreferences,
} from "@/lib/notifications/types";

const SAMPLE_WEBHOOK =
  "https://chat.googleapis.com/v1/spaces/SPACE_ID/messages?key=KEY&token=TOKEN";

const prefs: NotificationPreferences = {
  userId: "u1",
  ...DEFAULT_NOTIFICATION_PREFERENCES,
};

describe("isGoogleChatWebhookUrl", () => {
  it("accepts Chat space incoming webhook URLs", () => {
    expect(isGoogleChatWebhookUrl(SAMPLE_WEBHOOK)).toBe(true);
  });

  it("rejects non-Chat URLs", () => {
    expect(isGoogleChatWebhookUrl("https://example.com/hook")).toBe(false);
    expect(isGoogleChatWebhookUrl("not-a-url")).toBe(false);
  });
});

describe("googleChatDeliveryMode", () => {
  const previousEnabled = process.env.GOOGLE_CHAT_ENABLED;
  const previousWebhook = process.env.GOOGLE_CHAT_WEBHOOK_URL;

  afterEach(() => {
    if (previousEnabled === undefined) {
      delete process.env.GOOGLE_CHAT_ENABLED;
    } else {
      process.env.GOOGLE_CHAT_ENABLED = previousEnabled;
    }
    if (previousWebhook === undefined) {
      delete process.env.GOOGLE_CHAT_WEBHOOK_URL;
    } else {
      process.env.GOOGLE_CHAT_WEBHOOK_URL = previousWebhook;
    }
  });

  it("is none when env is missing", () => {
    delete process.env.GOOGLE_CHAT_ENABLED;
    delete process.env.GOOGLE_CHAT_WEBHOOK_URL;
    expect(googleChatDeliveryMode()).toBe("none");
    expect(isGoogleChatConfigured()).toBe(false);
  });

  it("is webhook when enabled with a valid URL", () => {
    process.env.GOOGLE_CHAT_ENABLED = "true";
    process.env.GOOGLE_CHAT_WEBHOOK_URL = SAMPLE_WEBHOOK;
    expect(googleChatDeliveryMode()).toBe("webhook");
    expect(isGoogleChatConfigured()).toBe(true);
  });
});

describe("buildGoogleChatCardPayload", () => {
  it("builds a Cards V2 payload with an absolute Open in NestFlow link", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://tasks.nestbyeden.app";
    const payload = buildGoogleChatCardPayload({
      eventType: "task_assigned",
      title: "You were assigned a task",
      body: "Design the homepage",
      href: "/app/tasks/task-1",
      recipientLabel: "adaeze@nestbyeden.com",
    });

    expect(payload.cardsV2[0]?.card.header.title).toBe("NestFlow");
    expect(payload.cardsV2[0]?.card.header.subtitle).toBe("Assignment");
    const button =
      payload.cardsV2[0]?.card.sections[0]?.widgets[2]?.buttonList?.buttons[0];
    expect(button?.text).toBe("Open in NestFlow");
    expect(button?.onClick.openLink.url).toBe(
      "https://tasks.nestbyeden.app/app/tasks/task-1",
    );
    expect(payload.text).toContain("Design the homepage");
  });

  it("leaves already-absolute hrefs unchanged", () => {
    expect(absoluteAppUrl("https://tasks.nestbyeden.app/app/tasks/a")).toBe(
      "https://tasks.nestbyeden.app/app/tasks/a",
    );
  });
});

describe("wantsGoogleChat", () => {
  it("gates operational events and skips status and invite", () => {
    const expected: Record<NotificationEventType, boolean> = {
      task_assigned: true,
      task_mentioned: true,
      task_due_soon: true,
      task_overdue: true,
      task_status_changed: false,
      invite: false,
      performance_digest: false,
    };

    for (const eventType of NOTIFICATION_EVENT_TYPES) {
      expect(wantsGoogleChat(prefs, eventType)).toBe(expected[eventType]);
    }
  });

  it("respects a disabled Chat assignment preference", () => {
    expect(
      wantsGoogleChat({ ...prefs, chatAssignment: false }, "task_assigned"),
    ).toBe(false);
  });
});
