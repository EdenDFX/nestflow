import * as Sentry from "@sentry/nextjs";

import { initSentryClient } from "@/lib/observability/sentry";

initSentryClient();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
