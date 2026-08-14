import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

export function isSentryConfigured() {
  return Boolean(dsn);
}

export function initSentryServer() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    enabled: process.env.NODE_ENV === "production" || Boolean(process.env.SENTRY_ENABLE_DEV),
  });
}

export function initSentryClient() {
  if (!dsn) return;

  const pathname = window.location.pathname;
  if (pathname === "/" || pathname === "/login") {
    return;
  }

  const init = () => {
    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
      enabled: process.env.NODE_ENV === "production" || Boolean(process.env.SENTRY_ENABLE_DEV),
    });
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(init, { timeout: 3000 });
    return;
  }

  window.setTimeout(init, 1);
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!isSentryConfigured()) {
    console.error(error);
    return;
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
