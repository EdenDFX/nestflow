"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getPushConfigAction,
  subscribePushAction,
  unsubscribePushAction,
  updateNotificationPreferencesAction,
} from "@/lib/notifications/actions";
import type { NotificationPreferences } from "@/lib/notifications/types";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationPreferencesForm({
  preferences,
  pushSubscriptionCount,
}: {
  preferences: NotificationPreferences;
  pushSubscriptionCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [prefs, setPrefs] = useState(preferences);
  const [pushBusy, setPushBusy] = useState(false);

  function updatePref<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) {
    setPrefs((current) => ({ ...current, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const result = await updateNotificationPreferencesAction({
        emailAssignment: prefs.emailAssignment,
        emailMention: prefs.emailMention,
        emailDueSoon: prefs.emailDueSoon,
        emailOverdue: prefs.emailOverdue,
        pushAssignment: prefs.pushAssignment,
        pushMention: prefs.pushMention,
        pushOverdue: prefs.pushOverdue,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not save preferences.");
        return;
      }
      toast.success("Notification preferences saved.");
      router.refresh();
    });
  }

  async function enablePush() {
    setPushBusy(true);
    try {
      const config = await getPushConfigAction();
      if (!config.configured || !config.publicKey) {
        toast.error("Web Push is not configured on the server yet.");
        return;
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        toast.error("This browser does not support Web Push.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission was not granted.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey),
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        toast.error("Could not read push subscription keys.");
        return;
      }

      const result = await subscribePushAction({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
      });

      if (!result.ok) {
        toast.error(result.error ?? "Could not save push subscription.");
        return;
      }

      toast.success("Browser push enabled.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not enable push.",
      );
    } finally {
      setPushBusy(false);
    }
  }

  async function disablePush() {
    setPushBusy(true);
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await unsubscribePushAction(subscription.endpoint);
        } else {
          await unsubscribePushAction();
        }
      } else {
        await unsubscribePushAction();
      }
      toast.success("Browser push disabled.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not disable push.",
      );
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">Email</h2>
          <p className="text-sm text-muted-foreground">
            Delivered via Resend when configured. Invite mail stays on.
          </p>
        </div>
        <PrefRow
          label="Assignments"
          checked={prefs.emailAssignment}
          onCheckedChange={(value) => updatePref("emailAssignment", value)}
        />
        <PrefRow
          label="Mentions"
          checked={prefs.emailMention}
          onCheckedChange={(value) => updatePref("emailMention", value)}
        />
        <PrefRow
          label="Due soon"
          checked={prefs.emailDueSoon}
          onCheckedChange={(value) => updatePref("emailDueSoon", value)}
        />
        <PrefRow
          label="Overdue"
          checked={prefs.emailOverdue}
          onCheckedChange={(value) => updatePref("emailOverdue", value)}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">Web push</h2>
          <p className="text-sm text-muted-foreground">
            Browser alerts for assignment, mention, and overdue. Requires VAPID
            keys and permission.
          </p>
        </div>
        <PrefRow
          label="Assignments"
          checked={prefs.pushAssignment}
          onCheckedChange={(value) => updatePref("pushAssignment", value)}
        />
        <PrefRow
          label="Mentions"
          checked={prefs.pushMention}
          onCheckedChange={(value) => updatePref("pushMention", value)}
        />
        <PrefRow
          label="Overdue"
          checked={prefs.pushOverdue}
          onCheckedChange={(value) => updatePref("pushOverdue", value)}
        />
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={pushBusy}
            onClick={() => void enablePush()}
          >
            Enable browser push
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pushBusy || pushSubscriptionCount === 0}
            onClick={() => void disablePush()}
          >
            Disable
          </Button>
          <p className="text-xs text-muted-foreground">
            {pushSubscriptionCount > 0
              ? `${pushSubscriptionCount} active subscription${pushSubscriptionCount === 1 ? "" : "s"}`
              : "No active browser subscriptions"}
          </p>
        </div>
      </section>

      <Button type="button" onClick={save} disabled={pending}>
        Save preferences
      </Button>
    </div>
  );
}

function PrefRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 px-3 py-2.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
