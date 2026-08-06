import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";
import { requireActiveProfile } from "@/lib/auth/session";
import { roleLabel } from "@/lib/auth/types";
import {
  getNotificationPreferences,
  listPushSubscriptionCount,
} from "@/lib/notifications/queries";
import { isResendConfigured } from "@/lib/notifications/email";
import { isWebPushConfigured } from "@/lib/notifications/push";

export default async function ProfilePage() {
  const profile = await requireActiveProfile();
  const [preferences, pushSubscriptionCount] = await Promise.all([
    getNotificationPreferences(profile.userId),
    listPushSubscriptionCount(profile.userId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Profile
        </h1>
        <p className="text-muted-foreground">
          Your NestFlow identity and notification preferences.
        </p>
      </div>

      <dl className="space-y-4 rounded-xl border border-border/80 p-5">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Full name
          </dt>
          <dd className="mt-1 text-sm">{profile.fullName ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Nest ID
          </dt>
          <dd className="mt-1 font-mono text-sm">{profile.nestId ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Email
          </dt>
          <dd className="mt-1 text-sm">{profile.email ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Department
          </dt>
          <dd className="mt-1 text-sm">{profile.department ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            NestFlow roles
          </dt>
          <dd className="mt-1 text-sm">
            {profile.roles.map((role) => roleLabel(role)).join(", ")}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Delivery status
          </dt>
          <dd className="mt-1 text-sm text-muted-foreground">
            Email {isResendConfigured() ? "ready" : "not configured"} · Push{" "}
            {isWebPushConfigured() ? "ready" : "not configured"}
          </dd>
        </div>
      </dl>

      <div className="rounded-xl border border-border/80 p-5">
        <NotificationPreferencesForm
          preferences={preferences}
          pushSubscriptionCount={pushSubscriptionCount}
        />
      </div>
    </div>
  );
}
