import { NextResponse } from "next/server";

import { notifyUser } from "@/lib/notifications/notify";
import {
  digestHref,
  formatDigestBody,
  formatDigestTitle,
} from "@/lib/reports/digest";
import { digestPeriodsForToday } from "@/lib/reports/period";
import {
  buildPeriodReportForUserIds,
  listDigestRecipientIds,
  loadDigestScopeForUser,
} from "@/lib/reports/queries";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY is required for performance report digests.",
      },
      { status: 500 },
    );
  }

  // Ensure admin client is constructible (side-effect validation).
  createAdminClient();

  const now = new Date();
  const periods = digestPeriodsForToday(now);
  const recipients = await listDigestRecipientIds();

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const userId of recipients) {
    const scope = await loadDigestScopeForUser(userId);
    if (!scope) {
      skipped += 1;
      continue;
    }

    for (const kind of periods) {
      try {
        const report = await buildPeriodReportForUserIds({
          userIds: scope.people.map((person) => person.userId),
          people: scope.people,
          kind,
          scope: scope.scope,
        });

        const id = await notifyUser({
          userId,
          system: true,
          eventType: "performance_digest",
          title: formatDigestTitle(kind),
          body: formatDigestBody(report),
          href: digestHref(report),
          metadata: {
            period: kind,
            periodKey: report.period.periodKey,
            endingDate: report.period.endingDate,
            summary: report.summary,
          },
          idempotencyKey: `perf_digest:${kind}:${userId}:${report.period.periodKey}`,
        });

        if (id) {
          sent += 1;
        } else {
          skipped += 1;
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown digest error";
        errors.push(`${userId}:${kind}:${message}`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    periods,
    recipients: recipients.length,
    sent,
    skipped,
    errors: errors.slice(0, 20),
  });
}

export async function GET(request: Request) {
  return POST(request);
}
